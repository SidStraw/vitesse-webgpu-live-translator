# Vitesse WebGPU Live Translator

A Chrome Manifest V3 browser extension for real-time speech transcription using WebGPU-accelerated Whisper AI. Optimized for Apple Silicon (M1/M2) Macs.

## Features

- **Local Real-time Transcription**: Uses WebGPU-accelerated Whisper model for on-device speech-to-text
- **No YouTube CC Dependency**: Directly captures tab audio stream, works with any audio source including VTuber streams
- **Privacy First**: All processing happens locally, no API keys or external servers required
- **MV3 Architecture**: Uses Offscreen Document to run WebGPU in Chrome extensions

## Tech Stack

- **Template**: [vitesse-webext](https://github.com/antfu-collective/vitesse-webext) (Vue 3, Vite, TypeScript)
- **Styling**: UnoCSS (Tailwind CSS compatible)
- **AI Library**: [@huggingface/transformers](https://www.npmjs.com/package/@huggingface/transformers) with Whisper model
- **Browser APIs**: chrome.tabCapture, chrome.offscreen, AudioContext

## Architecture

The extension consists of three main components:

1. **Background (Service Worker)**
   - Listens for user commands
   - Manages tab audio capture permissions via `chrome.tabCapture`
   - Controls Offscreen Document lifecycle

2. **Offscreen Document (AI Engine)**
   - Invisible HTML page with full DOM and WebGPU access
   - Loads and runs Whisper model (Xenova/whisper-tiny)
   - Processes audio stream and performs transcription
   - Connects audio to AudioContext.destination (users still hear the audio)

3. **Content Script (UI)**
   - Injects floating subtitle overlay on YouTube pages
   - Displays transcription results
   - Provides Start/Stop controls

## Installation

```bash
# Install pnpm if not installed
npm install -g pnpm

# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build for production
pnpm build
```

## Loading the Extension

1. Build the extension: `pnpm build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension` folder

## Usage

1. Navigate to a YouTube live stream
2. Click the extension popup or use the floating control on the page
3. Click "Start Capture" to begin transcription
4. Subtitles will appear in a draggable overlay

## Permissions

- `tabCapture`: Required for capturing tab audio
- `offscreen`: Required for WebGPU environment
- `activeTab`: Access to current tab
- `storage`: Persist user settings
- `scripting`: Content script injection

## Development

```bash
# Run in development mode with HMR
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run tests
pnpm test
```

## License

MIT
