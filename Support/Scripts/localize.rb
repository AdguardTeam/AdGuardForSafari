#!/usr/bin/env ruby

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

# frozen_string_literal: true

require 'json'
require 'net/http'
require 'uri'
require 'pathname'
require 'rexml/document'
require 'tempfile'
require 'open3'
require 'logger'
require 'optparse'

LOGGER = Logger.new($stdout)
LOGGER.level = Logger::INFO

module AnsiColors
  RESET = "\e[0m"

  RED = "\e[31m"
  GREEN = "\e[32m"
  YELLOW = "\e[33m"
  MAGENTA = "\e[35m"
  CYAN = "\e[36m"
end

# ANSI color codes
COLORS = {
  'DEBUG' => AnsiColors::CYAN,
  'INFO' => '',
  'WARN' => AnsiColors::YELLOW,
  'ERROR' => AnsiColors::RED,
  'FATAL' => AnsiColors::MAGENTA
}.freeze

LOGGER.formatter = proc do |severity, datetime, progname, msg|
  color = COLORS[severity] || ''
  msg = "#{color}#{msg}#{AnsiColors::RESET}" if @colored_logs
  timestamp = datetime.strftime('%H:%M:%S')
  "[#{timestamp}] #{msg}\n"
end

class << LOGGER
  attr_accessor :colored_logs

  def fatal!(msg)
    fatal(msg)
    raise msg
  end

  def success(msg)
    msg = "#{AnsiColors::GREEN}#{msg}#{AnsiColors::RESET}" if @colored_logs
    info(msg)
  end

  def header(msg)
    opening = '--- '
    ending = ' ---'
    border = '-' * (msg.length + opening.length + ending.length)
    success(border)
    success("#{opening}#{msg}#{ending}")
    success(border)
  end
end

module TwoskyConfigKey
  PROJECT_ID = 'project_id'
  LANGUAGES = 'languages'
  BASE_LOCALE = 'base_locale'
  LOCALIZABLE_FILES = 'localizable_files'

  META = 'metadata'
  module Meta
    module Map
      FOLDERS = 'folders_map'
      FILENAME = 'filename_map'
    end
  end
end

module TwoskyMode
  IMPORT = 'Import'
  EXPORT = 'Export'
end

TwoskyMetaKey = TwoskyConfigKey::Meta

module FileExtension
  XIB = '.xib'
  STORYBOARD = '.storyboard'
  STRINGS = '.strings'
  STRINGS_DICT = '.stringsdict'
  JSON = '.json'

  PRIMARY = STRINGS
  FOR_REPLACE = [XIB, STORYBOARD].freeze
end

def export_localization(root_path, options:)
  process_locs(root_path, options: options, twosky_mode: TwoskyMode::EXPORT)
end

def import_localization(root_path, options:)
  process_locs(root_path, options: options, twosky_mode: TwoskyMode::IMPORT)
end

