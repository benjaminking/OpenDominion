import { ChoiceType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../src/card/Card';
import { Player } from '../src/players/Player';
import { ExtraTurn } from '../src/turns/ExtraTurn';
import { ExtraTurnPrecondition } from '../src/turns/ExtraTurnPreconditions';
import { Turn } from '../src/turns/Turn';

const createPlayer = (name: string): Player => {
  return {
    getName: vi.fn(() => name),
  } as unknown as Player;
};

const createCard = (id: string, name: string): Card => {
  return {
    getId: vi.fn(() => id),
    getName: vi.fn(() => name),
    getMetadata: vi.fn(() => ({ id, name })),
  } as unknown as Card;
};

describe('ExtraTurn', () => {
  it('should stop when any extra-turn precondition rejects the queued turn', () => {
    const owner = createPlayer('Alice');
    const previousTurns = [new Turn(owner, 1, 1), new Turn(createPlayer('Bob'), 2, 2)];
    const firstPrecondition = {
      shouldExtraTurnHappen: vi.fn(() => true),
    } as unknown as ExtraTurnPrecondition;
    const secondPrecondition = {
      shouldExtraTurnHappen: vi.fn(() => false),
    } as unknown as ExtraTurnPrecondition;
    const thirdPrecondition = {
      shouldExtraTurnHappen: vi.fn(() => true),
    } as unknown as ExtraTurnPrecondition;
    const extraTurn = new ExtraTurn(owner, createCard('outpost-1', 'Outpost'), [
      firstPrecondition,
      secondPrecondition,
      thirdPrecondition,
    ]);

    expect(extraTurn.canExtraTurnHappen(previousTurns)).toBe(false);
    expect(firstPrecondition.shouldExtraTurnHappen).toHaveBeenCalledWith(owner, previousTurns);
    expect(secondPrecondition.shouldExtraTurnHappen).toHaveBeenCalledWith(owner, previousTurns);
    expect(thirdPrecondition.shouldExtraTurnHappen).not.toHaveBeenCalled();
  });

  it('should serialize to an extra-turn choice and match only the initiating card id', () => {
    const owner = createPlayer('Alice');
    const extraTurn = new ExtraTurn(owner, createCard('outpost-1', 'Outpost'), []);

    expect(extraTurn.toExtraTurnChoice()).toEqual({
      type: ChoiceType.ExtraTurn,
      card: { id: 'outpost-1', name: 'Outpost' },
      name: 'Outpost',
    });
    expect(
      extraTurn.doesChoiceMatch({
        type: ChoiceType.ExtraTurn,
        card: { id: 'outpost-1' },
      } as never),
    ).toBe(true);
    expect(
      extraTurn.doesChoiceMatch({
        type: ChoiceType.ExtraTurn,
        card: { id: 'different-card' },
      } as never),
    ).toBe(false);
    expect(extraTurn.doesChoiceMatch({ type: ChoiceType.EndTurn } as never)).toBe(false);
  });
});
