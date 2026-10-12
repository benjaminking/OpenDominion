import { describe, expect, it } from 'vitest';

import { Clock } from '../../src/game-state/Clock';

describe('Clock', () => {
  it('starts at one time and moves forward when advanced', () => {
    const clock = new Clock();
    const start = clock.createTimeStamp();

    expect(clock.createTimeStamp().isEqualTo(start)).toBe(true);
    clock.advanceTime();

    const later = clock.createTimeStamp();
    expect(later.isAfter(start)).toBe(true);
    expect(start.isBefore(later)).toBe(true);
    expect(later.isEqualTo(start)).toBe(false);
  });
});
