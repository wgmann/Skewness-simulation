// Core simulation calculations (pure functions, no UI dependencies).

export const DEFAULTS = {
  mu: 0.01, // expected annual ARITHMETIC return E[R - 1]
  sigma: 0.05, // st. dev. of the annual simple return
  leverage: 1,
  years: 10,
  n: 5000,
  seed: 42,
}

// Seeded PRNG (mulberry32): returns uniform draws in [0, 1).
export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Standard normal generator (Box-Muller) on top of a uniform generator.
export function normalGenerator(uniform) {
  let spare = null
  return () => {
    if (spare !== null) {
      const z = spare
      spare = null
      return z
    }
    let u = 0
    while (u === 0) u = uniform()
    const v = uniform()
    const r = Math.sqrt(-2 * Math.log(u))
    spare = r * Math.sin(2 * Math.PI * v)
    return r * Math.cos(2 * Math.PI * v)
  }
}

// Lognormal gross return R = exp(m + s Z) with E[R] = 1 + mu and
// sd(R) = sigma. Then s^2 = ln(1 + sigma^2 / (1+mu)^2), m = ln(1+mu) - s^2/2.
// m is the mean LOG return, which is below ln(1+mu) (volatility drag).
export function logParams(mu, sigma) {
  const g = 1 + mu
  const s2 = Math.log(1 + (sigma * sigma) / (g * g))
  return { m: Math.log(g) - s2 / 2, s: Math.sqrt(s2) }
}

export function mean(x) {
  let t = 0
  for (let i = 0; i < x.length; i++) t += x[i]
  return t / x.length
}

export function median(x) {
  const s = Array.from(x).sort((a, b) => a - b)
  const k = s.length >> 1
  return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2
}

// Sample (population-moment) skewness: E[(x-mean)^3] / sd^3.
export function skewness(x) {
  const mu = mean(x)
  let m2 = 0
  let m3 = 0
  for (let i = 0; i < x.length; i++) {
    const d = x[i] - mu
    m2 += d * d
    m3 += d * d * d
  }
  m2 /= x.length
  m3 /= x.length
  return m2 === 0 ? 0 : m3 / Math.pow(m2, 1.5)
}

export function meanVarianceUtility(x, riskAversion) {
  const average = mean(x)
  let variance = 0
  for (let i = 0; i < x.length; i++) variance += (x[i] - average) ** 2
  variance /= x.length
  return average - (riskAversion * variance) / 2
}

export function simulate({ mu, sigma, leverage = 1, years, n, seed }) {
  mu *= leverage
  sigma *= leverage
  const { m, s } = logParams(mu, sigma)
  const rng = normalGenerator(mulberry32(seed))
  let wealth = new Float64Array(n).fill(1)
  const nPaths = Math.min(n, 20)
  const paths = Array.from({ length: nPaths }, () => [1])
  const t = [0]
  const meanW = [1]
  const medianW = [1]
  for (let y = 1; y <= years; y++) {
    for (let i = 0; i < n; i++) wealth[i] *= Math.exp(m + s * rng())
    for (let i = 0; i < nPaths; i++) paths[i].push(wealth[i])
    t.push(y)
    meanW.push(mean(wealth))
    medianW.push(median(wealth))
  }
  return {
    t, paths, meanW, medianW,
    terminal: wealth,
    summary: {
      mean: mean(wealth),
      median: median(wealth),
      skewness: skewness(wealth),
      utilities: Object.fromEntries([1, 5, 8].map((a) => [a, meanVarianceUtility(wealth, a)])),
      ...logParams(mu, sigma),
    },
  }
}
