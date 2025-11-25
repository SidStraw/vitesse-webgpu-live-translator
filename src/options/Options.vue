<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { settingsReady, translatorSettings } from '~/logic/storage'

const isReady = ref(false)

const modelOptions = [
  { value: 'Xenova/whisper-tiny', label: 'Whisper Tiny (Fastest)' },
  { value: 'Xenova/whisper-base', label: 'Whisper Base (Better accuracy)' },
  { value: 'Xenova/whisper-small', label: 'Whisper Small (Best accuracy, slower)' },
]

const languageOptions = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
]

onMounted(async () => {
  await settingsReady
  isReady.value = true
})
</script>

<template>
  <main class="max-w-2xl mx-auto p-8">
    <h1 class="text-2xl font-bold text-teal-600 mb-6">
      🎙️ WebGPU Live Translator Settings
    </h1>

    <div v-if="!isReady" class="text-center py-8">
      <p class="text-gray-500">
        Loading settings...
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Model Selection -->
      <div class="bg-white rounded-lg p-4 shadow">
        <h2 class="text-lg font-semibold mb-3">
          Whisper Model
        </h2>
        <select
          v-model="translatorSettings.modelId"
          class="w-full p-2 border rounded"
        >
          <option v-for="option in modelOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <p class="text-sm text-gray-500 mt-2">
          Smaller models are faster but less accurate. Larger models provide better accuracy but require more resources.
        </p>
      </div>

      <!-- Language Selection -->
      <div class="bg-white rounded-lg p-4 shadow">
        <h2 class="text-lg font-semibold mb-3">
          Language
        </h2>
        <select
          v-model="translatorSettings.language"
          class="w-full p-2 border rounded"
        >
          <option v-for="option in languageOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        <p class="text-sm text-gray-500 mt-2">
          Select the language to transcribe. Auto-detect works for most languages.
        </p>
      </div>

      <!-- Subtitle Settings -->
      <div class="bg-white rounded-lg p-4 shadow">
        <h2 class="text-lg font-semibold mb-3">
          Subtitle Display
        </h2>

        <div class="space-y-4">
          <label class="flex items-center gap-2">
            <input
              v-model="translatorSettings.showSubtitles"
              type="checkbox"
              class="w-4 h-4"
            >
            <span>Show subtitles overlay</span>
          </label>

          <div>
            <label class="block text-sm mb-1">Font Size: {{ translatorSettings.subtitleFontSize }}px</label>
            <input
              v-model.number="translatorSettings.subtitleFontSize"
              type="range"
              min="12"
              max="48"
              class="w-full"
            >
          </div>

          <div>
            <label class="block text-sm mb-1">Position</label>
            <select
              v-model="translatorSettings.subtitlePosition"
              class="w-full p-2 border rounded"
            >
              <option value="top">
                Top
              </option>
              <option value="bottom">
                Bottom
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="bg-blue-50 rounded-lg p-4">
        <h2 class="text-lg font-semibold mb-2 text-blue-700">
          ℹ️ About
        </h2>
        <p class="text-sm text-blue-600">
          This extension uses WebGPU-accelerated Whisper AI for real-time speech-to-text transcription.
          It works offline and doesn't send your audio to any external servers.
        </p>
        <p class="text-sm text-blue-600 mt-2">
          Optimized for Apple Silicon (M1/M2) Macs with WebGPU support.
        </p>
      </div>
    </div>
  </main>
</template>
