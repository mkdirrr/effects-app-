import { useState, useCallback } from 'react'

/**
 * useChat — Manages AI chat conversation state and IPC communication.
 * V6: Tracks activeModel from failover engine and supports eliteMode toggle.
 */
export function useChat() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeModel, setActiveModel] = useState('Initializing…')

  /**
   * Send a message to the AI agent.
   * @param {string} text - User message
   * @param {boolean} eliteMode - Whether to use Elite model
   */
  const sendMessage = useCallback(async (text, eliteMode = false) => {
    if (!text.trim() || isLoading) return

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setError(null)

    try {
      // Build conversation history for context (role + content only)
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const result = await window.antiGravity.chatWithAI(text.trim(), history, eliteMode)

      if (result.success) {
        // V6: Track which model resolved the request
        if (result.data.activeModel) {
          setActiveModel(result.data.activeModel)
        }

        const aiMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.message,
          sources: result.data.sources || [],
          activeModel: result.data.activeModel || 'Unknown',
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        const errMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ **Error:** ${result.error || 'Something went wrong. Please try again.'}`,
          sources: [],
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, errMsg])
      }
    } catch (err) {
      setError(err.message)
      const errMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Connection Error:** ${err.message}`,
        sources: [],
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading])

  /**
   * Clear all chat messages.
   */
  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    activeModel,
    sendMessage,
    clearChat
  }
}
