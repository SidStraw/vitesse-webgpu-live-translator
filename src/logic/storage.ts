import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'

export interface TranslatorSettings {
  modelId: string
  language: string
  showSubtitles: boolean
  subtitleFontSize: number
  subtitlePosition: 'top' | 'bottom'
}

const defaultSettings: TranslatorSettings = {
  modelId: 'Xenova/whisper-tiny',
  language: 'auto',
  showSubtitles: true,
  subtitleFontSize: 24,
  subtitlePosition: 'bottom',
}

export const { data: translatorSettings, dataReady: settingsReady } = useWebExtensionStorage<TranslatorSettings>(
  'translator-settings',
  defaultSettings,
)

export const { data: storageDemo, dataReady: storageDemoReady } = useWebExtensionStorage('webext-demo', 'Storage Demo')
