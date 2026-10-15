import { describe, it, expect } from 'vitest'
import { logParams, mean, median, skewness, topShare, simulate, mulberry32 } from './simulation'

describe('simulation', () => {
  it('logParams reproduces the arithmetic mean and volatility of gross returns', () => {
    const { m, s } = logParams(0.07, 0.2)
    expect(Math.exp(m + (s * s) / 2)).toBeCloseTo(1.07, 10)
    const variance = (Math.exp(s * s) - 1) * Math.exp(2 * m + s * s)
    expect(Math.sqrt(variance)).toBeCloseTo(0.2, 10)
    expect(m).toBeLessThan(Math.log(1.07))
  })
  it('zero volatility gives deterministic growth', () => {
    const r = simulate({ mu: 0.05, sigma: 0, years: 10, n: 100, seed: 1 })
    expect(r.summary.mean).toBeCloseTo(Math.pow(1.05, 10), 8)
    expect(r.summary.median).toBeCloseTo(Math.pow(1.05, 10), 8)
  })
  it('basic statistics', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5)
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
    expect(skewness([1, 2, 3])).toBeCloseTo(0, 12)
    expect(skewness([1, 1, 1, 10])).toBeGreaterThan(0)
    expect(topShare([1, 1, 1, 7], 0.25)).toBeCloseTo(0.7, 12)
  })
  it('is reproducible and sensitive to the seed', () => {
    const p = { mu: 0.07, sigma: 0.2, years: 20, n: 200, seed: 7 }
    expect(simulate(p).terminal).toEqual(simulate(p).terminal)
    expect(simulate({ ...p, seed: 8 }).terminal).not.toEqual(simulate(p).terminal)
    expect(mulberry32(1)()).toBeLessThan(1)
  })
  it('produces right skew with mean above median', () => {
    const r = simulate({ mu: 0.07, sigma: 0.2, years: 60, n: 5000, seed: 3 })
    expect(r.summary.skewness).toBeGreaterThan(0.5)
    expect(r.summary.mean).toBeGreaterThan(r.summary.median)
    expect(r.summary.top1).toBeGreaterThan(0.01)
    expect(r.t.length).toBe(61)
  })
})
