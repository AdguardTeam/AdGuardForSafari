# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

# frozen_string_literal: true

module Config
  AVAILABLE_BUILD_CONFIGS = %w[Release Beta Nightly MAS MAS(IAP) Debug TempDev].freeze
  CONFIG_OPTION_DOC = "  - config (required): STRING Configuration for build. Can be one of #{Config::AVAILABLE_BUILD_CONFIGS}"
end
