import { Client } from '@modelcontextprotocol/sdk/client'
import { tool, jsonSchema } from 'ai'
import type { ToolSet } from 'ai'

export interface BraveSearchTools {
  client: Client
  tools: ToolSet
}

/**
 * Creates an MCP client connected to the Brave Search server and returns
 * AI SDK-compatible tool definitions. Returns null if BRAVE_API_KEY is not set.
 *
 * Caller MUST close the client in a finally block to avoid zombie processes:
 * ```ts
 * const mcp = await createBraveSearchTools()
 * try {
 *   // use mcp.tools
 * } finally {
 *   await mcp?.client.close()
 * }
 * ```
 */
export async function createBraveSearchTools(): Promise<BraveSearchTools | null> {
  if (!process.env.BRAVE_API_KEY) {
    console.info('[MCP] BRAVE_API_KEY not set, skipping web search')
    return null
  }

  // Dynamic import to avoid TypeScript module resolution issues with package exports map
  const { StdioClientTransport } = await import(
    /* @vite-ignore */
    '@modelcontextprotocol/sdk/client/stdio' as string
  )

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: {
      ...(process.env as Record<string, string>),
      BRAVE_API_KEY: process.env.BRAVE_API_KEY,
    },
  })

  const client = new Client({ name: 'erudex', version: '1.0.0' })

  try {
    await client.connect(transport)
    console.info('[MCP] Connected to Brave Search server')
  } catch (err) {
    console.error('[MCP] Failed to connect to Brave Search server:', err)
    throw err
  }

  const { tools: mcpTools } = await client.listTools()
  console.info(`[MCP] Discovered ${mcpTools.length} tool(s): ${mcpTools.map((t) => t.name).join(', ')}`)

  const tools: ToolSet = {}
  for (const mcpTool of mcpTools) {
    const toolName = mcpTool.name
    tools[toolName] = tool({
      description: mcpTool.description ?? '',
      inputSchema: jsonSchema(mcpTool.inputSchema as Record<string, unknown>),
      execute: async (args: Record<string, unknown>) => {
        const result = await client.callTool({
          name: toolName,
          arguments: args,
        })
        return result.content
      },
    })
  }

  return { client, tools }
}
