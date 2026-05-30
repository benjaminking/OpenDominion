const STORAGE_KEY = 'dominion.tableSetup';

export interface SavedTableSetup {
  name: string;
  maxPlayers: number;
  /** Seat indexes (>0) that should be filled by bots. */
  botSeatIndexes: number[];
}

export function saveTableSetup(setup: SavedTableSetup): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setup));
  } catch {
    // Ignore storage errors (e.g. private-browsing quota).
  }
}

export function loadTableSetup(): SavedTableSetup | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedTableSetup;
    // Basic sanity check.
    if (typeof parsed.name !== 'string' || typeof parsed.maxPlayers !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}