def process_locs(root_path, options:, twosky_mode: TwoskyMode)
  twosky_config = load_twosky_config(root_path)
  twosky_filename_mapping = twosky_config.dig(TwoskyConfigKey::META, TwoskyMetaKey::Map::FILENAME) || {}

  base_locale = twosky_config[TwoskyConfigKey::BASE_LOCALE]
  locale = options[:locale] || base_locale
  project_id = twosky_config[TwoskyConfigKey::PROJECT_ID]

  LOGGER.fatal!("Can't get <base_locale> from '.twosky.json'. Verify your config syntax") if base_locale.nil?
  LOGGER.fatal!("Can't get <project_id> from '.twosky.json'. Verify your config syntax") if project_id.nil?
  LOGGER.fatal!("Can't get <locale> arg") if locale.nil?

  regex    = options[:regex]
  dry_run  = options[:dry_run] || false
  continue_from_savepoint = options[:continue_from_savepoint] || false

  locales_to_process = get_locales(locale, twosky_config)
  files = gather_files(twosky_config, root_path, regex)

  LOGGER.fatal!('No files matched') if files.empty?

  checkpoint_dir = File.join(root_path, 'build')
  Dir.mkdir checkpoint_dir unless File.exist? checkpoint_dir
  checkpoint_path = File.join(checkpoint_dir, '.twosky_checkpoint')
  processed = Set.new

  if !continue_from_savepoint && File.exist?(checkpoint_path)
    LOGGER.info('Removing existing checkpoint file because continue_from_savepoint is false')
    File.delete(checkpoint_path)
  end

  if continue_from_savepoint && File.exist?(checkpoint_path)
    File.read(checkpoint_path).each_line do |line|
      processed << line.chomp
    end
  elsif locale == 'all'
    LOGGER.header "#{twosky_mode} #{files.size} file(s) for all locales"
  end

  unfairs = Set.new
  locales_to_process.each do |loc|
    LOGGER.header "#{twosky_mode} #{files.size} file(s) for locale '#{loc}'"
    files.each do |f|
      path = compute_real_path(f, current_locale: loc, base_locale: base_locale)
      filename = get_twosky_filename(twosky_filename_mapping: twosky_filename_mapping, entry: f)
      checkpoint_key = "#{loc}:#{filename}"

      if processed.include?(checkpoint_key)
        LOGGER.warn("[#{loc}] Skipping already processed: #{filename}")
        next
      end

      unless File.exist?(path)
        file = Pathname.new(path).relative_path_from(Pathname.new(root_path))
        if twosky_mode == TwoskyMode::EXPORT
          LOGGER.error("[#{loc}] File not found: #{file}")
          next
        end
      end

      entry = f.merge(path: path)

      case twosky_mode
      when TwoskyMode::IMPORT
        success = download_file(entry, loc, project_id, filename: filename, root_path: root_path, dry_run: dry_run)
      when TwoskyMode::EXPORT
        success = upload_file(entry, loc, project_id, filename: filename, root_path: root_path, dry_run: dry_run)
      end

      next if dry_run

      if success
        File.open(checkpoint_path, 'a') { |file| file.puts(checkpoint_key) }
        processed << checkpoint_key
      else
        unfairs << checkpoint_key
      end
    end
  end

  if unfairs.any?
    LOGGER.error("#{twosky_mode} error in files:\n#{unfairs.join("\n")}")
    return
  end

  LOGGER.success("#{twosky_mode} complete")
  return unless File.exist?(checkpoint_path)

  File.delete(checkpoint_path)
end

def upload_file(entry, locale, project_id, filename:, root_path:, dry_run: false)
  filepath = entry[:path]
  rel_to_root_path = Pathname.new(filepath).relative_path_from(Pathname.new(root_path))

  if File.size(filepath) < 9 # len(BOM) + len(""="";)
    LOGGER.warn("Skipping export of empty file: '#{rel_to_root_path}'")
    return true
  end

  file_format = entry[:format]

  LOGGER.info("[#{locale}] #{filename} (format=#{file_format}). File: '#{rel_to_root_path}'")

  return LOGGER.warn('Dry run, skipping upload') if dry_run

  uri = URI.parse('https://twosky.int.agrd.dev/api/v1/upload')
  req = Net::HTTP::Post.new(uri)
  form = [
    ['format',   file_format],
    ['language', locale],
    ['filename', filename],
    ['project',  project_id],
    ['file',     File.open(filepath)]
  ]
  req.set_form(form, 'multipart/form-data')

  success, body = perform_twosky_http_request(uri, req)
  return false unless success

  body = begin
    JSON.parse(body)
  rescue StandardError => e
    error = e
  end
  if error
    LOGGER.error("Body parse error: #{error}")
    return false
  end
  unless body && body['ok']
    LOGGER.error("Twosky error: #{body}")
    return false
  end

  LOGGER.success("[#{locale}] Uploaded: #{filename}")
  true
end

def download_file(entry, locale, project_id, filename:, root_path:, dry_run: false)
  LOGGER.info("[#{locale}] Downloading #{filename} → #{Pathname.new(entry[:path]).relative_path_from(Pathname.new(root_path))}")

  return LOGGER.warn('Dry run, skipping download') if dry_run

  uri = URI.parse('https://twosky.int.agrd.dev/api/v1/download')
  params = {
    'filename' => filename,
    'project' => project_id,
    'language' => locale
  }
  uri.query = URI.encode_www_form(params)

  req = Net::HTTP::Get.new(uri)
  success, body = perform_twosky_http_request(uri, req)
  return false if !success || body.nil?

  target_dir = File.dirname(entry[:path])
  FileUtils.mkdir_p(target_dir) unless Dir.exist?(target_dir)
  File.open(entry[:path], 'wb') { |f| f.write(body) }

  LOGGER.info("Downloaded: #{filename}")
  true
end

def load_twosky_config(root_path)
  config_path = "#{root_path}/.twosky.json"
  raw = File.read(config_path)
  JSON.parse(raw)[0]
