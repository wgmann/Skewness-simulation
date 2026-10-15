import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-basic-dist-min'

export default function Plot({ data, layout }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    Plotly.react(
      el,
      data,
      { margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { orientation: 'h', y: -0.25 }, ...layout },
      { responsive: true, displaylogo: false },
    )
  }, [data, layout])
  useEffect(() => {
    const el = ref.current
    return () => Plotly.purge(el)
  }, [])
  return <div ref={ref} className="plot" />
}
