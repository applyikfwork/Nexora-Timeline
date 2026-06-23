import { db, adminSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const KEY_ENV_MAP: Record<string, string> = {
  gemini: "GEMINI_API_KEY",
  mapbox: "MAPBOX_ACCESS_TOKEN",
  openweather: "OPENWEATHER_API_KEY",
  serpapi: "SERPAPI_KEY",
};

const cache = new Map<string, { value: string | null; expiresAt: number }>();
const TTL = 5 * 60 * 1000;

export async function getApiKey(name: string): Promise<string | null> {
  const dbKey = `api_key_${name}`;
  const hit = cache.get(dbKey);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  try {
    const [row] = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, dbKey));
    if (row?.value) {
      cache.set(dbKey, { value: row.value, expiresAt: Date.now() + TTL });
      return row.value;
    }
  } catch (err) {
    logger.warn({ err }, `Failed to read api_key_${name} from DB`);
  }

  const envVar = KEY_ENV_MAP[name];
  const envVal = envVar ? (process.env[envVar] ?? null) : null;
  cache.set(dbKey, { value: envVal, expiresAt: Date.now() + TTL });
  return envVal;
}

export async function saveApiKey(name: string, value: string): Promise<void> {
  const dbKey = `api_key_${name}`;
  await db
    .insert(adminSettingsTable)
    .values({ key: dbKey, value, description: `API key for ${name}` })
    .onConflictDoUpdate({
      target: adminSettingsTable.key,
      set: { value, updatedAt: new Date() },
    });
  cache.delete(dbKey);
}

export function invalidateKey(name: string) {
  cache.delete(`api_key_${name}`);
}

export async function getKeyStatus(name: string): Promise<{ configured: boolean; source: "env" | "db" | null }> {
  const dbKey = `api_key_${name}`;
  try {
    const [row] = await db
      .select()
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, dbKey));
    if (row?.value) return { configured: true, source: "db" };
  } catch {}
  const envVar = KEY_ENV_MAP[name];
  if (envVar && process.env[envVar]) return { configured: true, source: "env" };
  return { configured: false, source: null };
}
