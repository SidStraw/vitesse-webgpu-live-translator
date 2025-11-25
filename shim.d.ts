import type { ProtocolWithReturn } from 'webext-bridge'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    // define message protocol types
    // see https://github.com/antfu/webext-bridge#type-safe-protocols
    'tab-prev': { title: string | undefined }
    'get-current-tab': ProtocolWithReturn<{ tabId: number }, { title?: string }>

    // WebGPU Live Translator messages
    'start-capture': ProtocolWithReturn<{ tabId: number }, { success: boolean, error?: string }>
    'stop-capture': ProtocolWithReturn<Record<string, never>, { success: boolean }>
    'transcription-result': { text: string, isFinal: boolean }
    'model-status': { status: 'loading' | 'ready' | 'error', progress?: number, error?: string }
    'capture-status': { isCapturing: boolean }
  }
}
