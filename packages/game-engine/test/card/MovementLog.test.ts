import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MovementLog } from '../../src/card/MovementLog';
import { TimeStamp } from '../../src/game-state/TimeStamp';

describe('MovementLog', () => {
  it('has no record of a card moving away from a location it never left', () => {
    expect(new MovementLog().hasCardMovedAwayFromAreaSince(CardLocation.HAND, new TimeStamp(0))).toBe(false);
  });

  it('reports a move away from a location only if it happened after the given time', () => {
    const movementLog = new MovementLog();

    movementLog.recordMovement(CardLocation.HAND, CardLocation.IN_PLAY, new TimeStamp(5));

    expect(movementLog.hasCardMovedAwayFromAreaSince(CardLocation.HAND, new TimeStamp(4))).toBe(true);
    expect(movementLog.hasCardMovedAwayFromAreaSince(CardLocation.HAND, new TimeStamp(5))).toBe(false);
    expect(movementLog.hasCardMovedAwayFromAreaSince(CardLocation.IN_PLAY, new TimeStamp(4))).toBe(false);
  });

  it('keeps the latest move away from each location', () => {
    const movementLog = new MovementLog();

    movementLog.recordMovement(CardLocation.DECK, CardLocation.HAND, new TimeStamp(1));
    movementLog.recordMovement(CardLocation.HAND, CardLocation.DECK, new TimeStamp(2));
    movementLog.recordMovement(CardLocation.DECK, CardLocation.DISCARD, new TimeStamp(3));

    expect(movementLog.hasCardMovedAwayFromAreaSince(CardLocation.DECK, new TimeStamp(2))).toBe(true);
  });
});
