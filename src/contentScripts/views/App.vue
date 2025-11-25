<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useDraggable } from '@vueuse/core'
import 'uno.css'

// State
const show = ref(true)
const isCapturing = ref(false)
const modelStatus = ref<'loading' | 'ready' | 'error'>('loading')
const modelProgress = ref(0)
const transcriptionText = ref('')
const transcriptionHistory = ref<string[]>([])

// Draggable overlay
const overlayRef = ref<HTMLElement | null>(null)
const { style } = useDraggable(overlayRef, {
  initialValue: { x: window.innerWidth / 2 - 200, y: window.innerHeight - 200 },
})

// Start/Stop capture
async function toggleCapture() {
  if (isCapturing.value) {
    // Stop capture
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true })
      if (tabs[0]?.id) {
        await browser.runtime.sendMessage({
          type: 'STOP_CAPTURE_REQUEST',
          tabId: tabs[0].id,
        })
      }
    }
    catch (error) {
      console.error('[Content] Stop capture error:', error)
    }
    isCapturing.value = false
  }
  else {
    // Start capture
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true })
      if (tabs[0]?.id) {
        await browser.runtime.sendMessage({
          type: 'START_CAPTURE_REQUEST',
          tabId: tabs[0].id,
        })
      }
    }
    catch (error) {
      console.error('[Content] Start capture error:', error)
    }
    isCapturing.value = true
  }
}

// Event listeners for custom events from content script
function handleTranscriptionResult(event: Event) {
  const detail = (event as CustomEvent).detail
  transcriptionText.value = detail.text
  if (detail.isFinal && detail.text) {
    transcriptionHistory.value.push(detail.text)
    // Keep only last 5 transcriptions
    if (transcriptionHistory.value.length > 5) {
      transcriptionHistory.value.shift()
    }
  }
}

function handleModelStatus(event: Event) {
  const detail = (event as CustomEvent).detail
  modelStatus.value = detail.status
  if (detail.progress !== undefined) {
    modelProgress.value = detail.progress
  }
}

function handleCaptureStatus(event: Event) {
  const detail = (event as CustomEvent).detail
  isCapturing.value = detail.isCapturing
}

onMounted(() => {
  window.addEventListener('transcription-result', handleTranscriptionResult)
  window.addEventListener('model-status', handleModelStatus)
  window.addEventListener('capture-status', handleCaptureStatus)
})

onUnmounted(() => {
  window.removeEventListener('transcription-result', handleTranscriptionResult)
  window.removeEventListener('model-status', handleModelStatus)
  window.removeEventListener('capture-status', handleCaptureStatus)
})
</script>

<template>
  <div class="fixed right-0 bottom-0 m-5 z-[999999] flex flex-col items-end font-sans select-none leading-1em">
    <!-- Subtitle Overlay (Draggable) -->
    <div
      v-show="show && (transcriptionText || transcriptionHistory.length > 0)"
      ref="overlayRef"
      class="fixed bg-black/80 text-white rounded-lg shadow-xl w-[500px] max-w-[80vw] cursor-move subtitle-overlay"
      :style="style"
      p="x-4 y-3"
    >
      <div class="text-xs text-gray-400 mb-2 flex items-center justify-between">
        <span>🎙️ Live Transcription</span>
        <span v-if="isCapturing" class="text-green-400">● Capturing</span>
      </div>

      <!-- Previous transcriptions -->
      <div
        v-for="(text, idx) in transcriptionHistory"
        :key="idx"
        class="text-gray-300 text-sm mb-1 opacity-70"
      >
        {{ text }}
      </div>

      <!-- Current transcription -->
      <div class="text-lg font-medium subtitle-text">
        {{ transcriptionText || 'Waiting for speech...' }}
      </div>
    </div>

    <!-- Control Panel -->
    <div
      v-show="show"
      class="bg-white text-gray-800 rounded-lg shadow w-max h-min"
      p="x-4 y-3"
      m="b-2"
    >
      <h1 class="text-lg font-semibold flex items-center gap-2">
        <span>🎙️</span>
        <span>WebGPU Live Translator</span>
      </h1>

      <!-- Model Status -->
      <div class="text-sm mt-2">
        <template v-if="modelStatus === 'loading'">
          <div class="flex items-center gap-2 text-yellow-600">
            <span class="animate-spin">⏳</span>
            <span>Loading model... {{ modelProgress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              class="bg-teal-600 h-1.5 rounded-full transition-all"
              :style="{ width: `${modelProgress}%` }"
            />
          </div>
        </template>
        <template v-else-if="modelStatus === 'ready'">
          <div class="text-green-600 flex items-center gap-2">
            <span>✅</span>
            <span>Model ready</span>
          </div>
        </template>
        <template v-else>
          <div class="text-red-600 flex items-center gap-2">
            <span>❌</span>
            <span>Model error</span>
          </div>
        </template>
      </div>

      <!-- Capture Button -->
      <button
        class="mt-3 w-full py-2 px-4 rounded font-medium transition-colors"
        :class="isCapturing
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-teal-600 hover:bg-teal-700 text-white'"
        :disabled="modelStatus !== 'ready'"
        @click="toggleCapture"
      >
        {{ isCapturing ? '⏹️ Stop Capture' : '▶️ Start Capture' }}
      </button>
    </div>

    <!-- Toggle Button -->
    <button
      class="flex w-10 h-10 rounded-full shadow cursor-pointer border-none"
      :class="show ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-400 hover:bg-gray-500'"
      @click="show = !show"
    >
      <span class="block m-auto text-white text-lg">{{ show ? '🎙️' : '🔇' }}</span>
    </button>
  </div>
</template>
