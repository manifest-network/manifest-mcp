import { execSync } from 'child_process';
import { NETWORK_CONFIG, getBinaryPath, getKeyName } from './config.js';

export interface CosmosQueryResult {
  module: string;
  subcommand: string;
  result: Record<string, unknown>;
}

export interface CosmosTxResult {
  module: string;
  subcommand: string;
  transactionHash: string;
  code: number;
  height: string;
  rawLog?: string;
}

/**
 * Execute a generic Cosmos query command
 * @param module The module name (e.g., "bank", "staking", "distribution")
 * @param subcommand The subcommand (e.g., "balance", "delegations", "rewards")
 * @param args Additional arguments to pass to the command
 * @returns Parsed JSON result from the command
 */
export async function cosmosQuery(
  module: string,
  subcommand: string,
  args: string[] = [],
): Promise<CosmosQueryResult> {
  const binary = getBinaryPath();
  const argsStr = args.join(' ');

  try {
    const cmd = `${binary} query ${module} ${subcommand} ${argsStr} --output json --node ${NETWORK_CONFIG.rpcUrl}`;
    const output = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const result = JSON.parse(output);
    return {
      module,
      subcommand,
      result,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `Query ${module} ${subcommand} failed: ${errorMsg}`,
    );
  }
}

/**
 * Execute a generic Cosmos transaction
 * @param module The module name (e.g., "bank", "staking")
 * @param subcommand The subcommand (e.g., "send", "delegate")
 * @param args Additional arguments to pass to the command
 * @returns Transaction result
 */
export async function cosmosTx(
  module: string,
  subcommand: string,
  args: string[] = [],
): Promise<CosmosTxResult> {
  const binary = getBinaryPath();
  const keyName = getKeyName();
  const argsStr = args.join(' ');

  try {
    const cmd = `${binary} tx ${module} ${subcommand} ${keyName} ${argsStr} --yes --output json --node ${NETWORK_CONFIG.rpcUrl} --chain-id ${NETWORK_CONFIG.chainId} --gas-prices ${NETWORK_CONFIG.gasPrice}`;
    const output = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const result = JSON.parse(output);
    return {
      module,
      subcommand,
      transactionHash: result.txhash || '',
      code: result.code || 0,
      height: String(result.height || ''),
      rawLog: result.raw_log,
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Tx ${module} ${subcommand} failed: ${errorMsg}`);
  }
}
