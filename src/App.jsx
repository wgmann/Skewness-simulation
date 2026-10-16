import { useMemo, useState } from 'react'
import Plot from './Plot'
import { chartLayouts } from './chartLayouts'
import { histogramBins } from './histogram'
import { DEFAULTS, simulate } from './simulation'

const pct = (x) => (x * 100).toFixed(1) + '%'
const num = (x) => x.toLocaleString(undefined, { maximumFractionDigits: 2 })
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

function Field({ label, value, onChange, min, max, step }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(e.target.value)} />
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export default function App() {
  // Inputs held in display units (percent) for mu and sigma.
  const [p, setP] = useState({ ...DEFAULTS, mu: DEFAULTS.mu * 100, sigma: DEFAULTS.sigma * 100 })
  const [logY, setLogY] = useState(false)
  const set = (k, lo, hi) => (v) => setP((o) => ({ ...o, [k]: v === '' ? '' : clamp(Number(v), lo, hi) }))

  const params = useMemo(() => ({
    mu: (Number(p.mu) || 0) / 100,
    sigma: (Number(p.sigma) || 0) / 100,
    leverage: Number(p.leverage) || 0,
    years: clamp(Math.round(Number(p.years) || 1), 1, 100),
    n: clamp(Math.round(Number(p.n) || 100), 100, 10000),
    seed: Math.round(Number(p.seed) || 0),
  }), [p])

  const r = useMemo(() => simulate(params), [params])
  const s = r.summary
  const yType = logY ? 'log' : 'linear'
  const [baseHistLayout, meanMedianLayout, pathsLayout] = chartLayouts(yType)
  const histLayout = {
    ...baseHistLayout,
    shapes: [1, 5, 8].map((a, i) => ({
      type: 'line',
      xref: 'x',
      yref: 'paper',
      x0: s.utilities[a],
      x1: s.utilities[a],
      y0: 0,
      y1: 0.08,
      line: { color: ['#16a34a', '#f59e0b', '#9333ea'][i], dash: 'dash' },
    })),
    annotations: [1, 5, 8].map((a, i) => ({
      x: s.utilities[a],
      y: 0,
      xref: 'x',
      yref: 'paper',
      text: `A=${a}`,
      showarrow: false,
      yanchor: 'top',
      font: { color: ['#16a34a', '#f59e0b', '#9333ea'][i] },
    })),
  }

  const hist = useMemo(() => {
    const { x, y, width } = histogramBins(r.terminal)
    return [{ type: 'bar', x, y, width, marker: { color: '#3b82f6' }, name: 'Investors' }]
  }, [r])

  const meanMedian = [
    { x: r.t, y: r.meanW, name: 'Mean', mode: 'lines', line: { color: '#ef4444' } },
    { x: r.t, y: r.medianW, name: 'Median', mode: 'lines', line: { color: '#2563eb' } },
  ]
  const paths = r.paths.map((y, i) => ({ x: r.t, y, mode: 'lines', name: `Investor ${i + 1}`, showlegend: false, line: { width: 1 } }))
  return (
    <main>
      <h1>Compounding, Leverage and Utility</h1>
      <p className="lead">
        Explore how leverage changes compounded wealth and mean–variance utility for investors with
        different levels of risk aversion.
      </p>

      <section className="controls">
        <Field label={`Expected arithmetic return: ${p.mu}%`} value={p.mu} onChange={set('mu', -20, 30)} min={-20} max={30} step={0.5} />
        <Field label={`Volatility: ${p.sigma}%`} value={p.sigma} onChange={set('sigma', 0, 100)} min={0} max={100} step={1} />
        <Field label={`Leverage: ${p.leverage}×`} value={p.leverage} onChange={set('leverage', 0, 3)} min={0} max={3} step={0.1} />
        <Field label={`Horizon: ${p.years} years`} value={p.years} onChange={set('years', 1, 100)} min={1} max={100} step={1} />
        <Field label={`Investors: ${p.n}`} value={p.n} onChange={set('n', 100, 10000)} min={100} max={10000} step={100} />
        <label className="field">
          <span>Random seed</span>
          <input type="number" value={p.seed} step={1} onChange={(e) => setP((o) => ({ ...o, seed: e.target.value }))} />
        </label>
        <div className="buttons">
          <button onClick={() => setP((o) => ({ ...o, seed: Math.floor(Math.random() * 1e9) }))}>New random simulation</button>
          <button onClick={() => setP({ ...DEFAULTS, mu: DEFAULTS.mu * 100, sigma: DEFAULTS.sigma * 100 })}>Reset defaults</button>
          <label className="toggle">
            <input type="checkbox" checked={logY} onChange={(e) => setLogY(e.target.checked)} /> Log scale
          </label>
        </div>
      </section>

      <section className="note">
        <strong>Arithmetic vs. log return.</strong> Gross returns are lognormal, R = exp(m + sZ), calibrated so
        that E[R] = 1 + {pct(params.mu * params.leverage)} and the standard deviation of R is {pct(params.sigma * params.leverage)}. This implies
        a log-return volatility s = {pct(s.s)} and a <em>mean log return</em> m = {pct(s.m)}, which is lower
        than the expected arithmetic return (ln(1+μ) = {pct(Math.log(1 + params.mu * params.leverage))}) by about s²/2. The
        median investor compounds at m, the mean at μ.
      </section>

      <section className="stats">
        <div><b>{num(s.mean)}</b>Mean wealth</div>
        <div><b>{num(s.median)}</b>Median wealth</div>
        <div><b>{num(s.skewness)}</b>Skewness</div>
        {[1, 5, 8].map((a) => <div key={a}><b>{num(s.utilities[a])}</b>Mean–variance utility (A={a})</div>)}
      </section>

      <section className="charts">
        <Plot data={hist} layout={histLayout} />
        <Plot data={meanMedian} layout={meanMedianLayout} />
        <Plot data={paths} layout={pathsLayout} />
      </section>

      <section className="explain">
        <h2>Mean–variance utility</h2>
        <p>Utility is calculated from terminal wealth as its mean minus half its variance times risk aversion A.
          Higher A assigns a larger penalty to variation in outcomes. The dashed markers on the histogram show
          each utility value.</p>
      </section>
    </main>
  )
}
