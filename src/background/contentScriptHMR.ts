import { isFirefox } from '~/env'

// Firefox fetch from content script is the page one, not the extension one.
export async function fetchWrapper(url: string, options?: RequestInit) {
  if (isFirefox)
    return (globalThis as any).content.fetch(url, options)
  return fetch(url, options)
}
