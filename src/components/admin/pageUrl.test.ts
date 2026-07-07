import { describe, expect, it } from 'vitest'

import { liveEditUrlForPage, publicUrlForPage } from './pageUrl'

describe('publicUrlForPage', () => {
  it('maps the home slug to root', () => {
    expect(publicUrlForPage('home')).toBe('/')
  })
  it('maps any other slug to /{slug}', () => {
    expect(publicUrlForPage('about-us')).toBe('/about-us')
  })
  it('treats an empty slug as home', () => {
    expect(publicUrlForPage('')).toBe('/')
  })
})

describe('liveEditUrlForPage', () => {
  it('appends the edit flag to the home url', () => {
    expect(liveEditUrlForPage('home')).toBe('/?edit=1')
  })
  it('appends the edit flag to a normal page url', () => {
    expect(liveEditUrlForPage('faq')).toBe('/faq?edit=1')
  })
})
