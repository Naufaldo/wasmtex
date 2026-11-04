import { describe, expect, it, vi } from 'vitest'
import { VirtualFS } from '../fs/virtual-fs'
import { AgentLoop } from './agent-loop'
import { ToolRegistry } from './tool-registry'
import type { ChatMessage, ChatResponse, ModelAdapter, ToolCall } from './types'

describe('AgentLoop', () => {
  it('handles direct answer with no tool calls', async () => {
    const mockAdapter: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockResolvedValue({
        message: {
          role: 'assistant',
          content: 'Here is your LaTeX formula: $E = mc^2$',
        },
        usage: { inputTokens: 20, outputTokens: 10 },
      }),
      supportsToolUse: () => true,
    }

    const fs = new VirtualFS({ empty: true })
    const tools = new ToolRegistry({ fs })
    const loop = new AgentLoop({ adapter: mockAdapter, tools })

    const res = await loop.run('Write energy equation')
    expect(res.response).toBe('Here is your LaTeX formula: $E = mc^2$')
    expect(res.steps).toHaveLength(0)
    expect(res.tokensUsed).toEqual({ inputTokens: 20, outputTokens: 10 })
  })

  it('orchestrates multi-step tool call and final response', async () => {
    const fs = new VirtualFS({ empty: true })
    fs.writeFile(
      'main.tex',
      '\\documentclass{article}\n\\begin{document}\nInitial\n\\end{document}',
    )
    const tools = new ToolRegistry({ fs })

    // Turn 1: model asks to read_file
    // Turn 2: model sees file and answers
    let turn = 0
    const mockAdapter: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
        turn++
        if (turn === 1) {
          const call: ToolCall = {
            id: 'call_1',
            type: 'function',
            function: {
              name: 'read_file',
              arguments: JSON.stringify({ path: 'main.tex' }),
            },
          }
          const resp: ChatResponse = {
            message: {
              role: 'assistant',
              content: '',
              tool_calls: [call],
            },
            usage: { inputTokens: 15, outputTokens: 5 },
          }
          return resp
        }

        // Turn 2: verifies tool result is in messages
        const toolMsg = messages.find((m) => m.role === 'tool')
        expect(toolMsg?.content).toContain('\\begin{document}')

        const resp: ChatResponse = {
          message: {
            role: 'assistant',
            content: 'The document contains an article with Initial body.',
          },
          usage: { inputTokens: 25, outputTokens: 15 },
        }
        return resp
      }),
      supportsToolUse: () => true,
    }

    const onToolCall = vi.fn()
    const loop = new AgentLoop({
      adapter: mockAdapter,
      tools,
      onToolCall,
    })

    const res = await loop.run('What is in main.tex?')
    expect(res.response).toBe('The document contains an article with Initial body.')
    expect(res.steps).toHaveLength(1)
    expect(res.steps[0]?.toolCalls[0]?.tool).toBe('read_file')
    expect(res.steps[0]?.toolCalls[0]?.result).toContain('\\begin{document}')
    expect(onToolCall).toHaveBeenCalledTimes(1)
    expect(res.tokensUsed).toEqual({ inputTokens: 40, outputTokens: 20 })
  })

  it('respects approval gate and blocks write when rejected', async () => {
    const fs = new VirtualFS({ empty: true })
    const tools = new ToolRegistry({ fs })

    let turn = 0
    const mockAdapter: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
        turn++
        if (turn === 1) {
          return {
            message: {
              role: 'assistant',
              content: '',
              tool_calls: [
                {
                  id: 'call_write',
                  type: 'function',
                  function: {
                    name: 'write_file',
                    arguments: JSON.stringify({ path: 'test.tex', content: 'new content' }),
                  },
                },
              ],
            },
          }
        }
        const toolMsg = messages.find((m) => m.role === 'tool')
        expect(toolMsg?.content).toContain('User rejected execution')
        return {
          message: {
            role: 'assistant',
            content: 'Understood, I will not write the file.',
          },
        }
      }),
      supportsToolUse: () => true,
    }

    const onApprovalNeeded = vi.fn().mockResolvedValue(false)
    const loop = new AgentLoop({
      adapter: mockAdapter,
      tools,
      onApprovalNeeded,
    })

    const res = await loop.run('Write test.tex')
    expect(res.response).toBe('Understood, I will not write the file.')
    expect(onApprovalNeeded).toHaveBeenCalledTimes(1)
    expect(fs.readFile('test.tex')).toBeNull()
  })

  it('injects context into initial messages', async () => {
    let capturedMessages: ChatMessage[] = []
    const mockAdapter: ModelAdapter = {
      chat: vi.fn(),
      chatComplete: vi.fn().mockImplementation(async (messages: ChatMessage[]) => {
        capturedMessages = messages
        return {
          message: { role: 'assistant', content: 'Done' },
        }
      }),
      supportsToolUse: () => true,
    }

    const fs = new VirtualFS({ empty: true })
    const tools = new ToolRegistry({ fs })
    const loop = new AgentLoop({ adapter: mockAdapter, tools })

    await loop.run('Explain selection', {
      activeFile: 'chapter1.tex',
      cursorPosition: { line: 10, column: 5 },
      selectedText: '\\textbf{Important claim}',
    })

    expect(capturedMessages.length).toBe(2)
    const sys = capturedMessages[0]
    expect(sys?.role).toBe('system')
    expect(sys?.content).toContain('Active file: chapter1.tex')
    expect(sys?.content).toContain('line 10, col 5')
    expect(sys?.content).toContain('\\textbf{Important claim}')
  })
})
