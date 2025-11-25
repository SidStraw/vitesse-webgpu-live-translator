/* eslint-disable no-console */
/**
 * Offscreen Document - WebGPU AI Engine
 *
 * This is the core AI processing unit that:
 * 1. Loads the Whisper model using Transformers.js with WebGPU acceleration
 * 2. Receives audio stream ID from background script
 * 3. Processes audio in real-time using MediaRecorder or AudioWorklet
 * 4. Sends transcription results back to background script
 */

import { pipeline } from '@huggingface/transformers'

// State management
let audioContext: AudioContext | null = null
let mediaStream: MediaStream | null = null
let _mediaRecorder: MediaRecorder | null = null
let transcriber: any = null
let isCapturing = false
let audioChunks: Float32Array[] = []

// Model configuration
const MODEL_ID = 'Xenova/whisper-tiny'

// Notify background of status
function notifyBackground(type: string, data: Record<string, any>) {
  chrome.runtime.sendMessage({
    target: 'background',
    type,
    ...data,
  })
}

// Initialize the Whisper model
async function initializeModel() {
  try {
    notifyBackground('MODEL_STATUS', { status: 'loading', progress: 0 })

    console.log('[Offscreen] Loading Whisper model...')

    // Create the automatic speech recognition pipeline
    // Using WebGPU when available, falling back to WASM
    transcriber = await pipeline('automatic-speech-recognition', MODEL_ID, {
      device: 'webgpu',
      dtype: 'fp32',
      progress_callback: (progress: any) => {
        if (progress.progress) {
          console.log(`[Offscreen] Model loading: ${Math.round(progress.progress)}%`)
          notifyBackground('MODEL_STATUS', {
            status: 'loading',
            progress: Math.round(progress.progress),
          })
        }
      },
    })

    console.log('[Offscreen] Whisper model loaded successfully')
    notifyBackground('MODEL_STATUS', { status: 'ready' })
  }
  catch (error) {
    console.error('[Offscreen] Failed to load model:', error)

    // Try falling back to WASM if WebGPU fails
    try {
      console.log('[Offscreen] Falling back to WASM...')
      transcriber = await pipeline('automatic-speech-recognition', MODEL_ID, {
        dtype: 'fp32',
        progress_callback: (progress: any) => {
          if (progress.progress) {
            notifyBackground('MODEL_STATUS', {
              status: 'loading',
              progress: Math.round(progress.progress),
            })
          }
        },
      })
      console.log('[Offscreen] Whisper model loaded with WASM fallback')
      notifyBackground('MODEL_STATUS', { status: 'ready' })
    }
    catch (fallbackError) {
      console.error('[Offscreen] WASM fallback also failed:', fallbackError)
      notifyBackground('MODEL_STATUS', {
        status: 'error',
        error: String(fallbackError),
      })
    }
  }
}

// Start audio capture
async function startCapture(streamId: string) {
  if (isCapturing) {
    console.log('[Offscreen] Already capturing')
    return
  }

  try {
    console.log('[Offscreen] Starting capture with stream ID:', streamId)

    // Create MediaStream from the stream ID
    // Chrome-specific constraint for tab audio capture
    const constraints: MediaStreamConstraints = {
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      } as MediaTrackConstraints,
    }
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

    // Create audio context
    audioContext = new AudioContext({ sampleRate: 16000 })
    const source = audioContext.createMediaStreamSource(mediaStream)

    // Connect to destination to allow user to hear the audio
    source.connect(audioContext.destination)

    // Create a script processor for audio processing
    const processor = audioContext.createScriptProcessor(4096, 1, 1)
    source.connect(processor)
    processor.connect(audioContext.destination)

    // Collect audio samples
    processor.onaudioprocess = (e) => {
      if (!isCapturing)
        return
      const inputData = e.inputBuffer.getChannelData(0)
      audioChunks.push(new Float32Array(inputData))
    }

    isCapturing = true
    notifyBackground('CAPTURE_STATUS', { isCapturing: true })

    // Start periodic transcription
    startPeriodicTranscription()

    console.log('[Offscreen] Capture started successfully')
  }
  catch (error) {
    console.error('[Offscreen] Failed to start capture:', error)
    notifyBackground('CAPTURE_STATUS', { isCapturing: false })
  }
}

// Stop audio capture
function stopCapture() {
  console.log('[Offscreen] Stopping capture...')

  isCapturing = false

  if (_mediaRecorder) {
    _mediaRecorder.stop()
    _mediaRecorder = null
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  audioChunks = []
  notifyBackground('CAPTURE_STATUS', { isCapturing: false })

  console.log('[Offscreen] Capture stopped')
}

// Periodic transcription
let transcriptionInterval: number | null = null

function startPeriodicTranscription() {
  if (transcriptionInterval) {
    clearInterval(transcriptionInterval)
  }

  // Transcribe every 3 seconds
  transcriptionInterval = window.setInterval(async () => {
    if (!isCapturing || audioChunks.length === 0)
      return

    // Concatenate all audio chunks
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const audioData = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of audioChunks) {
      audioData.set(chunk, offset)
      offset += chunk.length
    }

    // Clear processed chunks
    audioChunks = []

    // Skip if audio is too short (less than 0.5 seconds)
    if (audioData.length < 8000)
      return

    try {
      if (!transcriber) {
        console.log('[Offscreen] Transcriber not ready')
        return
      }

      console.log('[Offscreen] Transcribing audio chunk...')
      const result = await transcriber(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: false,
      })

      if (result && result.text) {
        const text = result.text.trim()
        if (text) {
          console.log('[Offscreen] Transcription:', text)
          notifyBackground('TRANSCRIPTION_RESULT', {
            text,
            isFinal: true,
          })
        }
      }
    }
    catch (error) {
      console.error('[Offscreen] Transcription error:', error)
    }
  }, 3000)
}

function stopPeriodicTranscription() {
  if (transcriptionInterval) {
    clearInterval(transcriptionInterval)
    transcriptionInterval = null
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen')
    return

  console.log('[Offscreen] Received message:', message.type)

  if (message.type === 'START_CAPTURE') {
    startCapture(message.streamId)
    sendResponse({ success: true })
  }
  else if (message.type === 'STOP_CAPTURE') {
    stopCapture()
    stopPeriodicTranscription()
    sendResponse({ success: true })
  }

  return true
})

// Initialize model when offscreen document is created
console.log('[Offscreen] Initializing WebGPU Whisper Engine...')
initializeModel()
