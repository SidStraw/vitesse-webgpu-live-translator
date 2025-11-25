/* eslint-disable no-console */
import { onMessage, sendMessage } from 'webext-bridge/content-script'
import { createApp } from 'vue'
import App from './views/App.vue'
import { setupApp } from '~/logic/common-setup'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  console.info('[vitesse-webext] WebGPU Live Translator content script loaded')

  // communication example: send previous tab title from background page
  onMessage('tab-prev', ({ data }) => {
    console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  })

  // Handle transcription results
  onMessage('transcription-result', ({ data }) => {
    console.log('[vitesse-webext] Transcription:', data.text)
    // The Vue app will handle displaying the transcription
    window.dispatchEvent(new CustomEvent('transcription-result', { detail: data }))
  })

  // Handle model status updates
  onMessage('model-status', ({ data }) => {
    console.log('[vitesse-webext] Model status:', data.status)
    window.dispatchEvent(new CustomEvent('model-status', { detail: data }))
  })

  // Handle capture status updates
  onMessage('capture-status', ({ data }) => {
    console.log('[vitesse-webext] Capture status:', data.isCapturing)
    window.dispatchEvent(new CustomEvent('capture-status', { detail: data }))
  })

  // mount component to context window
  const container = document.createElement('div')
  container.id = __NAME__
  const root = document.createElement('div')
  const styleEl = document.createElement('link')
  const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  styleEl.setAttribute('rel', 'stylesheet')
  styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
  shadowDOM.appendChild(styleEl)
  shadowDOM.appendChild(root)
  document.body.appendChild(container)
  const app = createApp(App)
  setupApp(app)
  app.mount(root)
})()

// Export functions for Vue components to use
export async function startCapture() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      const result = await sendMessage('start-capture', { tabId: tabs[0].id }, 'background')
      return result
    }
    return { success: false, error: 'No active tab found' }
  }
  catch (error) {
    console.error('[vitesse-webext] Start capture error:', error)
    return { success: false, error: String(error) }
  }
}

export async function stopCapture() {
  try {
    const result = await sendMessage('stop-capture', {}, 'background')
    return result
  }
  catch (error) {
    console.error('[vitesse-webext] Stop capture error:', error)
    return { success: false }
  }
}
