/**
 * Anti-Gravity V6 — Gemini AI Agent with Multi-Model Failover
 * Automatically cycles through model chain on 404/429/503 errors.
 * Returns the active model label so the UI can show which model is serving.
 */

const { GoogleGenAI } = require('@google/genai')

// ── Model Priority Chain ──
// The failover engine tries each model in order. If Primary returns 404/429/503,
// it silently falls through to the next model without making the user wait.
const MODEL_CHAIN = [
  { id: 'gemini-2.5-flash',        label: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite',   label: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-2.5-pro',          label: 'Gemini 2.5 Pro' },
]

// Elite Model — for complex VFX reasoning only
const ELITE_MODEL = { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Elite)' }

// ── Retryable HTTP status codes ──
const RETRYABLE_CODES = new Set([404, 429, 503])

let ai = null
let localManifest = ''
let rawPluginData = []
let lastActiveModel = 'Initializing…'

/**
 * Initialize the Gemini agent with the full local plugin manifest.
 * @param {Array} plugins - Full plugin objects from scanner
 */
function initAgent(plugins) {
  const apiKey = process.env.GEMINI_API_KEY

  if (apiKey && apiKey !== 'your-gemini-api-key-here') {
    ai = new GoogleGenAI({ apiKey })
  }

  rawPluginData = plugins

  // Build full verbose manifest — Gemini can handle it all
  localManifest = plugins.map(p =>
    `- ${p.name} | Type: ${p.type} | Extension: ${p.extension} | Category: ${p.category} | Size: ${p.size} | Path: ${p.path} | Modified: ${p.modifiedDate}`
  ).join('\n')

  console.log(`[Gemini Agent V6] Initialized with ${plugins.length} plugins (full manifest)`)
}

/**
 * Build the system instruction with full local context.
 */
function getSystemInstruction() {
  return `You are **Anti-Gravity AI**, an expert Adobe After Effects plugin assistant built into the Anti-Gravity V6 desktop application.

## Your Capabilities
1. **Full Local Knowledge**: You have the COMPLETE list of every plugin and preset installed on this user's machine. The full manifest is below — use it to answer questions about what they have installed.
2. **Live Web Search**: You have access to Google Search. Use it when asked about tutorials, workflows, documentation, "best-of" lists, pricing, comparisons, or any question that benefits from current web data.

## Behavior Rules
- When a user asks about a specific plugin, FIRST check their installed list. If found, confirm they have it installed and include relevant details (type, category, file size).
- When asked "how to" questions, tutorials, or workflows — ALWAYS use Google Search to find the latest information. Combine web results with local context.
- When a plugin is NOT installed, tell the user and suggest similar installed alternatives from their library.
- Format responses with Markdown: use **bold**, headers (##), bullet points, and \`code\` blocks for AE expressions.
- Be concise but thorough. Reference sources naturally when using web data.
- If the user asks about their setup, you can provide statistics from the manifest (total plugins, categories, etc.).

## User's Complete Plugin & Preset Library
Total: ${rawPluginData.length} items

${localManifest || '(No plugins scanned yet)'}
`
}

/**
 * Determine if an error is retryable (404, 429, 503).
 * @param {Error} err
 * @returns {boolean}
 */
function isRetryableError(err) {
  // Check err.status (Google GenAI SDK sets this)
  if (err.status && RETRYABLE_CODES.has(err.status)) return true

  // Check err.httpStatusCode
  if (err.httpStatusCode && RETRYABLE_CODES.has(err.httpStatusCode)) return true

  // Fallback: parse error message for status codes
  const msg = err.message || ''
  for (const code of RETRYABLE_CODES) {
    if (msg.includes(String(code))) return true
  }

  return false
}

/**
 * Core failover engine — tries each model in the chain until one succeeds.
 * On 404/429/503, silently switches to the next model.
 *
 * @param {object} params - { contents, config }
 * @param {boolean} useElite - If true, prepend Elite model to the chain
 * @returns {Promise<{ response: object, activeModel: string }>}
 */
