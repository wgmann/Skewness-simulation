import { useMemo, useState } from 'react'
import Plot from './Plot'
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
    years: clamp(Math.round(Number(p.years) || 1), 1, 100),
    n: clamp(Math.round(Number(p.n) || 100), 100, 10000),
    seed: Math.round(Number(p.seed) || 0),
  }), [p])

  const r = useMemo(() => simulate(params), [params])
  const s = r.summary
  const yType = logY ? 'log' : 'linear'
  const yTitle = 'Wealth (start = 1)'

  const hist = useMemo(() => [{
    type: 'histogram', x: Array.from(r.terminal), marker: { color: '#3b82f6' }, nbinsx: 60,
    name: 'Investors',
  }], [r])
  const histLayout = { title: 'Terminal wealth distribution', xaxis: { title: yTitle }, yaxis: { title: 'Investors' }, bargap: 0.02 }

  const meanMedian = [
    { x: r.t, y: r.meanW, name: 'Mean', mode: 'lines', line: { color: '#ef4444' } },
    { x: r.t, y: r.medianW, name: 'Median', mode: 'lines', line: { color: '#2563eb' } },
  ]
  const paths = r.paths.map((y, i) => ({ x: r.t, y, mode: 'lines', name: `Investor ${i + 1}`, showlegend: false, line: { width: 1 } }))
  const shares = [
    { x: r.t, y: r.top1, name: 'Top 1%' },
    { x: r.t, y: r.top10, name: 'Top 10%' },
    { x: r.t, y: r.top20, name: 'Top 20%' },
  ].map((d) => ({ ...d, mode: 'lines' }))

  return (
    <main>
      <h1>Compounding, Skewness and Inequality</h1>
      <p className="lead">
        Every investor starts with the same wealth and faces the same return distribution, yet
        independent luck, compounded over time, produces a highly unequal, right-skewed outcome.
      </p>

      <section className="controls">
        <Field label={`Expected arithmetic return: ${p.mu}%`} value={p.mu} onChange={set('mu', -20, 30)} min={-20} max={30} step={0.5} />
        <Field label={`Volatility: ${p.sigma}%`} value={p.sigma} onChange={set('sigma', 0, 100)} min={0} max={100} step={1} />
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
        that E[R] = 1 + {pct(params.mu)} and the standard deviation of R is {pct(params.sigma)}. This implies
        a log-return volatility s = {pct(s.s)} and a <em>mean log return</em> m = {pct(s.m)}, which is lower
        than the expected arithmetic return (ln(1+μ) = {pct(Math.log(1 + params.mu))}) by about s²/2. The
        median investor compounds at m, the mean at μ.
      </section>

      <section className="stats">
        <div><b>{num(s.mean)}</b>Mean wealth</div>
        <div><b>{num(s.median)}</b>Median wealth</div>
        <div><b>{num(s.skewness)}</b>Skewness</div>
        <div><b>{pct(s.top1)}</b>Top 1% share</div>
        <div><b>{pct(s.top10)}</b>Top 10% share</div>
        <div><b>{pct(s.top20)}</b>Top 20% share</div>
      </section>

      <section className="charts">
        <Plot data={hist} layout={histLayout} />
        <Plot data={meanMedian} layout={{ title: 'Mean and median wealth', xaxis: { title: 'Year' }, yaxis: { title: yTitle, type: yType } }} />
        <Plot data={paths} layout={{ title: 'Selected individual wealth paths (20 investors)', xaxis: { title: 'Year' }, yaxis: { title: yTitle, type: yType } }} />
        <Plot data={shares} layout={{ title: 'Share of total wealth held by the top groups', xaxis: { title: 'Year' }, yaxis: { title: 'Share of wealth', tickformat: '.0%', range: [0, 1] } }} />
      </section>

      <section className="explain">
        <h2>Why does compounding create skewness?</h2>
        <p>Wealth is a product of random growth factors. Its logarithm is a sum of independent shocks, hence
          approximately normal; wealth itself is the exponential of that, i.e. lognormal. Gains multiply on
          gains, so a lucky streak creates enormous wealth while bad luck can only reduce wealth towards zero.
          The longer the horizon and the higher the volatility, the longer the right tail.</p>
        <h2>Why do the mean and median diverge?</h2>
        <p>The mean of wealth grows at the expected arithmetic return, but a typical investor grows at the
          (lower) mean log return. A small number of extreme winners pull the mean up while the median stays
          close to what a typical investor experiences, so the gap widens over time and wealth concentrates
          in the top percentiles, even though everyone began equal.</p>
      </section>
    </main>
  )
}
