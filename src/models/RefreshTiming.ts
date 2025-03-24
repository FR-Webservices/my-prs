type RefreshTiming = {
  key: string
  value: string
}

export const initialDefaultTiming: string = '*/5 * * * *'
export const noUpdateTiming: string = '-1'

export const refreshTimings: RefreshTiming[] = [
  { key: 'No update', value: noUpdateTiming },
  { key: '1m', value: '* * * * *' },
  { key: '5m', value: initialDefaultTiming },
  { key: '10m', value: '*/10 * * * *' },
]
