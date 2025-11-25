// Chrome Extension API type definitions for APIs not yet in @types/chrome

declare namespace chrome {
  namespace runtime {
    interface ContextFilter {
      contextTypes?: ContextType[]
      documentUrls?: string[]
    }

    type ContextType =
      | 'TAB'
      | 'POPUP'
      | 'BACKGROUND'
      | 'OFFSCREEN_DOCUMENT'
      | 'SIDE_PANEL'

    interface ExtensionContext {
      contextType: ContextType
      documentId?: string
      documentOrigin?: string
      documentUrl?: string
      frameId: number
      incognito: boolean
      tabId: number
      windowId: number
    }

    function getContexts(filter: ContextFilter): Promise<ExtensionContext[]>
  }

  namespace offscreen {
    type Reason =
      | 'TESTING'
      | 'AUDIO_PLAYBACK'
      | 'IFRAME_SCRIPTING'
      | 'DOM_SCRAPING'
      | 'BLOBS'
      | 'DOM_PARSER'
      | 'USER_MEDIA'
      | 'DISPLAY_MEDIA'
      | 'WEB_RTC'
      | 'CLIPBOARD'
      | 'LOCAL_STORAGE'
      | 'WORKERS'
      | 'BATTERY_STATUS'
      | 'MATCH_MEDIA'
      | 'GEOLOCATION'

    interface CreateParameters {
      url: string
      reasons: Reason[]
      justification: string
    }

    function createDocument(parameters: CreateParameters): Promise<void>
    function closeDocument(): Promise<void>
  }

  namespace tabCapture {
    interface GetMediaStreamOptions {
      targetTabId?: number
      consumerTabId?: number
    }

    function getMediaStreamId(
      options: GetMediaStreamOptions,
      callback: (streamId: string) => void
    ): void
  }
}

// Chrome-specific media stream constraints for tab capture
interface TabCaptureMediaStreamConstraints {
  audio: {
    mandatory: {
      chromeMediaSource: 'tab'
      chromeMediaSourceId: string
    }
  }
}
