<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { sendMessage } from 'webext-bridge/popup'

const isCapturing = ref(false)
const status = ref('Ready')
const transcriptions = ref<string[]>([])

// Listen for transcription results
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TRANSCRIPTION_RESULT') {
    transcriptions.value.unshift(message.text)
    // Keep only last 50 transcriptions
    if (transcriptions.value.length > 50) {
      transcriptions.value.pop()
    }
  }
  else if (message.type === 'MODEL_STATUS') {
    status.value = message.status === 'ready' ? 'Model ready' : `Loading: ${message.progress}%`
  }
  else if (message.type === 'CAPTURE_STATUS') {
    isCapturing.value = message.isCapturing
  }
})

async function startCapture() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      status.value = 'Starting...'
      const result = await sendMessage('start-capture', { tabId: tabs[0].id }, 'background')
      if (result.success) {
        isCapturing.value = true
        status.value = 'Capturing'
      }
      else {
        status.value = `Error: ${result.error}`
      }
    }
  }
  catch (error) {
    status.value = `Error: ${error}`
  }
}

async function stopCapture() {
  try {
    const result = await sendMessage('stop-capture', {}, 'background')
    if (result.success) {
      isCapturing.value = false
      status.value = 'Stopped'
    }
  }
  catch (error) {
    status.value = `Error: ${error}`
  }
}

function clearTranscriptions() {
  transcriptions.value = []
}

onMounted(() => {
  status.value = 'Ready'
})
</script>

<template>
  <main class="h-screen flex flex-col p-4">
    <header class="mb-4">
      <h1 class="text-lg font-bold text-teal-600">
        🎙️ Live Transcription
      </h1>
      <p class="text-sm text-gray-500">
        Status: {{ status }}
      </p>
    </header>

    <div class="flex gap-2 mb-4">
      <button
        v-if="!isCapturing"
        class="btn flex-1"
        @click="startCapture"
      >
        ▶️ Start
      </button>
      <button
        v-else
        class="btn flex-1 bg-red-500 hover:bg-red-600"
        @click="stopCapture"
      >
        ⏹️ Stop
      </button>
      <button
        class="btn bg-gray-500 hover:bg-gray-600"
        @click="clearTranscriptions"
      >
        🗑️
      </button>
    </div>

    <div class="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-3">
      <div v-if="transcriptions.length === 0" class="text-center text-gray-400 py-8">
        <p>No transcriptions yet.</p>
        <p class="text-sm">
          Start capturing to see live text.
        </p>
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="(text, idx) in transcriptions"
          :key="idx"
          class="bg-white p-2 rounded shadow-sm text-sm"
        >
          {{ text }}
        </div>
      </div>
    </div>
  </main>
</template>
