export function histogramBins(values, binCount = 60) {
  if (values.length === 0) return { x: [], y: [], width: 1 }

  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) {
    return { x: [min], y: [values.length], width: Math.max(Math.abs(min) * 0.02, 1) }
  }

  const width = (max - min) / binCount
  const y = Array(binCount).fill(0)
  for (const value of values) {
    const index = Math.min(binCount - 1, Math.floor((value - min) / width))
    y[index]++
  }

  return { x: y.map((_, index) => min + (index + 0.5) * width), y, width }
}