async function askGeminiWithRetry({ contents, config }, useElite = false) {
  // Build the model chain for this request
  const chain = useElite
    ? [ELITE_MODEL, ...MODEL_CHAIN]
    : [...MODEL_CHAIN]

  let lastError = null

  for (const model of chain) {
    try {
      console.log(`[Failover] Trying model: ${model.id} (${model.label})`)

      const response = await ai.models.generateContent({
        model: model.id,
        contents,
        config
      })

      // Success — update the active model tracker
      lastActiveModel = model.label
      console.log(`[Failover] ✓ Success with: ${model.label}`)

      return { response, activeModel: model.label }
    } catch (err) {
      lastError = err
      const statusCode = err.status || err.httpStatusCode || 'unknown'

      if (isRetryableError(err)) {
        console.warn(`[Failover] ✗ ${model.label} returned ${statusCode} — switching to next model…`)
        continue // Try next model in chain
      }

      // Non-retryable error (e.g. 401 bad API key) — throw immediately
      console.error(`[Failover] ✗ ${model.label} returned non-retryable error (${statusCode}):`, err.message)
      throw err
    }
  }

  // All models exhausted
  console.error('[Failover] ✗ All models in the chain failed.')
  throw lastError || new Error('All models in the failover chain are unavailable. Please try again later.')
}

/**
 * Extract grounding sources from Gemini response.
 * @param {object} response - Gemini API response
 * @returns {Array<{ title: string, url: string, snippet: string }>}
 */
function extractSources(response) {
  const sources = []
  try {
    const candidate = response.candidates?.[0]
    const metadata = candidate?.groundingMetadata

    if (metadata?.groundingChunks) {
      for (const chunk of metadata.groundingChunks) {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || 'Web Result',
            url: chunk.web.uri || '',
            snippet: ''
          })
        }
      }
    }

    // Also check searchEntryPoint for the search query used
    if (metadata?.searchEntryPoint?.renderedContent) {
      // This contains the Google Search widget HTML — we just extract sources above
    }
  } catch (err) {
    console.error('[Gemini] Error extracting sources:', err.message)
  }
  return sources
}

/**
 * Chat with the Gemini agent — auto-failover across model chain.
 * @param {string} userMessage
 * @param {Array<{ role: string, content: string }>} conversationHistory
 * @param {boolean} eliteMode - Use the Elite model for complex VFX reasoning
 * @returns {Promise<{ message: string, sources: Array, activeModel: string }>}
 */
async function chat(userMessage, conversationHistory = [], eliteMode = false) {
  if (!ai) {
    return {
      message: '⚠️ **AI Agent not configured.** Add your `GEMINI_API_KEY` to the `.env` file in the project root and restart the app.\n\nGet a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)',
      sources: [],
      activeModel: 'Not configured'
    }
  }

  // Build contents array for multi-turn conversation
  const contents = []

  // Add conversation history
  for (const msg of conversationHistory.slice(-20)) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })
  }

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  })

  try {
    const { response, activeModel } = await askGeminiWithRetry({
      contents,
      config: {
        systemInstruction: getSystemInstruction(),
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    }, eliteMode)

    const text = response.text || 'I wasn\'t able to generate a response. Please try again.'
    const sources = extractSources(response)

    return { message: text, sources, activeModel }
  } catch (err) {
    console.error('[Gemini Agent] Error:', err.message)

    if (err.message?.includes('API_KEY') || err.status === 401 || err.message?.includes('401')) {
      return {
        message: '🔑 **Invalid API Key.** Your Gemini API key appears to be incorrect. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)',
        sources: [],
        activeModel: 'Auth Error'
      }
    }

    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return {
        message: '⏳ **All models rate-limited.** You\'ve hit the free tier limit on all models in the failover chain. Wait a moment and try again.',
        sources: [],
        activeModel: 'Rate Limited'
      }
    }

    return {
      message: `❌ **Error:** ${err.message}`,
      sources: [],
      activeModel: 'Error'
    }
  }
}

/**
 * Quick web search via Gemini with failover (for Command Palette).
 * @param {string} query
 * @returns {Promise<{ results: Array<{ title: string, url: string, content: string }>, activeModel: string }>}
 */
async function quickSearch(query) {
  if (!ai) {
    return { results: [], error: 'Gemini API key not configured.', activeModel: 'Not configured' }
  }

  try {
    const { response, activeModel } = await askGeminiWithRetry({
      contents: `Search the web and return the top results for this After Effects related query. Be very brief — just list the most relevant findings with source names:\n\n"${query}"`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
        maxOutputTokens: 1024
      }
    })

    const sources = extractSources(response)
    const results = sources.map(s => ({
      title: s.title,
      url: s.url,
      content: s.snippet || response.text?.substring(0, 200) || ''
    }))

    return { results, activeModel }
  } catch (err) {
    console.error('[Gemini Search] Error:', err.message)
    return { results: [], error: err.message, activeModel: 'Error' }
  }
}

/**
 * Get the last active model label (for status queries).
 * @returns {string}
 */
function getActiveModel() {
  return lastActiveModel
}

module.exports = { initAgent, chat, quickSearch, getActiveModel }
