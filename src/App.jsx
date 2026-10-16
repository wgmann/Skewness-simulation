import { useMemo, useState } from 'react'
import Plot from './Plot'
import { chartLayouts } from './chartLayouts'
import { histogramBins } from './histogram'
import { DEFAULTS, simulate } from './simulation'

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
    years: clamp(Math.round(Number(p.years) || 1), 1, 20),
    n: clamp(Math.round(Number(p.n) || 100), 1, 5000),
    seed: Math.round(Number(p.seed) || 0),
  }), [p])

  const r = useMemo(() => simulate(params), [params])
  const s = r.summary
  const yType = logY ? 'log' : 'linear'
  const [baseHistLayout, pathsLayout] = chartLayouts(yType)
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

  const paths = r.paths.map((y, i) => ({ x: r.t, y, mode: 'lines', name: `Investor ${i + 1}`, showlegend: false, line: { width: 1 } }))
  return (
    <main>
      <h1>Compounding, Leverage and Utility</h1>
      <p className="lead">
        Explore how leverage changes compounded wealth and mean–variance utility for investors with
        different levels of risk aversion.
      </p>

      <section className="controls">
        <Field label={`Average return: ${p.mu}%`} value={p.mu} onChange={set('mu', 0, 10)} min={0} max={10} step={0.5} />
        <Field label={`Volatility: ${p.sigma}%`} value={p.sigma} onChange={set('sigma', 1, 20)} min={1} max={20} step={1} />
        <Field label={`Horizon: ${p.years} years`} value={p.years} onChange={set('years', 1, 20)} min={1} max={20} step={1} />
        <Field label={`Leverage: ${p.leverage}×`} value={p.leverage} onChange={set('leverage', 1, 10)} min={1} max={10} step={0.1} />
        <Field label={`Investors: ${p.n}`} value={p.n} onChange={set('n', 1, 5000)} min={1} max={5000} step={1} />
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

      <section className="stats">
        <div><b>{num(s.mean)}</b>Mean wealth</div>
        <div><b>{num(s.median)}</b>Median wealth</div>
        <div><b>{num(s.skewness)}</b>Skewness</div>
        {[1, 5, 8].map((a) => <div key={a}><b>{num(s.utilities[a])}</b>Mean–variance utility (A={a})</div>)}
      </section>

      <section className="charts">
        <Plot data={hist} layout={histLayout} />
        <Plot data={paths} layout={pathsLayout} />
      </section>
    </main>
  )
}
