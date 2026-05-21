import { describe, expect, it } from 'vitest';

import { Player } from '../../src/players/Player';
import { NoThirdConsecutiveTurnPrecondition } from '../../src/turns/ExtraTurnPreconditions';
import { Turn } from '../../src/turns/Turn';

const createPlayer = (name: string): Player =>
  ({
    getName: () => name,
  }) as Player;

describe('NoThirdConsecutiveTurnPrecondition', () => {
  it('allows an extra turn when there are fewer than two previous turns', () => {
    const alice = createPlayer('Alice');
    const precondition = new NoThirdConsecutiveTurnPrecondition();

    expect(precondition.shouldExtraTurnHappen(alice, [])).toBe(true);
    expect(precondition.shouldExtraTurnHappen(alice, [new Turn(alice, 1, 1)])).toBe(true);
  });

  it('allows an extra turn when the last two turns were not both taken by the same player', () => {
    const alice = createPlayer('Alice');
    const bob = createPlayer('Bob');
    const precondition = new NoThirdConsecutiveTurnPrecondition();

    expect(precondition.shouldExtraTurnHappen(alice, [new Turn(alice, 1, 1), new Turn(bob, 2, 2)])).toBe(true);
    expect(precondition.shouldExtraTurnHappen(alice, [new Turn(bob, 1, 1), new Turn(alice, 2, 2)])).toBe(true);
  });

  it('blocks an extra turn when the same player already took the last two turns', () => {
    const alice = createPlayer('Alice');
    const precondition = new NoThirdConsecutiveTurnPrecondition();

    expect(precondition.shouldExtraTurnHappen(alice, [new Turn(alice, 1, 1), new Turn(alice, 2, 2)])).toBe(false);
  });
});
