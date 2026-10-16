const axis = (text) => ({ title: { text }, automargin: true })

export function chartLayouts(yType) {
  return [
    {
      title: { text: 'Terminal wealth distribution' },
      xaxis: axis('Terminal wealth (start = 1)'),
      yaxis: axis('Number of investors'),
      bargap: 0.02,
    },
    {
      title: { text: 'Mean and median wealth' },
      xaxis: axis('Year'),
      yaxis: { ...axis('Wealth (start = 1)'), type: yType },
    },
    {
      title: { text: 'Selected individual wealth paths (20 investors)' },
      xaxis: axis('Year'),
      yaxis: { ...axis('Wealth (start = 1)'), type: yType },
    },
  ]
}
