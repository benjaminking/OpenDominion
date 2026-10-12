import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Chapel', () => {
  it('allows trashing 0 to 4 cards from hand, not including itself', async () => {
    const game = createGame({ kingdom: ['Chapel'] });
    game.alice.setHand(['Chapel', 'Estate', 'Estate', 'Estate', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Chapel');
    const decision = game.expectDecision('chooseCards', 'Alice');
    expect(decision.numSelectedEligibility).toEqual([0, 1, 2, 3, 4]);
    expect(decision.cardChoices.map((choice) => choice.card.name)).not.toContain('Chapel');
    await game.chooseCards(['Estate', 'Estate', 'Estate', 'Copper']);

    expect(game.trash.sort()).toEqual(['Copper', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.hand).toEqual(['Copper']);
  });

  it('may trash no cards', async () => {
    const game = createGame({ kingdom: ['Chapel'] });
    game.alice.setHand(['Chapel', 'Estate', 'Copper']);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards([]);

    expect(game.trash).toEqual([]);
    expect(game.alice.hand).toEqual(['Estate', 'Copper']);
  });

  it('trashes the whole hand when it has fewer than 4 cards', async () => {
    const game = createGame({ kingdom: ['Chapel'] });
    game.alice.setHand(['Chapel', 'Estate', 'Curse']);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Estate', 'Curse']);

    expect(game.trash.sort()).toEqual(['Curse', 'Estate']);
    expect(game.alice.hand).toEqual([]);
  });

  it('trashes nothing when played from an otherwise empty hand', async () => {
    const game = createGame({ kingdom: ['Chapel'] });
    game.alice.setHand(['Chapel']);

    await game.start();
    await game.playAction('Chapel');
    // There is nothing to choose from (the engine may still ask for a choice of 0 cards)
    if (game.pending.kind === 'chooseCards') {
      expect(game.pending.cardChoices).toEqual([]);
      await game.chooseCards([]);
    }

    expect(game.pending.kind).toBe('buyPhase');
    expect(game.trash).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Chapel']);
  });

  it('resolves the when-trashed abilities of the cards it trashes together, in the order chosen', async () => {
    const game = createGame({ kingdom: ['Chapel', 'Fortress', 'Rats'], useShelters: true });
    game.alice.setHand(['Chapel', 'Fortress', 'Rats', 'Overgrown Estate', 'Estate']);
    game.alice.setDeck(['Silver', 'Gold', 'Copper']);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Fortress', 'Rats', 'Overgrown Estate', 'Estate']);

    // Fortress: put it into your hand. Rats and Overgrown Estate: +1 Card
    const order = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(order.mandatoryEffects.map((effect) => effect.effectName).sort()).toEqual([
      'Fortress',
      'Overgrown Estate',
      'Rats',
    ]);
    await game.chooseEffect('Rats');
    expect(game.alice.hand).toEqual(['Silver']);
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect(game.pending.mandatoryEffects[0].effectName);
    }

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand.sort()).toEqual(['Fortress', 'Gold', 'Silver']);
    expect(game.trash.sort()).toEqual(['Estate', 'Overgrown Estate', 'Rats']);
    expect(game.alice.deck).toEqual(['Copper']);
  });
});
