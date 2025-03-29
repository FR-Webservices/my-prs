import type { MigrationSteps } from '@/migrations/migration'

export const migrationSteps: MigrationSteps = {
  '0': {
    to: 1,
    migrate: to1,
  },
  // '1': {
  //   to: 2,
  //   migrate: to2,
  // },
}

// function to2(): Promise<void> {
//   try {
//     console.log('Run migration 2')
//     return Promise.resolve()
//   } catch (err) {
//     return Promise.reject(err)
//   }
// }

export function to1(): Promise<void> {
  console.log('Run migration 1')

  try {
    if (localStorage.getItem('refresh-interval') != null) {
      localStorage.removeItem('refresh-interval')
    }

    if (localStorage.getItem('refresh-interval-v2') != null) {
      localStorage.setItem('refresh-interval', localStorage.getItem('refresh-interval-v2')!)
      localStorage.removeItem('refresh-interval-v2')
    }

    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  }
}
