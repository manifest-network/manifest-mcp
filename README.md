# ⚠️ Cosmos MCP Server (Proof of Concept - NOT FOR PRODUCTION)

> **WARNING**: This is a proof-of-concept implementation. **DO NOT USE IN PRODUCTION.**
>
> This project has known security vulnerabilities including shell injection risks and is intended for testing and development only. Use at your own risk.

A generic MCP (Model Context Protocol) server for interacting with any Cosmos SDK blockchain. Use Claude to query balances, send transactions, and explore blockchain data - all powered by any Cosmos SDK CLI binary (like `manifestd`, `gaiad`, `simd`, etc.).

## Overview

This MCP server bridges Claude AI with any Cosmos SDK blockchain, allowing you to:

- **Query** any blockchain data (balances, account info, governance proposals, etc.)
- **Send transactions** (transfers, governance votes, and more - depending on the chain)
- **Discover** available modules and commands dynamically
- **Manage accounts** using BIP39 mnemonics

The server uses the official CLI binary for your chain under the hood, ensuring compatibility and future-proofing. Simply swap the binary and network configuration to use it with any Cosmos SDK chain.

## Supported Chains

Works with any Cosmos SDK chain, including:
- **Manifest Network** (default configuration)
- **Cosmos Hub** (gaiad)
- **Osmosis** (osmosisd)
- **Juno** (junod)
- **Stargaze** (starsd)
- Any other Cosmos SDK chain

Just change the binary path and network configuration.

## Prerequisites

- **Node.js 18+** and npm
- **Cosmos SDK CLI binary** for your chain (e.g., `manifestd`, `gaiad`, `osmosisd`)
- **BIP39 mnemonic** for your blockchain account
- Network RPC and REST endpoints for your chain

## Installation

### 1. Clone and Install

```bash
git clone <repo-url> manifest-mcp
cd manifest-mcp
npm install
npm run build
```

### 2. Install Your Chain's CLI Binary

Build and install the CLI binary for your chain. For Manifest:

```bash
cd ~/manifest-ledger  # or wherever you have the manifest-ledger repo
make install
```

For other chains, consult their documentation. Verify it's available:

```bash
manifestd version  # or gaiad version, osmosisd version, etc.
```

### 3. Set Up Environment

Export these environment variables:

```bash
# Required
export COSMOS_MNEMONIC="your bip39 mnemonic phrase here"

# Optional (defaults shown)
export COSMOS_BINARY="manifestd"
export COSMOS_KEY_NAME="mcp-key"
```

> **Security**: Never expose your mnemonic in shell history or scripts. Use a secure secrets manager for production deployments.

### 4. Add to Claude

Register the MCP server with Claude using the `claude mcp add` command:

```bash
claude mcp add --transport stdio manifest-mcp -- node /path/to/manifest-mcp/dist/index.js
```

Replace `/path/to/manifest-mcp` with the actual path to your cloned repository.

**With a custom binary path** (if using a different Cosmos chain):

```bash
COSMOS_BINARY="/path/to/gaiad" claude mcp add --transport stdio manifest-mcp -- node /path/to/manifest-mcp/dist/index.js
```

**Verify it's configured:**

```bash
claude mcp list
```

You should see `manifest-mcp` in the output.

### 5. Use in Claude

Once configured, open Claude Code or Claude in your terminal. The MCP server will automatically be connected and you can ask Claude to:

```
"What's my account balance?"
"Show available modules on the blockchain"
"Send 100000umfx to manifest14g32y59tczz9y83tz7uhjv8ldf94tqpzxdz2g5"
```

Claude will use the MCP tools to execute these commands on the blockchain.

## Usage

Once connected, you can ask Claude to use these tools:

### Discovery

```
"What modules are available on Manifest Network?"
"Show me all the bank module queries"
"What commands are available for governance?"
```

This uses:
- `list_modules` - Get all available query and transaction modules
- `list_module_subcommands` - Get subcommands for a specific module

### Queries

```
"What's my account balance in umfx?"
"Show account details for manifest1hj5fveer5cjtn4wd6wstzugjfdxzl0xp8ws9ct"
"Check governance proposals"
```

### Transactions

```
"Send 100000umfx to manifest14g32y59tczz9y83tz7uhjv8ldf94tqpzxdz2g5"
"Vote yes on proposal 5"
```

### Account Info

```
"What's my account address?"
"Show my account details"
```

## Available Tools

| Tool | Description | Use Cases |
|------|-------------|-----------|
| `get_account_info` | Get your account address and key name | Verify account setup |
| `list_modules` | Discover all query and transaction modules | Explore available commands |
| `list_module_subcommands` | Get subcommands for a specific module | Learn module capabilities |
| `cosmos_query` | Execute any query command | Query blockchain state |
| `cosmos_tx` | Execute any transaction | Modify blockchain state |

## Network Configuration

Default configuration is for Manifest Testnet:

