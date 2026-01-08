import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface NetworkConfig {
  chainId: string;
  rpcUrl: string;
  restUrl: string;
  denom: string;
  gasPrice: string;
}

export const NETWORK_CONFIG: NetworkConfig = {
  chainId: getEnvRequired('COSMOS_CHAIN_ID'),
  rpcUrl: getEnvRequired('COSMOS_RPC_URL'),
  restUrl: getEnvRequired('COSMOS_REST_URL'),
  denom: getEnvRequired('COSMOS_DENOM'),
  gasPrice: getEnvRequired('COSMOS_GAS_PRICE'),
};

export const getMnemonic = (): string => {
  return getEnvRequired('COSMOS_MNEMONIC');
};

export const getKeyName = (): string => {
  return getEnvOptional('COSMOS_KEY_NAME', 'mcp-key');
};

export const getBinaryPath = (): string => {
  return getEnvOptional('COSMOS_BINARY', 'manifestd');
};

// Helper functions
function getEnvRequired(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Environment variable ${key} is not set. Please check your .env file or environment.`,
    );
  }
  return value;
}

function getEnvOptional(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}
