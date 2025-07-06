/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Settings, LoadedSettings, SettingScope } from './config/settings.js';
import { AuthType, MCPServerConfig } from '@google/gemini-cli-core';

export async function handleConfigCommand(
  args: string[],
  loadedSettings: LoadedSettings,
): Promise<void> {
  const [subcommand, key, value] = args;

  switch (subcommand) {
    case 'get':
      if (!key) {
        console.log('Usage: /config get <key>');
        return;
      }
      handleGetConfig(key as keyof Settings, loadedSettings);
      break;
    case 'set':
      if (!key || !value) {
        console.log('Usage: /config set <key> <value>');
        return;
      }
      await handleSetConfig(key as keyof Settings, value, loadedSettings);
      break;
    case 'list':
      handleListConfig(loadedSettings);
      break;
    default:
      console.log('Unknown /config subcommand. Usage: /config [get|set|list]');
      break;
  }
}

function handleGetConfig(
  key: keyof Settings,
  loadedSettings: LoadedSettings,
): void {
  const value = loadedSettings.merged[key];
  if (value !== undefined) {
    console.log(`${String(key)}: ${JSON.stringify(value, null, 2)}`);
  } else {
    console.log(`Setting '${String(key)}' not found.`);
  }
}

async function handleSetConfig(
  key: keyof Settings,
  value: string,
  loadedSettings: LoadedSettings,
): Promise<void> {
  let parsedValue: unknown = value;
  // Attempt to parse value if it's a boolean or number
  if (value === 'true') {
    parsedValue = true;
  } else if (value === 'false') {
    parsedValue = false;
  } else if (!isNaN(Number(value))) {
    parsedValue = Number(value);
  } else if (Object.values(AuthType).includes(value as AuthType)) {
    parsedValue = value as AuthType;
  }

  // For complex objects like mcpServers, we might need more sophisticated parsing
  // For now, assume simple key-value pairs or stringified JSON for complex types
  try {
    // Try to parse as JSON for complex types
    parsedValue = JSON.parse(value);
  } catch (_e) {
    // Not JSON, use as is
  }

  loadedSettings.setValue(
    SettingScope.User,
    key,
    parsedValue as string | Record<string, MCPServerConfig> | undefined,
  );
  console.log(
    `Setting '${String(key)}' updated to '${value}' in user settings.`,
  );
}

function handleListConfig(loadedSettings: LoadedSettings): void {
  console.log(
    'Current Configuration (merged from user and workspace settings):',
  );
  for (const key in loadedSettings.merged) {
    if (Object.prototype.hasOwnProperty.call(loadedSettings.merged, key)) {
      const value = loadedSettings.merged[key as keyof Settings];
      console.log(`  ${key}: ${JSON.stringify(value, null, 2)}`);
    }
  }
}
