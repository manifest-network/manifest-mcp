import { execSync } from 'child_process';
import { getBinaryPath } from './config.js';

export interface ModuleInfo {
  name: string;
  description: string;
}

export interface AvailableModules {
  queryModules: ModuleInfo[];
  txModules: ModuleInfo[];
}

/**
 * Parse help output to extract available modules/subcommands
 */
function parseHelpOutput(output: string): ModuleInfo[] {
  const modules: ModuleInfo[] = [];
  const lines = output.split('\n');
  let inAvailableCommands = false;

  for (const line of lines) {
    if (line.includes('Available Commands:')) {
      inAvailableCommands = true;
      continue;
    }

    if (inAvailableCommands) {
      // Stop at next section (blank line followed by non-command line)
      if (line.trim() === '') {
        continue;
      }

      if (line.startsWith('  ')) {
        const parts = line.trim().split(/\s{2,}/);
        if (parts.length >= 2) {
          const name = parts[0];
          const description = parts.slice(1).join(' ');
          // Skip common help commands
          if (!['help', 'h'].includes(name)) {
            modules.push({ name, description });
          }
        }
      } else if (!line.startsWith(' ')) {
        // End of available commands section
        break;
      }
    }
  }

  return modules;
}

/**
 * Get all available query and transaction modules
 */
export async function getAvailableModules(): Promise<AvailableModules> {
  const binary = getBinaryPath();

  try {
    const queryHelp = execSync(`${binary} query --help`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const queryModules = parseHelpOutput(queryHelp);

    const txHelp = execSync(`${binary} tx --help`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const txModules = parseHelpOutput(txHelp);

    return {
      queryModules,
      txModules,
    };
  } catch (error) {
    throw new Error(
      `Failed to get available modules: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Get available subcommands for a specific module
 */
export async function getModuleSubcommands(
  type: 'query' | 'tx',
  module: string,
): Promise<ModuleInfo[]> {
  const binary = getBinaryPath();

  try {
    const help = execSync(`${binary} ${type} ${module} --help`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return parseHelpOutput(help);
  } catch (error) {
    throw new Error(
      `Failed to get subcommands for ${type} ${module}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
