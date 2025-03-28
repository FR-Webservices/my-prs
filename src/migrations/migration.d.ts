export type MigrationStep = {
  to: number
  migrate: () => Promise<void>
}

export type MigrationSteps = {
  [from: string]: MigrationStep
}
