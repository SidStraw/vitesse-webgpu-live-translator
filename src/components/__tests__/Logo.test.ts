import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Logo from '../Logo.vue'

describe('logo', () => {
  it('should render', () => {
    const wrapper = mount(Logo)
    expect(wrapper.text()).toBe('WebGPU Live Translator')
  })
})
