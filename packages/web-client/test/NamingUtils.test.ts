import { describe, expect, it } from 'vitest';

import { convertToFileName } from '../src/app/util/NamingUtils';

describe('convertToFileName', () => {
  it('lowercases names and replaces separators with underscores', () => {
    expect(convertToFileName('Royal Carriage')).toBe('royal_carriage');
    expect(convertToFileName('Fortress-2')).toBe('fortress_2');
  });

  it('removes apostrophes before normalizing the name', () => {
    expect(convertToFileName("Fool's Gold")).toBe('fools_gold');
  });
});