rescue StandardError => e
  LOGGER.fatal!("Failed to load twosky config: #{e.message}")
end

# Determine module prefix based on metadata.local_to_twosky_folders_map
def find_prefix(rel, modules)
  modules.each do |regex, subpath|
    return subpath if rel =~ /#{regex}/
  end
  nil
end

# Gather all files according to config, applying regex filter
def gather_files(config, project_root, regex = nil)
  modules = config.dig(TwoskyConfigKey::META, TwoskyMetaKey::Map::FOLDERS) || []
  base_map = {
    FileExtension::XIB => 'macosx',
    FileExtension::STORYBOARD => 'macosx',
    FileExtension::STRINGS => 'auto',
    FileExtension::JSON => 'json'
  }

  result = []
  config[TwoskyConfigKey::LOCALIZABLE_FILES].each do |pattern|
    matches = Dir.glob(File.join(project_root, pattern), File::FNM_EXTGLOB | File::FNM_DOTMATCH)
    if matches.empty?
      LOGGER.error("Pattern unavailable in system: #{pattern}")
      next
    end
    matches.each do |full|
      rel = Pathname.new(full).relative_path_from(Pathname.new(project_root)).to_s
      next if regex && rel !~ /#{regex}/ || rel.include?('.json')

      prefix = find_prefix(rel, modules)
      fmt    = base_map[File.extname(rel).downcase] || 'auto'

      info = { path: full, prefix: prefix, format: fmt }

      if result.any? { |item| item[:path] == full }
        LOGGER.warn("Duplicate in config:\n'#{rel}'\nBy pattern: #{pattern}")
      else
        result << info
      end
    end
  end

  result
end

