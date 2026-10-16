import { describe, expect, it } from 'vitest'
import { chartLayouts } from './chartLayouts'

describe('chartLayouts', () => {
  it('provides a title and labeled axes for every simulation chart', () => {
    const layouts = chartLayouts('log')

    expect(layouts).toHaveLength(2)
    for (const layout of layouts) {
      expect(layout.title.text).toBeTruthy()
      expect(layout.xaxis.title.text).toBeTruthy()
      expect(layout.yaxis.title.text).toBeTruthy()
      expect(layout.xaxis.automargin).toBe(true)
      expect(layout.yaxis.automargin).toBe(true)
    }
    expect(layouts[1].title.text).toBe('Selected individual wealth paths (20 investors)')
    expect(layouts[1].yaxis.type).toBe('log')
  })
})
