# Skewness-simulation

Interactive educational app showing how leverage affects compounded wealth and mean–variance utility.
Built with React, Vite and Plotly.js; fully client-side.

## Model

Each investor's annual gross return is lognormal: `R = exp(m + s·Z)`, `Z ~ N(0,1)`, independent across
investors and years. The inputs are the **expected arithmetic return** μ (`E[R] = 1 + μ`), **volatility** σ (standard
deviation of `R`), and leverage L. Leverage scales both μ and σ before the annual return is simulated.
Mean–variance utility is calculated from terminal wealth as `mean(wealth) − A·variance(wealth)/2`,
for risk-aversion values A = 1, 5, and 8. The log-return parameters are derived as
`s² = ln(1 + σ²/(1+μ)²)` and `m = ln(1+μ) − s²/2`; `m` is the *mean log return*, lower than `ln(1+μ)`
(volatility drag). Wealth evolves multiplicatively from 1.

## Local development

```bash
npm install
npm run dev      # start dev server
npm test         # run unit tests for the simulation
npm run build    # production build into dist/
```

## GitHub Pages deployment

`vite.config.js` sets `base: '/Skewness-simulation/'`, matching the project-repository URL
(`https://<user>.github.io/Skewness-simulation/`). If you rename the repository, update `base`.
The workflow `.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`.
Enable it once under **Settings → Pages → Build and deployment → Source: GitHub Actions**.
