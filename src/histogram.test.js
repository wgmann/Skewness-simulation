import { describe, expect, it } from 'vitest'
import { histogramBins } from './histogram'

describe('histogramBins', () => {
  it('counts values into bins, including the maximum value', () => {
    const result = histogramBins([0, 1, 2, 3], 3)

    expect(result.x).toEqual([0.5, 1.5, 2.5])
    expect(result.y).toEqual([1, 1, 2])
    expect(result.y.reduce((total, count) => total + count, 0)).toBe(4)
  })

  it('uses a single bar when all values are equal', () => {
    expect(histogramBins([5, 5, 5])).toEqual({ x: [5], y: [3], width: 1 })
  })
})
