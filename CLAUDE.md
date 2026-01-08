# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP server for interacting with the Manifest Network blockchain. It provides tools to query balances, send transactions, and manage accounts using CosmJS and the Cosmos SDK. The server supports mnemonic-based key management and communicates with the Manifest testnet via its gRPC and REST endpoints.

## Quick Start

### Build
```bash
npm run build
```

### Run Development
```bash
npm run dev
```

### Run Production
```bash
npm start
```

### Watch Mode (for development)
```bash
npm run watch
```

## Configuration

All configuration is managed via environment variables (loaded from `.env` file). Copy `.env.example` and customize:

### Required Variables
- `COSMOS_MNEMONIC`: BIP39 mnemonic phrase for account key derivation
- `COSMOS_CHAIN_ID`: Chain ID (e.g., `manifest-ledger-testnet`)
- `COSMOS_RPC_URL`: RPC endpoint URL
- `COSMOS_REST_URL`: REST endpoint URL
- `COSMOS_DENOM`: Token denomination (e.g., `umfx`)
- `COSMOS_GAS_PRICE`: Gas price (e.g., `1.0umfx`)

### Optional Variables
- `COSMOS_BINARY` (defaults to `manifestd`): Path to the Cosmos SDK CLI binary
- `COSMOS_KEY_NAME` (defaults to `mcp-key`): Name of the key in the CLI keyring

### Supported Chains
Pre-configured examples in `.env.example`:
- Manifest Network (default)
- Cosmos Hub (gaiad)
- Osmosis (osmosisd)
- Others (customize as needed)

## Architecture

### Core Modules

**src/config.ts**: Network configuration and environment variable handling
- Exports network endpoints and chain parameters
- Provides `getMnemonic()`, `getKeyName()`, and `getBinaryPath()` functions for environment variable access

**src/wallet.ts**: Key management via manifestd CLI
- `initializeKey()`: Imports the mnemonic into the manifestd keyring on first run
- `getAccount()`: Returns the account address for the configured key name

**src/cosmos.ts**: Generic Cosmos SDK module support
- `cosmosQuery()`: Execute any `manifestd query <module> <subcommand>` command
- `cosmosTx()`: Execute any `manifestd tx <module> <subcommand>` command
- Passes through arbitrary arguments and returns parsed JSON results

**src/modules.ts**: Module discovery
- `getAvailableModules()`: Lists all available query and transaction modules
- `getModuleSubcommands()`: Lists all available subcommands for a specific module

**src/index.ts**: MCP server setup
- Registers all tools via the MCP protocol
- Handles tool invocation and error responses
- Communicates via stdio with the MCP client

### Tool Definitions

The MCP server exposes five tools:

1. **get_account_info**: Returns the account address and key name
2. **cosmos_query**: Execute any query against any module (e.g., bank, staking, distribution, gov, auth, etc.)
   - Accepts: module, subcommand, and optional arguments
   - Returns: Full JSON result from the chain
3. **cosmos_tx**: Execute any transaction against any module (e.g., bank, staking, etc.)
   - Accepts: module, subcommand, and transaction arguments
   - Automatically signs with the configured key
   - Returns: Transaction hash, code, height, and raw log
4. **list_modules**: Lists all available query and transaction modules supported by the chain
   - Returns: Object with `queryModules` and `txModules` arrays, each containing module name and description
5. **list_module_subcommands**: Lists all available subcommands for a specific module
   - Accepts: type (query or tx) and module name
   - Returns: Array of subcommands with descriptions

## Key Design Decisions

**CLI-based approach**: The server shells out to the `manifestd` binary for all blockchain operations. This ensures compatibility with the official chain binary, eliminates dependency on CosmJS versions, and allows the server to work with any future chain updates without code changes.

**Universal module support**: Instead of hardcoding specific modules (bank, staking, etc.), the server provides two generic `cosmos_query` and `cosmos_tx` tools that work with any module the chain supports. This eliminates the need to update the MCP server when new modules are added to the chain.

**Mnemonic-only authentication**: Supports only BIP39 mnemonics. The mnemonic is imported into the manifestd keyring on first run, then all subsequent operations use the keyring's key.

**Single account per server**: Uses a single key from the mnemonic. The keyring name is configurable via `COSMOS_KEY_NAME` environment variable.

**Configuration via environment**: Network and account configuration is managed through environment variables (`.env` file), making it easy to switch chains without code changes.

**Configurable binary path**: The `COSMOS_BINARY` environment variable allows specifying the path to the Cosmos SDK CLI binary, supporting different installation locations or binary names.

**Error handling**: The MCP server catches all errors during tool execution and returns them as error responses to the client, allowing graceful degradation.

## Dependencies

- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **manifestd**: Cosmos SDK CLI binary (required at runtime, not npm dependency)

## Usage Examples

### Discovery Examples

```
# List all available modules
list_modules

# List available subcommands for bank module queries
list_module_subcommands type="query" module="bank"

# List available subcommands for staking transactions
list_module_subcommands type="tx" module="staking"
```

### Query Examples

```
cosmos_query module="bank" subcommand="balance" args="manifest1hj5fveer5cjtn4wd6wstzugjfdxzl0xp8ws9ct umfx"
cosmos_query module="staking" subcommand="delegations" args="manifest1hj5fveer5cjtn4wd6wstzugjfdxzl0xp8ws9ct"
cosmos_query module="distribution" subcommand="rewards" args="manifest1hj5fveer5cjtn4wd6wstzugjfdxzl0xp8ws9ct"
cosmos_query module="gov" subcommand="proposals"
cosmos_query module="auth" subcommand="account" args="manifest1hj5fveer5cjtn4wd6wstzugjfdxzl0xp8ws9ct"
```

### Transaction Examples

```
cosmos_tx module="bank" subcommand="send" args="manifest14g32y59tczz9y83tz7uhjv8ldf94tqpzxdz2g5 100000umfx"
cosmos_tx module="staking" subcommand="delegate" args="manifestvaloper... 1000000umfx"
cosmos_tx module="staking" subcommand="unbond" args="manifestvaloper... 500000umfx"
```

The `cosmos_query` and `cosmos_tx` tools pass arguments directly to the manifestd CLI, so any module and subcommand supported by the chain can be used without modifying the MCP server code. Use `list_modules` and `list_module_subcommands` to discover what's available.
