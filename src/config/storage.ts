/**
 * Configuration Storage
 */

import Conf from 'conf';
import { z } from 'zod';

const ConfigSchema = z.object({
  provider: z.enum(['gemini', 'claude', 'gpt', 'ollama']).default('gemini'),
  apiKey: z.string().optional(),
  theme: z.enum(['dark', 'light', 'auto']).default('dark'),
  maxRounds: z.number().min(1).max(10).default(3),
  streaming: z.boolean().default(true),
  debug: z.boolean().default(false),
  animations: z.boolean().default(true),
  quirks: z.boolean().default(true),
  autoSave: z.boolean().default(true),
  personas: z.array(z.string()).default([]),
});

export type Config = z.infer<typeof ConfigSchema>;

class ConfigStorage {
  private conf: Conf<Config>;

  constructor() {
    this.conf = new Conf<Config>({
      projectName: 'polymind',
      defaults: ConfigSchema.parse({}),
    });
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.conf.get(key);
  }

  set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.conf.set(key, value);
  }

  getAll(): Config {
    return this.conf.store as Config;
  }

  setAll(config: Partial<Config>): void {
    Object.entries(config).forEach(([key, value]) => {
      this.conf.set(key as keyof Config, value);
    });
  }

  reset(): void {
    this.conf.clear();
  }

  has(key: keyof Config): boolean {
    return this.conf.has(key);
  }

  getPath(): string {
    return this.conf.path;
  }
}

export const config = new ConfigStorage();
