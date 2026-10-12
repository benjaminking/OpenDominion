import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Overgrown Estate', () => {
  it('scores 0 VP', () => {
    const game = createGame();
    game.alice.setHand(['Overgrown Estate', 'Overgrown Estate', 'Estate', 'Copper', 'Copper']);

    expect(game.alice.score).toBe(1);
  });

  it("draws its owner a card right away when trashed by another player's Swindler", async () => {
    const game = createGame({ kingdom: ['Swindler', 'Poor House'] });
    game.alice.setHand(['Swindler', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Overgrown Estate', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Swindler');

    // Bob has already drawn when Alice chooses the $1 card he gains
    game.expectDecision('chooseCard', 'Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Copper', 'Gold']);
    await game.chooseCard('Poor House');

    expect(game.trash).toEqual(['Overgrown Estate']);
    expect(game.bob.discard).toEqual(['Poor House']);
  });

  it('draws a card before Rebuild gains a card for it', async () => {
    const game = createGame({ kingdom: ['Rebuild', 'Gardens'] });
    game.alice.setHand(['Rebuild', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Overgrown Estate', 'Silver', ...COPPERS]);
    game.bob.setDeck(COPPERS);

    await game.start();
    await game.playAction('Rebuild');
    await game.chooseCard('Province');

    // Overgrown Estate costs $1, so Rebuild gains a Victory card costing up to $4
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(game.alice.hand).toContain('Silver');
    expect(gain.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Estate', 'Gardens']);
    await game.chooseCard('Gardens');

    expect(game.trash).toEqual(['Overgrown Estate']);
    expect(game.alice.discard).toEqual(['Gardens']);
  });

  it('draws a card when Chapel trashes it along with a Rats, resolving both in the chosen order', async () => {
    const game = createGame({ kingdom: ['Chapel', 'Rats'] });
    game.alice.setHand(['Chapel', 'Overgrown Estate', 'Rats', 'Estate', 'Copper']);
    game.alice.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Overgrown Estate', 'Rats', 'Estate']);

    const order = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(order.mandatoryEffects.map((effect) => effect.effectName).sort()).toEqual(['Overgrown Estate', 'Rats']);
    await game.chooseEffect('Rats');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Overgrown Estate', 'Rats', 'Estate']);
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Gold']);
  });

  it('can be trashed by Dame Anna, drawing a card before the attack', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Anna', 'Overgrown Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...COPPERS]);
    game.bob.setDeck(['Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Dame Anna');
    await game.chooseCards(['Overgrown Estate']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Gold']);
    expect(game.trash).toEqual(['Overgrown Estate', 'Silver']);
  });
  it('shuffles the discard pile to draw when trashed with an empty deck, and draws nothing when both are empty', async () => {
    const game = createGame({ kingdom: ['Chapel'] });
    game.alice.setHand(['Chapel', 'Overgrown Estate', 'Overgrown Estate', 'Copper']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Chapel');
    await game.chooseCards(['Overgrown Estate', 'Overgrown Estate']);
    // Both when-trashed draws are mandatory; resolve them one after the other
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Overgrown Estate');
    }

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Overgrown Estate', 'Overgrown Estate']);
    expect(game.alice.hand).toEqual(['Copper', 'Gold']);
    expect(game.alice.discard).toEqual([]);
  });
});
