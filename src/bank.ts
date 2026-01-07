import { execSync } from 'child_process';
import { NETWORK_CONFIG, getKeyName, getBinaryPath } from './config.js';

export interface Balance {
  denom: string;
  amount: string;
}

export async function queryBalance(
  address: string,
  denom: string = NETWORK_CONFIG.denom,
): Promise<Balance | null> {
  try {
    const binary = getBinaryPath();
    const output = execSync(
      `${binary} query bank balance ${address} ${denom} --output json --node ${NETWORK_CONFIG.rpcUrl}`,
      { encoding: 'utf-8' },
    );
    const parsed = JSON.parse(output);
    return parsed.balance || null;
  } catch {
    return null;
  }
}

export async function queryAllBalances(
  address: string,
): Promise<Balance[]> {
  try {
    const binary = getBinaryPath();
    const output = execSync(
      `${binary} query bank balances ${address} --output json --node ${NETWORK_CONFIG.rpcUrl}`,
      { encoding: 'utf-8' },
    );
    const parsed = JSON.parse(output);
    return parsed.balances || [];
  } catch {
    return [];
  }
}

export async function queryBankParams(): Promise<{
  sendEnabled: Array<{ denom: string; enabled: boolean }>;
  defaultSendEnabled: boolean;
}> {
  try {
    const binary = getBinaryPath();
    const output = execSync(
      `${binary} query bank params --output json --node ${NETWORK_CONFIG.rpcUrl}`,
      { encoding: 'utf-8' },
    );
    const parsed = JSON.parse(output);
    return parsed.params || {
      sendEnabled: [],
      defaultSendEnabled: true,
    };
  } catch {
    return {
      sendEnabled: [],
      defaultSendEnabled: true,
    };
  }
}

export interface SendTransactionResult {
  transactionHash: string;
  code: number;
  height: string;
  gasUsed: string;
  gasWanted: string;
}

export async function sendTokens(
  toAddress: string,
  amount: string,
  denom: string = NETWORK_CONFIG.denom,
): Promise<SendTransactionResult> {
  const keyName = getKeyName();
  const binary = getBinaryPath();

  const output = execSync(
    `${binary} tx bank send ${keyName} ${toAddress} ${amount}${denom} --yes --output json --node ${NETWORK_CONFIG.rpcUrl} --chain-id ${NETWORK_CONFIG.chainId} --gas-prices ${NETWORK_CONFIG.gasPrice}`,
    { encoding: 'utf-8' },
  );

  const parsed = JSON.parse(output);

  return {
    transactionHash: parsed.txhash || '',
    code: parsed.code || 0,
    height: String(parsed.height || ''),
    gasUsed: String(parsed.gas_used || ''),
    gasWanted: String(parsed.gas_wanted || ''),
  };
}
