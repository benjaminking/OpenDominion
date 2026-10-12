import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers } from './baseGameHelpers';

describe('Harbinger', () => {
  it('asks nothing when the discard pile is empty', async () => {
    const game = createGame({ kingdom: ['Harbinger'] });
    game.alice.setHand(['Harbinger', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Silver', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Harbinger');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.actions).toBe(1);
  });

  it('asks nothing when drawing its card shuffled the whole discard pile into the deck', async () => {
    const game = createGame({ kingdom: ['Harbinger'] });
    game.alice.setHand(['Harbinger', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Harbinger');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.discard).toEqual([]);
  });

  it('may decline to put a card from the discard pile on top of the deck', async () => {
    const game = createGame({ kingdom: ['Harbinger'] });
    game.alice.setHand(['Harbinger', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Copper', 'Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDiscard(['Gold', 'Curse']);

    await game.start();
    await game.playAction('Harbinger');
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.noneAllowed).toBe(true);
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Curse', 'Gold']);
    await game.chooseNone();

    expect(game.alice.discard).toEqual(['Gold', 'Curse']);
    expect(game.alice.deck[0]).toBe('Estate');
  });

  it('puts a card on the deck that a later card draws the same turn', async () => {
    const game = createGame({ kingdom: ['Harbinger', 'Laboratory'] });
    game.alice.setHand(['Harbinger', 'Laboratory', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', 'Estate', 'Estate', ...coppers(10)]);
    game.alice.setDiscard(['Gold', 'Curse']);

    await game.start();
    await game.playAction('Harbinger');
    await game.chooseCard('Gold');
    expect(game.alice.deck[0]).toBe('Gold');
    await game.playAction('Laboratory');

    expect(game.alice.hand.sort()).toEqual(['Copper', 'Copper', 'Copper', 'Estate', 'Estate', 'Gold']);
    expect(game.alice.discard).toEqual(['Curse']);
  });

  it('puts a card from the discard pile onto an empty deck, where Clean-up draws it', async () => {
    const game = createGame({ kingdom: ['Harbinger'] });
    game.alice.setHand(['Harbinger', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate']);
    game.alice.setDiscard(['Gold', 'Curse']);

    await game.start();
    await game.playAction('Harbinger');
    // The deck still had its Estate to draw, so no reshuffle: the Gold goes onto an empty deck
    expect(game.alice.deck).toEqual([]);
    await game.chooseCard('Gold');
    expect(game.alice.deck).toEqual(['Gold']);
    await game.endTurn();

    // Clean-up draws the Gold first, then reshuffles the discard pile for the rest
    expect(game.alice.hand).toContain('Gold');
    expect(game.alice.hand).toHaveLength(5);
  });
});
