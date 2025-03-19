type RefreshTiming = {
  key: string
  value: number
}

export const initialDefaultTiming: number = 1000 * 60 * 5

export const refreshTimings: RefreshTiming[] = [
  { key: 'No update', value: -1 },
  { key: '30s', value: 1000 * 30 },
  { key: '1m', value: 1000 * 60 },
  { key: '5m', value: 1000 * 60 * 5 },
  { key: '10m', value: 1000 * 60 * 10 },
]
