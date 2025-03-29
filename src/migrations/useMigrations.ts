import { lastMigrationKey } from '@/localStorageKeys'
import { migrationSteps } from '@/migrations/steps'
import { useStorage } from '@vueuse/core'
import type { MigrationStep } from '@/migrations/migration'

const storedAppVersion = useStorage(lastMigrationKey, 0)

export const useMigrations = () => {
  const isMigrationAvailable = (): boolean =>
    migrationSteps[storedAppVersion.value.toString()] != null

  // Loop through migration steps starting from the current version
  const performDataMigration = async (): Promise<void> => {
    let migrationStep: MigrationStep

    while ((migrationStep = migrationSteps[storedAppVersion.value.toString()])) {
      try {
        await migrationStep.migrate()
        storedAppVersion.value = migrationStep.to
      } catch (err) {
        console.error('Error while migrating the data', err)
        return Promise.reject(err)
      }
    }

    return Promise.resolve()
  }

  return {
    isMigrationAvailable,
    performDataMigration,
  }
}
