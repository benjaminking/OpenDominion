import { describe, expect, it } from 'vitest';

import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Blockade } from '../../../src/cards/seaside/Blockade';
import { EndOfPlayersNextTurnEffectExpiration } from '../../../src/effects/StandardEffectExpirations';
import { createCardHarness } from '../testHarness';

describe('Blockade', () => {
  it('gains a card costing up to $4 and registers duration and attack effects', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-supply-0');
    testHarness.addSupplyPile(estate);
    testHarness.pickCard(estate);

    await new Blockade(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.effects.addEffect).toHaveBeenCalled();
    expect(testHarness.effects.addEffect.mock.calls[0][0].getExpiration()).toBeInstanceOf(
      EndOfPlayersNextTurnEffectExpiration,
    );
  });

  it('attack callback registers a curse-gain effect on the target player', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-supply-0');
    testHarness.addSupplyPile(estate);
    testHarness.pickCard(estate);

    // Override performAttack so the inline attack callback is actually invoked.
    // sharedGameState.performAttack is called as (attackingPlayer, card, sharedInstruction).
    const performAttackMock = testHarness.sharedGameState.performAttack as unknown as {
      mockImplementationOnce: (
        implementation: (
          _attackingPlayer: unknown,
          _card: unknown,
          fn: (a: unknown, b: unknown) => Promise<void>,
        ) => Promise<void>,
      ) => unknown;
    };
    performAttackMock.mockImplementationOnce(
      async (_attackingPlayer: unknown, _card: unknown, fn: (a: unknown, b: unknown) => Promise<void>) => {
        await fn(targetHarness.player, testHarness.player);
      },
    );

    await new Blockade(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.effects.addEffect).toHaveBeenCalledTimes(1);
  });
});
