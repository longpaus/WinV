import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

export interface AppConfig {
  maxHistoryDays: number;
}

const DEFAULT_CONFIG: AppConfig = {
  maxHistoryDays: 30,
};

let cached: AppConfig | null = null;

function configPath(): string {
  return path.join(app.getPath('userData'), 'config.json');
}

export function getConfig(): AppConfig {
  if (cached) return cached;

  const file = configPath();
  let loaded: AppConfig;
  try {
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
      loaded = { ...DEFAULT_CONFIG, ...raw };
    } else {
      loaded = { ...DEFAULT_CONFIG };
      fs.writeFileSync(file, JSON.stringify(loaded, null, 2));
    }
  } catch (err) {
    console.error('Failed to load config, using defaults:', err);
    loaded = { ...DEFAULT_CONFIG };
  }

  cached = loaded;
  return loaded;
}
