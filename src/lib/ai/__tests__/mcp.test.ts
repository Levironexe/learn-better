import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockConnect = vi.fn().mockResolvedValue(undefined)
const mockListTools = vi.fn().mockResolvedValue({
  tools: [
    {
      name: 'brave_web_search',
      description: 'Search the web using Brave Search',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
    },
  ],
})
const mockCallTool = vi.fn().mockResolvedValue({ content: 'search results' })
const mockClose = vi.fn().mockResolvedValue(undefined)

const MockClient = vi.fn().mockImplementation(() => ({
  connect: mockConnect,
  listTools: mockListTools,
  callTool: mockCallTool,
  close: mockClose,
}))

const MockStdioClientTransport = vi.fn().mockImplementation(() => ({}))

vi.mock('@modelcontextprotocol/sdk/client', () => ({
  Client: MockClient,
}))

// The mcp.ts uses a dynamic import for StdioClientTransport — mock it at module level
vi.mock('@modelcontextprotocol/sdk/client/stdio', () => ({
  StdioClientTransport: MockStdioClientTransport,
}))

describe('createBraveSearchTools', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  it('returns null when BRAVE_API_KEY is not set', async () => {
    delete process.env.BRAVE_API_KEY
    const { createBraveSearchTools } = await import('../mcp')
    const result = await createBraveSearchTools()
    expect(result).toBeNull()
  })

  it('returns client and tools when BRAVE_API_KEY is set', async () => {
    process.env.BRAVE_API_KEY = 'test-key-123'
    const { createBraveSearchTools } = await import('../mcp')
    const result = await createBraveSearchTools()
    expect(result).not.toBeNull()
    expect(result?.client).toBeDefined()
    expect(result?.tools).toBeDefined()
  })

  it('constructs StdioClientTransport with BRAVE_API_KEY in env', async () => {
    process.env.BRAVE_API_KEY = 'test-key-456'
    const { createBraveSearchTools } = await import('../mcp')
    await createBraveSearchTools()
    expect(MockStdioClientTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        command: 'npx',
        args: expect.arrayContaining(['@modelcontextprotocol/server-brave-search']),
        env: expect.objectContaining({ BRAVE_API_KEY: 'test-key-456' }),
      })
    )
  })

  it('maps MCP tools to AI SDK-compatible tool definitions', async () => {
    process.env.BRAVE_API_KEY = 'test-key'
    const { createBraveSearchTools } = await import('../mcp')
    const result = await createBraveSearchTools()
    expect(result?.tools).toHaveProperty('brave_web_search')
    const searchTool = result?.tools['brave_web_search']
    expect(searchTool?.description).toContain('Brave Search')
    expect(searchTool?.execute).toBeTypeOf('function')
  })
})
