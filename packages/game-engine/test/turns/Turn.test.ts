import { describe, expect, it } from 'vitest';

import { Player } from '../../src/players/Player';
import { Turn } from '../../src/turns/Turn';

const createPlayer = (name: string): Player =>
  ({
    getName: () => name,
  }) as Player;

describe('Turn', () => {
  it('returns the configured owner and turn numbers', () => {
    const owner = createPlayer('Alice');
    const turn = new Turn(owner, 3, 4);

    expect(turn.getOwner()).toBe(owner);
    expect(turn.getNumber()).toBe(3);
    expect(turn.getUnofficialNumber()).toBe(4);
  });

  it('advances both numbers for the next turn', () => {
    const owner = createPlayer('Alice');
    const turn = new Turn(owner, 3, 4);
    const nextTurn = turn.nextTurn();

    expect(nextTurn.getOwner()).toBe(owner);
    expect(nextTurn.getNumber()).toBe(4);
    expect(nextTurn.getUnofficialNumber()).toBe(5);
  });

  it('advances only the unofficial number for the next unofficial turn', () => {
    const owner = createPlayer('Alice');
    const turn = new Turn(owner, 3, 4);
    const nextTurn = turn.nextUnofficialTurn();

    expect(nextTurn.getOwner()).toBe(owner);
    expect(nextTurn.getNumber()).toBe(3);
    expect(nextTurn.getUnofficialNumber()).toBe(5);
  });
});
