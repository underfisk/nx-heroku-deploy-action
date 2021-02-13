interface ConfigValue {
  herokuAppName: string
  /** @default web **/
  formation?: 'web' | 'worker'
  branches: string[]
}

export interface IConfig {
  apps: Record<string, ConfigValue>
}