def compute_real_path(entity, current_locale: String, base_locale: String)
  path = entity[:path]

  FileExtension::FOR_REPLACE.each do |ext|
    path = check_ext_and_replace(path: path, extension: ext, base_locale: base_locale)
  end

  if current_locale != base_locale
    path = path.gsub(%r{/#{base_locale}\.lproj/}, "/#{current_locale}.lproj/")
    path = path.sub(%r{locales/#{base_locale}\.json$}, "locales/#{current_locale}.json")
  end
  path
end

def check_ext_and_replace(path: String, extension: String, base_locale: String)
  return path unless File.extname(path).downcase == extension

  path = path.gsub(%r{/Base\.lproj/}, "/#{base_locale}.lproj/")
  path.gsub(extension, FileExtension::PRIMARY)
end

def get_locales(target_locale, twosky_config)
  all_locales = twosky_config[TwoskyConfigKey::LANGUAGES].keys

  locales_to_action = target_locale == 'all' ? all_locales : [target_locale]

  locales_to_action.each do |loc|
    unless all_locales.include?(loc)
      available = all_locales.sort.join(', ')
      LOGGER.fatal!("Locale '#{loc}' is not supported. Available: #{available}")
    end
  end

  locales_to_action
end

def get_twosky_filename(twosky_filename_mapping:, entry:)
  basename = File.basename(entry[:path])

  mapping_pair = twosky_filename_mapping.find do |key, _value|
    entry[:path].include?(key)
  end
  mapped_name = mapping_pair&.last

  twosky_name = mapped_name || basename
  FileExtension::FOR_REPLACE.each do |ext|
    twosky_name = twosky_name.gsub(ext, FileExtension::PRIMARY)
  end
  twosky_name = "#{entry[:prefix]}/#{twosky_name}" if entry[:prefix]
  twosky_name
end

def check_translations(root_path, options)
  twosky_config = load_twosky_config(root_path)

  base_locale = twosky_config[TwoskyConfigKey::BASE_LOCALE]
  locale = options[:locale] || base_locale

  LOGGER.fatal!("Can't get <base_locale> from '.twosky.json'. Verify your config syntax") if base_locale.nil?
  LOGGER.fatal!("Can't get <locale> arg") if locale.nil?

  regex = options[:regex]

  locales_to_process = get_locales(locale, twosky_config)

  files = gather_files(twosky_config, root_path, regex)

  LOGGER.info('Start checking translations')

  locales_to_process.each do |target_locale|
    total_base = 0
    total_translated = 0

    files.each do |entity|
      base_path = compute_real_path(entity, current_locale: base_locale, base_locale: base_locale)
      translation_path = compute_real_path(entity, current_locale: target_locale, base_locale: base_locale)

      begin
        bcount = get_strings_number(base_path)
      rescue Errno::ENOENT
        LOGGER.error("Base file missing: #{Pathname.new(base_path).relative_path_from(Pathname.new(root_path))}")
        next
      end

      tcount = File.exist?(translation_path) ? get_strings_number(translation_path) : 0

      total_base += bcount
      total_translated += tcount
    end

    percent = total_base.zero? ? 0.0 : (total_translated.to_f / total_base * 100.0)
    message = "#{target_locale}, translated #{format('%.2f', percent)}%"
    if percent >= 99.99
      LOGGER.success(message)
    elsif percent > 85.0
      LOGGER.info(message)
    elsif percent > 70.0
      LOGGER.warn(message)
    else
      LOGGER.error(message)
    end
  end

  LOGGER.success('Finished checking translations')
end

def get_strings_number(file_path)
  ext = File.extname(file_path).downcase

  LOGGER.debug("Read file: #{file_path}")

  case ext
  when FileExtension::STRINGS
    body = read_as_utf8(file_path)
    body.scan(/"\s*.*\s*"\s*=\s*".*";/).size

  when FileExtension::STRINGS_DICT
    body = read_as_utf8(file_path)
    doc = REXML::Document.new(body)
    REXML::XPath.match(doc, '//dict/key').size

  when FileExtension::JSON
    json = JSON.parse(File.read(file_path, encoding: 'UTF-8'))
    json.is_a?(Hash) ? json.keys.size : 0

  else
    0
  end
end

def update_strings(root_path, options)
  twosky_config = load_twosky_config(root_path)
  base_locale = twosky_config[TwoskyConfigKey::BASE_LOCALE]

  LOGGER.fatal!("Can't get <base_locale> from '.twosky.json'. Verify your config syntax") if base_locale.nil?
  regex = options[:regex]
  each_ib_file_pair(root_path, base_locale, twosky_config, regex) do |ib_file, strings|
    ib_file_to_strings(ib_file, strings)
  end

  LOGGER.success('Finished updating .strings files')
end

def update_ib_files(root_path, options)
  twosky_config = load_twosky_config(root_path)
  base_locale = twosky_config[TwoskyConfigKey::BASE_LOCALE]

  LOGGER.fatal!("Can't get <base_locale> from '.twosky.json'. Verify your config syntax") if base_locale.nil?
  regex = options[:regex]
  each_ib_file_pair(root_path, base_locale, twosky_config, regex) do |ib_file, strings|
    strings_to_ib_file(strings, ib_file)
  end

  LOGGER.success('Finished updating .xib and .storyboard files')
end

def each_ib_file_pair(root_path, base_locale, config, regex)
  gather_files(config, root_path, regex).each do |entity|
    downcase_path = entity[:path].downcase
    next unless FileExtension::FOR_REPLACE.any? { |ext| downcase_path.end_with?(ext) }

    ib_path = entity[:path]
    strings_path = compute_real_path(entity, current_locale: base_locale, base_locale: base_locale)
    LOGGER.debug("IB path: #{ib_path}\nSTRINGS path: #{strings_path}")
    yield(ib_path, strings_path)
  end
end

def ib_file_to_strings(ib_path, strings_path)
  LOGGER.info("Running ibtool to export .strings from XIB and STORYBOARD: #{ib_path} → #{strings_path}")
  Tempfile.create do |tempfile|
    temp_path = tempfile.path
    run_cmd_or_fail(
      ['ibtool', '--generate-strings-file', temp_path, ib_path],
      'ibtool --generate-strings-file failed'
    )

    converted = run_cmd_or_fail(
      ['iconv', '-f', 'UTF-16', '-t', 'UTF-8', temp_path],
      'iconv conversion failed'
    )
    # We must strip all leading newlines
    File.write(strings_path, converted.lstrip)
  end
end

def strings_to_ib_file(strings_path, ib_path)
  LOGGER.info("Running ibtool to import .strings into XIB and STORYBOARD: #{strings_path} → #{ib_path}")
  cmd = ['ibtool', '--import-strings-file', strings_path, ib_path, '--write', ib_path]
  stdout, stderr, status = Open3.capture3(*cmd)
  LOGGER.debug("ibtool stdout: #{stdout}")
  return if status.success?

  LOGGER.error("ibtool --import-strings-file failed: #{stderr}")
end

def run_cmd_or_fail(cmd_array, error_prefix)
  stdout, stderr, status = Open3.capture3(*cmd_array)
  return stdout if status.success?

  LOGGER.fatal!("#{error_prefix}: #{stderr}")
end

def perform_twosky_http_request(uri, request, max_attempts = 5)
  attempts = 0

  begin
    attempts += 1
    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(request)
    end

    LOGGER.error("HTTP #{res.code} Error: #{res.body}") unless res.is_a?(Net::HTTPSuccess)
    [res.is_a?(Net::HTTPSuccess), res.body]
  rescue StandardError => e
    LOGGER.warn("Request failed (#{e.message})")
    if attempts <= max_attempts
      LOGGER.warn("Retrying #{attempts}/#{max_attempts}...")
      sleep 1.5 * attempts
      retry
    else
      LOGGER.error("All #{max_attempts} attempts failed")
      nil
    end
  end
end

def read_as_utf8(file_path)
  raw = File.binread(file_path)
  body = raw.force_encoding('UTF-8')
  body = raw.force_encoding('UTF-16').encode('UTF-8') unless body.valid_encoding?
  body
end

# Main entrypoint for standalone execution
if __FILE__ == $PROGRAM_NAME
  prog = File.basename($PROGRAM_NAME)
  options = {}

  opt_parser = OptionParser.new do |opts|
    opts.banner = "Usage: #{File.basename($PROGRAM_NAME)} <command> [options]"

    opts.on('-r', '--root PATH', 'Root path of project (default: current directory)') { |p| options[:root] = p }
    opts.on('-l', '--locale LOCALE', "Locale code (or 'all') (default: base_locale from .twosky.json)") do |l|
      options[:locale] = l
    end
    opts.on('-x', '--regex REGEX', 'Regex filter for files') { |rx| options[:regex] = rx }
    opts.on('-d', '--dry-run', 'Dry run without HTTP requests') { options[:dry_run] = true }
    opts.on('-c', '--continue', 'Continue from savepoint') { options[:continue_from_savepoint] = true }
    opts.on('-v', '--verbose', 'Verbose log level') { LOGGER.level = Logger::DEBUG }
    opts.on('-b', '--beautify', 'Use colored logs') do
      @colored_logs = true
      options[:colored_logs] = @colored_logs
      LOGGER.colored_logs = @colored_logs
    end
    opts.on('-h', '--help', 'Show this help message') do
      puts opts
      exit
    end

    opts.separator <<~USAGE

      Actions:
        import            Import all strings (you should run `#{prog} update_ibs` afterwards)
        export            Export XIBs, STORYBOARDs and strings for the base locale
        update_ibs        Update XIB and STORYBOARD files from 'en' strings
        update_strings    Update 'en' strings from XIB files
        check             Check percentage of translated strings
        list              Print the languages available

      Common tasks:
        1. Update 'en' strings from XIB and STORYBOARD files
             #{prog} update_strings

        2. Update XIBs and STORYBOARDs from corresponding 'en' strings
             #{prog} update_ibs

        3. Export XIBs, STORYBOARDs and strings for the base locale (en)
             #{prog} export
           or export XIB files only
             #{prog} export -r '.*xib'

        4. Export all strings (doesn't perform update_strings)
             #{prog} export -l all
           or for specific locale
             #{prog} export -l vi

        5. Import all strings (you should update_ibs after that)
             #{prog} import -l all
           or for specific locale
             #{prog} import -l vi

        6. Check percentage of translated strings for all locales
             #{prog} check
           or for specific locale
             #{prog} check -l fr

        7. Print the languages available
             #{prog} list
    USAGE
  end

  command = ARGV.shift
  unless %w[import export check update_ibs update_strings].include?(command)
    LOGGER.error("Unknown command: #{command}") unless command.nil?
    puts opt_parser
    exit(1)
  end

  begin
    opt_parser.order!
  rescue OptionParser::InvalidOption => e
    LOGGER.error("Invalid option: #{e.message}")
    puts opt_parser
    exit(1)
  end

  root_path = options[:root] || Dir.pwd
  LOGGER.debug("Executing '#{command}' with options: #{options.inspect}")

  case command
  when 'import'
    import_localization(root_path, options: options)
  when 'export'
    export_localization(root_path, options: options)
  when 'check'
    check_translations(root_path, options)
  when 'update_ibs'
    update_ib_files(root_path, options)
  when 'update_strings'
    update_strings(root_path, options)
  end

  LOGGER.success("Action '#{command}' complete")
end