- **Chain ID**: `manifest-ledger-testnet`
- **RPC**: `https://nodes.liftedinit.tech/manifest/testnet/rpc`
- **REST**: `https://nodes.liftedinit.tech/manifest/testnet/api`
- **Token Denom**: `umfx` (smallest unit)
- **Gas Price**: `1.0umfx`

### Using a Different Chain

To use this server with a different Cosmos SDK chain, edit `src/config.ts`:

```typescript
export const NETWORK_CONFIG = {
  chainId: 'cosmoshub-4',           // Your chain's chain ID
  rpcUrl: 'https://rpc.cosmos.network',
  restUrl: 'https://lcd.cosmos.network',
  denom: 'uatom',                   // Your chain's token denom
  gasPrice: '0.025uatom',           // Your chain's gas price
};
```

Then rebuild:

```bash
npm run build
export COSMOS_BINARY="gaiad"  # or your chain's binary name
npm start
```

## Development

### Build

```bash
npm run build
```

### Development Mode (with auto-restart)

Terminal 1 - Watch for changes:

```bash
npm run watch
```

Terminal 2 - Run the server:

```bash
npm start
```

### Project Structure

```
src/
├── config.ts       # Network config and environment variables
├── wallet.ts       # Key management via manifestd CLI
├── cosmos.ts       # Generic Cosmos SDK query/tx support
├── modules.ts      # Module discovery
└── index.ts        # MCP server setup
```

## How It Works

1. **On startup**: Imports your mnemonic into the `manifestd` keyring (one-time setup)
2. **For queries**: Shells out to `manifestd query <module> <subcommand>`
3. **For transactions**: Shells out to `manifestd tx <module> <subcommand>` with automatic signing
4. **For discovery**: Parses `manifestd --help` output to list available modules

This approach ensures:
- ✅ Compatibility with any `manifestd` binary
- ✅ Automatic support for new chain modules
- ✅ No dependency on specific CosmJS versions
- ✅ Easy to inspect by running commands manually

## Examples

### Check Balance

Claude: "What's my balance?"

The server runs:
```bash
manifestd query bank balance manifest1hj5fveer5cjtn4wd6wstzugjfdxzl0xp8ws9ct umfx --output json --node https://nodes.liftedinit.tech/manifest/testnet/rpc
```

### Send Transfer

Claude: "Send 50000umfx to manifest14g32y59tczz9y83tz7uhjv8ldf94tqpzxdz2g5"

The server runs:
```bash
manifestd tx bank send mcp-key manifest14g32y59tczz9y83tz7uhjv8ldf94tqpzxdz2g5 50000umfx --yes --output json --node https://nodes.liftedinit.tech/manifest/testnet/rpc --chain-id manifest-ledger-testnet --gas-prices 1.0umfx
```

## Troubleshooting

### "COSMOS_MNEMONIC not set"

Make sure your environment variable is exported:

```bash
export COSMOS_MNEMONIC="your mnemonic here"
node dist/index.js
```

### "CLI binary not found"

The binary isn't in your PATH. Either:

```bash
# Option 1: Add to PATH
export PATH="/path/to/your-chain/bin:$PATH"

# Option 2: Specify explicitly
export COSMOS_BINARY="/path/to/manifestd"  # or gaiad, osmosisd, etc.
npm start
```

### "MCP server failed to reconnect"

Rebuild and restart:

```bash
npm run build
npm start
```

### Transaction fails with "insufficient funds"

Check your balance first:
```
"What's my current balance?"
```

## Limitations

- **Single account**: Only supports one key per server instance. For multiple accounts, run multiple server instances with different mnemonics.
- **Configuration editing required**: Network configuration requires editing `src/config.ts` and rebuilding. Use `COSMOS_BINARY` env var to change the binary.
- **Mnemonic only**: Doesn't support keystore files or hardware wallets.
- **Module availability**: Available modules depend on what your chain's binary supports. Use `list_modules` to discover what's available.

## Security

- **Never hardcode or expose mnemonics** in code, scripts, or version control
- The mnemonic is only used to import into the keyring on first run
- All transactions require explicit confirmation through Claude
- Run on trusted machines only
- Use a secrets manager for production deployments

## License

MIT

## Contributing

Contributions welcome! For major changes, please open an issue first.

## Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Cosmos SDK](https://github.com/cosmos/cosmos-sdk)
- [Manifest Network](https://github.com/manifest-network)
- [manifest-ledger](https://github.com/manifest-network/manifest-ledger)

## Example Chains

- **Cosmos Hub**: [gaiad](https://github.com/cosmos/gaia) | Chain ID: `cosmoshub-4` | Denom: `uatom`
- **Osmosis**: [osmosisd](https://github.com/osmosis-labs/osmosis) | Chain ID: `osmosis-1` | Denom: `uosmo`
- **Juno**: [junod](https://github.com/CosmosContracts/juno) | Chain ID: `juno-1` | Denom: `ujuno`
