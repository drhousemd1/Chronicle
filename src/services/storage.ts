
import { ScenarioData } from '../types';
import { STORAGE_KEY, createDefaultScenarioData, normalizeScenarioData, safeJsonParse } from '../utils';

export function now(): number {
  return Date.now();
}

// Generate a proper UUID v4 for Supabase compatibility
export function uuid(): string {
  return crypto.randomUUID();
}

// Legacy function for local-only IDs (not stored in Supabase UUID columns)
export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function seedData(): ScenarioData {
  return createDefaultScenarioData();
}

export function loadAppData(): ScenarioData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedData();
  const parsed = safeJsonParse(raw);
  if (!parsed.ok) return seedData();
  return normalizeScenarioData(parsed.value);
}

export function saveAppData(data: ScenarioData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
