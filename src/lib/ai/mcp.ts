import { Client } from '@modelcontextprotocol/sdk/client'
import { tool, zodSchema } from 'ai'
import type { ToolSet } from 'ai'
import { z } from 'zod'

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

  const client = new Client({ name: 'learn-better', version: '1.0.0' })
  await client.connect(transport)

  const { tools: mcpTools } = await client.listTools()

  const tools: ToolSet = {}
  for (const mcpTool of mcpTools) {
    const toolName = mcpTool.name
    tools[toolName] = tool({
      description: mcpTool.description ?? '',
      inputSchema: zodSchema(z.object({ query: z.string().describe('The search query') })),
      execute: async (args: { query: string }) => {
        const result = await client.callTool({
          name: toolName,
          arguments: args as Record<string, unknown>,
        })
        return result.content
      },
    })
  }

  return { client, tools }
}
