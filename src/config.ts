export const NETWORK_CONFIG = {
  chainId: 'manifest-ledger-testnet',
  rpcUrl: 'https://nodes.liftedinit.tech/manifest/testnet/rpc',
  restUrl: 'https://nodes.liftedinit.tech/manifest/testnet/api',
  denom: 'umfx',
  gasPrice: '1.0umfx',
};

export const getMnemonic = (): string => {
  const mnemonic = process.env.COSMOS_MNEMONIC;
  if (!mnemonic) {
    throw new Error('COSMOS_MNEMONIC environment variable is not set');
  }
  return mnemonic;
};

export const getKeyName = (): string => {
  return process.env.COSMOS_KEY_NAME || 'mcp-key';
};

export const getBinaryPath = (): string => {
  return process.env.COSMOS_BINARY || 'manifestd';
};
