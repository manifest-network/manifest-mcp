import { execSync } from 'child_process';
import { getMnemonic, getKeyName, getBinaryPath } from './config.js';

export async function initializeKey(): Promise<void> {
  const keyName = getKeyName();
  const mnemonic = getMnemonic();
  const binary = getBinaryPath();

  try {
    // Try to get the key - if it exists, we're done
    execSync(`${binary} keys show ${keyName}`, { encoding: 'utf-8' });
    return;
  } catch {
    // Key doesn't exist, create it
    const mnemonicInput = mnemonic.replace(/"/g, '\\"');
    execSync(`printf "${mnemonicInput}" | ${binary} keys add ${keyName} --recover --stdin`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  }
}

export async function getAccount(): Promise<{
  address: string;
  name: string;
}> {
  const keyName = getKeyName();
  const binary = getBinaryPath();
  const output = execSync(`${binary} keys show ${keyName} -a`, {
    encoding: 'utf-8',
  });
  const address = output.trim();

  return {
    address,
    name: keyName,
  };
}
