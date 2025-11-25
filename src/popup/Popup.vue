<script setup lang="ts">
import { ref } from 'vue'
import { sendMessage } from 'webext-bridge/popup'

const isCapturing = ref(false)
const status = ref('Ready')

async function startCapture() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (tabs[0]?.id) {
      status.value = 'Starting capture...'
      const result = await sendMessage('start-capture', { tabId: tabs[0].id }, 'background')
      if (result.success) {
        isCapturing.value = true
        status.value = 'Capturing audio...'
      }
      else {
        status.value = `Error: ${result.error || 'Unknown error'}`
      }
    }
  }
  catch (error) {
    status.value = `Error: ${error}`
  }
}

async function stopCapture() {
  try {
    status.value = 'Stopping...'
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

function openOptions() {
  browser.runtime.openOptionsPage()
}
</script>

<template>
  <main class="w-[300px] p-4 text-center">
    <h1 class="text-xl font-bold text-teal-600 mb-2">
      🎙️ WebGPU Live Translator
    </h1>

    <p class="text-sm text-gray-600 mb-4">
      Real-time speech transcription using WebGPU-accelerated Whisper AI
    </p>

    <div class="mb-4">
      <p class="text-sm" :class="isCapturing ? 'text-green-600' : 'text-gray-500'">
        Status: {{ status }}
      </p>
    </div>

    <div class="space-y-2">
      <button
        v-if="!isCapturing"
        class="btn w-full"
        @click="startCapture"
      >
        ▶️ Start Capture
      </button>
      <button
        v-else
        class="btn w-full bg-red-500 hover:bg-red-600"
        @click="stopCapture"
      >
        ⏹️ Stop Capture
      </button>

      <button
        class="btn w-full bg-gray-500 hover:bg-gray-600"
        @click="openOptions"
      >
        ⚙️ Settings
      </button>
    </div>

    <div class="mt-4 text-xs text-gray-400">
      <p>Open a YouTube live stream and click Start to begin.</p>
    </div>
  </main>
</template>
