# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

# frozen_string_literal: true

source 'https://rubygems.org'

gem 'abbrev'
gem 'fastlane'

group :development do
  gem 'rubocop', '~> 1.75.6'
  gem 'ruby-lsp', '~> 0.23.21'
end

plugins_path = File.join(File.dirname(__FILE__), 'fastlane', 'Pluginfile')
eval_gemfile(plugins_path) if File.exist?(plugins_path)
