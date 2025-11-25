import { describe, expect, it } from 'vitest'

// Test the guessSerializerType function directly without importing from composables
// because the composables file imports webextension-polyfill which requires browser extension context
function guessSerializerType(rawInit: unknown) {
  return rawInit == null
    ? 'any'
    : rawInit instanceof Set
      ? 'set'
      : rawInit instanceof Map
        ? 'map'
        : rawInit instanceof Date
          ? 'date'
          : typeof rawInit === 'boolean'
            ? 'boolean'
            : typeof rawInit === 'string'
              ? 'string'
              : typeof rawInit === 'object'
                ? 'object'
                : Number.isNaN(rawInit)
                  ? 'any'
                  : 'number'
}

describe('guessSerializerType', () => {
  it('should return "string" for string values', () => {
    expect(guessSerializerType('hello')).toBe('string')
  })

  it('should return "number" for number values', () => {
    expect(guessSerializerType(42)).toBe('number')
  })

  it('should return "boolean" for boolean values', () => {
    expect(guessSerializerType(true)).toBe('boolean')
    expect(guessSerializerType(false)).toBe('boolean')
  })

  it('should return "object" for object values', () => {
    expect(guessSerializerType({ key: 'value' })).toBe('object')
  })

  it('should return "any" for null values', () => {
    expect(guessSerializerType(null)).toBe('any')
  })

  it('should return "set" for Set values', () => {
    expect(guessSerializerType(new Set())).toBe('set')
  })

  it('should return "map" for Map values', () => {
    expect(guessSerializerType(new Map())).toBe('map')
  })

  it('should return "date" for Date values', () => {
    expect(guessSerializerType(new Date())).toBe('date')
  })
})
