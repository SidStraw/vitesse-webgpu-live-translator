/* eslint-disable no-console */
import { onMessage, sendMessage } from 'webext-bridge/background'
import type { Tabs } from 'webextension-polyfill'
import '~/types/chrome.d.ts'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

// Offscreen document state
let offscreenDocumentCreated = false

// Create or get offscreen document
async function ensureOffscreenDocument() {
  // Check if offscreen document already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('dist/offscreen/index.html')],
  })

  if (existingContexts.length > 0) {
    offscreenDocumentCreated = true
    return
  }

  // Create offscreen document
  if (!offscreenDocumentCreated) {
    try {
      await chrome.offscreen.createDocument({
        url: 'dist/offscreen/index.html',
        reasons: ['AUDIO_PLAYBACK', 'USER_MEDIA'],
        justification: 'Required for WebGPU-accelerated Whisper AI transcription and audio processing',
      })
      offscreenDocumentCreated = true
      console.log('[Background] Offscreen document created')
    }
    catch (error) {
      console.error('[Background] Failed to create offscreen document:', error)
      throw error
    }
  }
}

// Close offscreen document (reserved for future use)
async function _closeOffscreenDocument() {
  if (offscreenDocumentCreated) {
    try {
      await chrome.offscreen.closeDocument()
      offscreenDocumentCreated = false
      console.log('[Background] Offscreen document closed')
    }
    catch (error) {
      console.error('[Background] Failed to close offscreen document:', error)
    }
  }
}

browser.runtime.onInstalled.addListener((): void => {
  console.log('[Background] Extension installed')
})

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId
    return
  }

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  }
  catch {
    return
  }

  console.log('[Background] Previous tab:', tab)
  sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId })
})

onMessage('get-current-tab', async () => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    return {
      title: tab?.title,
    }
  }
  catch {
    return {
      title: undefined,
    }
  }
})

// Handle start capture request from content script
onMessage('start-capture', async ({ data }) => {
  try {
    const tabId = data.tabId
    console.log('[Background] Start capture requested for tab:', tabId)

    // Ensure offscreen document exists
    await ensureOffscreenDocument()

    // Get media stream ID using tabCapture
    const streamId = await new Promise<string>((resolve, reject) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        }
        else if (streamId) {
          resolve(streamId)
        }
        else {
          reject(new Error('Failed to get media stream ID'))
        }
      })
    })

    console.log('[Background] Got stream ID:', streamId)

    // Send stream ID to offscreen document
    await chrome.runtime.sendMessage({
      type: 'START_CAPTURE',
      target: 'offscreen',
      streamId,
      tabId,
    })

    return { success: true }
  }
  catch (error) {
    console.error('[Background] Start capture failed:', error)
    return { success: false, error: String(error) }
  }
})

// Handle stop capture request
onMessage('stop-capture', async () => {
  try {
    console.log('[Background] Stop capture requested')

    // Send stop message to offscreen document
    await chrome.runtime.sendMessage({
      type: 'STOP_CAPTURE',
      target: 'offscreen',
    })

    return { success: true }
  }
  catch (error) {
    console.error('[Background] Stop capture failed:', error)
    return { success: false }
  }
})

// Listen for messages from offscreen document
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'background')
    return

  if (message.type === 'TRANSCRIPTION_RESULT') {
    // Forward transcription to all content scripts
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          sendMessage('transcription-result', {
            text: message.text,
            isFinal: message.isFinal,
          }, { context: 'content-script', tabId: tab.id }).catch(() => {
            // Tab might not have content script, ignore
          })
        }
      }
    })
    sendResponse({ success: true })
  }
  else if (message.type === 'MODEL_STATUS') {
    // Forward model status to all content scripts
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          sendMessage('model-status', {
            status: message.status,
            progress: message.progress,
            error: message.error,
          }, { context: 'content-script', tabId: tab.id }).catch(() => {
            // Tab might not have content script, ignore
          })
        }
      }
    })
    sendResponse({ success: true })
  }
  else if (message.type === 'CAPTURE_STATUS') {
    // Forward capture status to all content scripts
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          sendMessage('capture-status', {
            isCapturing: message.isCapturing,
          }, { context: 'content-script', tabId: tab.id }).catch(() => {
            // Tab might not have content script, ignore
          })
        }
      }
    })
    sendResponse({ success: true })
  }

  return true // Keep message channel open for async response
})
