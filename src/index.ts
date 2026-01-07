import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeKey, getAccount } from './wallet.js';
import { cosmosQuery, cosmosTx } from './cosmos.js';
import { getAvailableModules, getModuleSubcommands } from './modules.js';

const server = new Server(
  {
    name: 'manifest-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const tools: Tool[] = [
  {
    name: 'get_account_info',
    description:
      'Get account address derived from the configured mnemonic',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'cosmos_query',
    description:
      'Execute any Cosmos SDK query command. Examples: "bank balance <address> umfx", "staking delegations <address>", "distribution rewards <address>"',
    inputSchema: {
      type: 'object',
      properties: {
        module: {
          type: 'string',
          description:
            'The module name (e.g., "bank", "staking", "distribution", "gov", "auth")',
        },
        subcommand: {
          type: 'string',
          description:
            'The subcommand (e.g., "balance", "delegations", "rewards")',
        },
        args: {
          type: 'string',
          description:
            'Additional arguments as a space-separated string (e.g., "address umfx" or "validator-address")',
        },
      },
      required: ['module', 'subcommand'],
    },
  },
  {
    name: 'cosmos_tx',
    description:
      'Execute any Cosmos SDK transaction. Examples: "bank send <to_address> <amount>umfx", "staking delegate <validator> <amount>umfx"',
    inputSchema: {
      type: 'object',
      properties: {
        module: {
          type: 'string',
          description: 'The module name (e.g., "bank", "staking")',
        },
        subcommand: {
          type: 'string',
          description: 'The subcommand (e.g., "send", "delegate")',
        },
        args: {
          type: 'string',
          description:
            'Arguments to the transaction, excluding the key name (e.g., "<to_address> <amount>umfx")',
        },
      },
      required: ['module', 'subcommand', 'args'],
    },
  },
  {
    name: 'list_modules',
    description:
      'List all available query and transaction modules supported by the chain',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_module_subcommands',
    description:
      'List all available subcommands for a specific module (query or tx)',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['query', 'tx'],
          description: 'Whether to list query or transaction subcommands',
        },
        module: {
          type: 'string',
          description: 'The module name (e.g., "bank", "staking")',
        },
      },
      required: ['type', 'module'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const toolInput = request.params.arguments || {};

  try {
    switch (toolName) {
      case 'get_account_info': {
        const account = await getAccount();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(account, null, 2),
            },
          ],
        };
      }

      case 'cosmos_query': {
        const module = toolInput.module as string;
        const subcommand = toolInput.subcommand as string;
        const argsStr = (toolInput.args as string) || '';

        if (!module || !subcommand) {
          throw new Error('module and subcommand are required');
        }

        const args = argsStr ? argsStr.split(/\s+/) : [];
        const result = await cosmosQuery(module, subcommand, args);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'cosmos_tx': {
        const module = toolInput.module as string;
        const subcommand = toolInput.subcommand as string;
        const argsStr = toolInput.args as string;

        if (!module || !subcommand || !argsStr) {
          throw new Error('module, subcommand, and args are required');
        }

        const args = argsStr.split(/\s+/);
        const result = await cosmosTx(module, subcommand, args);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'list_modules': {
        const modules = await getAvailableModules();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(modules, null, 2),
            },
          ],
        };
      }

      case 'list_module_subcommands': {
        const type = toolInput.type as string;
        const module = toolInput.module as string;

        if (!type || !module) {
          throw new Error('type and module are required');
        }

        if (type !== 'query' && type !== 'tx') {
          throw new Error('type must be either "query" or "tx"');
        }

        const subcommands = await getModuleSubcommands(
          type as 'query' | 'tx',
          module,
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  type,
                  module,
                  subcommands,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  // Initialize key from mnemonic
  await initializeKey();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Manifest MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
