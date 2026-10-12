import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Cellar', () => {
  it('shuffles the cards it just discarded back in when the deck runs out while drawing', async () => {
    const game = createGame({ kingdom: ['Cellar'] });
    game.alice.setHand(['Cellar', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver']);

    await game.start();
    await game.playAction('Cellar');
    const decision = game.expectDecision('chooseCards', 'Alice');
    // Cellar is in play, so it can't discard itself
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual([
      'Copper',
      'Copper',
      'Estate',
      'Estate',
    ]);
    await game.chooseCards(['Estate', 'Estate']);

    // Draws the Silver, then shuffles the discarded Estates and draws one of them
    expect(game.alice.hand.sort()).toEqual(['Copper', 'Copper', 'Estate', 'Silver']);
    expect(game.alice.deck).toEqual(['Estate']);
    expect(game.alice.discard).toEqual([]);
  });

  it('draws nothing when it discards nothing, but still gives +1 Action', async () => {
    const game = createGame({ kingdom: ['Cellar'] });
    game.alice.setHand(['Cellar', 'Estate', 'Copper']);
    game.alice.setDeck(['Gold', 'Gold']);

    await game.start();
    await game.playAction('Cellar');
    await game.chooseCards([]);

    expect(game.alice.hand).toEqual(['Estate', 'Copper']);
    expect(game.alice.deck).toEqual(['Gold', 'Gold']);
    expect(game.alice.actions).toBe(1);
  });

  it('shuffles in a Gold gained by a discarded Tunnel when it reshuffles to draw', async () => {
    const game = createGame({ kingdom: ['Cellar', 'Tunnel'] });
    game.alice.setHand(['Cellar', 'Tunnel', 'Estate', 'Copper']);

    await game.start();
    await game.playAction('Cellar');
    await game.chooseCards(['Tunnel', 'Estate']);
    // Tunnel's reaction happens when it is discarded, before Cellar draws
    await game.chooseEffect('Tunnel');

    expect(game.alice.hand).toHaveLength(1 + 2);
    expect([...game.alice.hand, ...game.alice.deck].sort()).toEqual(['Copper', 'Estate', 'Gold', 'Tunnel']);
    expect(game.alice.discard).toEqual([]);
  });

  it('lets the player choose the order of several "when discarded" reactions before it draws', async () => {
    const game = createGame({ kingdom: ['Cellar', 'Tunnel', 'Weaver'] });
    game.alice.setHand(['Cellar', 'Tunnel', 'Weaver', 'Copper']);
    game.alice.setDeck(['Gold', 'Gold', 'Copper']);

    await game.start();
    await game.playAction('Cellar');
    await game.chooseCards(['Tunnel', 'Weaver']);
    const decision = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(decision.optionalEffects.map((effect) => effect.effectName).sort()).toEqual(['Tunnel', 'Weaver']);
    await game.chooseEffect('Weaver');
    await game.chooseOption('Gain two Silvers');
    await game.chooseEffect('Tunnel');

    expect(game.alice.inPlay).toEqual(['Cellar', 'Weaver']);
    expect(game.alice.discard.sort()).toEqual(['Gold', 'Silver', 'Silver', 'Tunnel']);
    // Two cards were discarded, so Cellar draws 2
    expect(game.alice.hand).toEqual(['Copper', 'Gold', 'Gold']);
  });

  it('is not an Attack: other players are not offered reactions such as Moat', async () => {
    const game = createGame({ kingdom: ['Cellar', 'Moat'] });
    game.alice.setHand(['Cellar', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Silver']);
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Cellar');

    // Straight to Alice's discard choice
    game.expectDecision('chooseCards', 'Alice');
    await game.chooseCards(['Estate']);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver']);
  });

  it('gives +1 Action and draws nothing when played from an otherwise empty hand', async () => {
    const game = createGame({ kingdom: ['Cellar'] });
    game.alice.setHand(['Cellar']);
    game.alice.setDeck(['Gold', 'Gold']);

    await game.start();
    await game.playAction('Cellar');
    // There is nothing to choose from (the engine may still ask for a choice of 0 cards)
    if (game.pending.kind === 'chooseCards') {
      expect(game.pending.cardChoices).toEqual([]);
      await game.chooseCards([]);
    }

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.deck).toEqual(['Gold', 'Gold']);
    expect(game.alice.actions).toBe(1);
  });
});
