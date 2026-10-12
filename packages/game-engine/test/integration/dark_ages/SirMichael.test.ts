import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Sir Michael', () => {
  it('makes each other player discard down to 3 before revealing, in a 3-player game', async () => {
    const game = createGame({ kingdom: ['Knights'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Sir Michael', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Silver', 'Copper', ...COPPERS]);
    cara.setHand(['Estate', 'Copper', 'Copper']);
    cara.setDeck(['Copper', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Michael');

    const discard = game.expectDecision('chooseCards', 'Bob');
    expect(discard.numSelectedEligibility).toEqual([2]);
    await game.chooseCards(['Estate', 'Estate']);

    // Cara already has 3 cards, so she only loses her Gold
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Silver']);
    expect(game.bob.discard).toEqual(['Estate', 'Estate', 'Copper']);
    expect(cara.hand).toEqual(['Estate', 'Copper', 'Copper']);
    expect(cara.discard).toEqual(['Copper']);
    expect(game.trash).toEqual(['Silver', 'Gold']);
  });

  it('reveals the cards just discarded when the target has to shuffle', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Sir Michael', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Gold', 'Silver', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Sir Michael');
    await game.chooseCards(['Gold', 'Silver']);

    // Bob's deck and discard were empty, so the discarded Gold and Silver are shuffled and revealed
    const trash = game.expectDecision('chooseCard', 'Bob');
    expect(trash.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Gold', 'Silver']);
    await game.chooseCard('Silver');

    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.discard).toEqual(['Gold']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper']);
  });

  it('makes every other player discard down to 3 before any of them reveals, in a 3-player game', async () => {
    const game = createGame({ kingdom: ['Knights'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Sir Michael', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);
    cara.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    cara.setDeck(['Silver', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Michael');

    // First each other player discards, in turn order
    game.expectDecision('chooseCards', 'Bob');
    await game.chooseCards(['Estate', 'Estate']);
    game.expectDecision('chooseCards', 'Cara');
    await game.chooseCards(['Estate', 'Estate']);

    // Then each other player reveals and trashes, in turn order
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Gold');
    game.expectDecision('chooseCard', 'Cara');
    await game.chooseCard('Silver');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Gold', 'Silver']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper']);
    expect(cara.hand).toEqual(['Copper', 'Copper', 'Copper']);
    expect(game.bob.discard).toEqual(['Estate', 'Estate', 'Silver']);
    expect(cara.discard).toEqual(['Estate', 'Estate', 'Gold']);
  });

  it('is blocked by Moat for both the discard and the reveal, while other players are still attacked', async () => {
    const game = createGame({ kingdom: ['Knights', 'Moat'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Sir Michael', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Gold', ...COPPERS]);
    cara.setHand(['Estate', 'Estate', 'Copper', 'Copper', 'Copper']);
    cara.setDeck(['Silver', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Michael');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');

    game.expectDecision('chooseCards', 'Cara');
    await game.chooseCards(['Estate', 'Estate']);

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.hand).toEqual(['Moat', 'Estate', 'Estate', 'Copper', 'Copper']);
    expect(game.bob.deck.slice(0, 2)).toEqual(['Silver', 'Gold']);
    expect(game.trash).toEqual(['Silver']);
    expect(cara.discard).toEqual(['Estate', 'Estate', 'Copper']);
  });

  it('trashes itself when it trashes a Knight, and still attacks the remaining players', async () => {
    const game = createGame({ kingdom: ['Knights'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Sir Michael', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Dame Anna', 'Copper', ...COPPERS]);
    cara.setHand(['Copper', 'Copper', 'Copper']);
    cara.setDeck(['Gold', 'Copper', ...COPPERS]);

    await game.start();
    await game.playAction('Sir Michael');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Dame Anna', 'Sir Michael', 'Gold']);
    expect(game.alice.inPlay).toEqual([]);
    expect(game.bob.discard).toEqual(['Copper']);
    expect(cara.discard).toEqual(['Copper']);
  });

  it('resolves a Tunnel discarded to it (gaining a Gold) before the target reveals', async () => {
    const game = createGame({ kingdom: ['Knights', 'Tunnel'] });
    game.alice.setHand(['Sir Michael', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Tunnel', 'Estate', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(['Silver', 'Copper']);

    await game.start();
    await game.playAction('Sir Michael');
    await game.chooseCards(['Tunnel', 'Estate']);
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect(game.bob.deck).toEqual(['Silver', 'Copper']);
    await game.chooseEffect('Tunnel');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.hand).toEqual(['Copper', 'Copper', 'Copper']);
    expect([...game.bob.discard].sort()).toEqual(['Copper', 'Estate', 'Gold', 'Tunnel']);
    expect(game.bob.deck).toEqual([]);
  });
});
