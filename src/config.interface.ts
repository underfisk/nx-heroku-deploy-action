interface ConfigValue {
  herokuAppName: string | Record<string, string>
  /** @default web **/
  formation?: 'web' | 'worker'
  branches: string[]
}

export interface IConfig {
  apps: Record<string, ConfigValue>
}
