import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Apothecary', () => {
  it('shuffles the discard pile to reveal 4 cards, keeps the Coppers and Potions and puts the rest back in the chosen order', async () => {
    const game = createGame({ kingdom: ['Apothecary'] });
    game.alice.setHand(['Apothecary', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Duchy', 'Copper']);
    game.alice.setDiscard(['Potion', 'Silver', 'Gold']);

    await game.start();
    await game.playAction('Apothecary');

    // The Silver and Gold go back in any order: each chosen card goes on top of the previous one
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Gold', 'Silver']);
    await game.chooseCard('Silver');

    expect(game.alice.hand.sort()).toEqual(['Copper', 'Duchy', 'Estate', 'Estate', 'Estate', 'Estate', 'Potion']);
    expect(game.alice.deck).toEqual(['Gold', 'Silver']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });

  it('takes every revealed Copper and Potion, leaving nothing to put back', async () => {
    const game = createGame({ kingdom: ['Apothecary'] });
    game.alice.setHand(['Apothecary', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Duchy', 'Copper', 'Potion', 'Copper', 'Potion', 'Gold']);

    await game.start();
    await game.playAction('Apothecary');

    expect(game.alice.hand).toEqual([
      'Estate',
      'Estate',
      'Estate',
      'Estate',
      'Duchy',
      'Copper',
      'Potion',
      'Copper',
      'Potion',
    ]);
    expect(game.alice.deck).toEqual(['Gold']);
    expect(game.pending.playerName).toBe('Alice');
  });

  it('leaves a revealed Coronet and Silver on the deck: only Coppers and Potions go to hand', async () => {
    const game = createGame({ kingdom: ['Apothecary'] });
    game.alice.setHand(['Apothecary', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Duchy', 'Coronet', 'Potion', 'Silver', 'Copper', 'Gold']);

    await game.start();
    await game.playAction('Apothecary');
    await game.chooseCard('Silver');

    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Duchy', 'Potion', 'Copper']);
    // Silver was put back first, so the Coronet is on top
    expect(game.alice.deck).toEqual(['Coronet', 'Silver', 'Gold']);
  });

  it('reveals the cards its first play put back when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Apothecary', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Apothecary', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Duchy', 'Silver', 'Copper', 'Gold', 'Potion', 'Copper', 'Province']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Apothecary');
    // First play: draws the Duchy, takes the Copper and Potion, puts Silver and Gold back (Gold on top)
    await game.chooseCard('Silver');
    // Second play: draws the Gold, reveals Silver, Copper, Province: takes the Copper
    await game.chooseCard('Silver');

    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Duchy', 'Copper', 'Potion', 'Gold', 'Copper']);
    expect(game.alice.deck).toEqual(['Province', 'Silver']);
    expect(game.alice.actions).toBe(2);
  });

  it('draws the only card left and reveals nothing when the deck and discard pile are then empty', async () => {
    const game = createGame({ kingdom: ['Apothecary', 'Village'] });
    game.alice.setHand(['Apothecary', 'Village', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Copper']);

    await game.start();
    await game.playAction('Apothecary');

    // Nothing to reveal and nothing to put back: no prompt, and the +1 Action is there for the Village
    expect(game.alice.hand).toEqual(['Village', 'Estate', 'Estate', 'Estate', 'Copper']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.actions).toBe(1);
    game.expectDecision('actionPhase', 'Alice');
  });

  it('still gives +1 Action with no cards in the deck or discard pile', async () => {
    const game = createGame({ kingdom: ['Apothecary', 'Village'] });
    game.alice.setHand(['Apothecary', 'Village', 'Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAction('Apothecary');

    expect(game.alice.hand).toEqual(['Village', 'Estate', 'Estate', 'Estate']);
    expect(game.alice.actions).toBe(1);
    game.expectDecision('actionPhase', 'Alice');
  });

  it('reveals only the 2 cards a reshuffle finds when the deck and discard pile hold fewer than 5 cards', async () => {
    const game = createGame({ kingdom: ['Apothecary'] });
    game.alice.setHand(['Apothecary', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Duchy']);
    game.alice.setDiscard(['Silver', 'Copper']);

    await game.start();
    await game.playAction('Apothecary');

    // +1 Card takes the Duchy; the discard pile is shuffled to reveal the Silver and Copper; the Silver goes back
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Duchy', 'Copper']);
    expect(game.alice.deck).toEqual(['Silver']);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.log.filter((line) => line === 'Alice shuffles.')).toHaveLength(1);
  });

  it("takes only Coppers and Potions: Farm, Fool's Gold and Philosopher's Stone are put back, after the Copper is in hand", async () => {
    const game = createGame({ kingdom: ['Apothecary', 'Farm', "Fool's Gold", "Philosopher's Stone"] });
    game.alice.setHand(['Apothecary', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', 'Farm', "Fool's Gold", 'Copper', "Philosopher's Stone", 'Gold']);

    await game.start();
    await game.playAction('Apothecary');

    // The Copper is already in hand when the other three are put back
    const decision = game.expectDecision('chooseCard', 'Alice');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual([
      'Farm',
      "Fool's Gold",
      "Philosopher's Stone",
    ]);
    expect(decision.noneAllowed).toBe(false);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Estate', 'Copper']);
    await game.chooseCard('Farm');
    await game.chooseCard("Fool's Gold");

    // Each card goes on top of the previous one; the last one goes on top by itself
    expect(game.alice.deck).toEqual(["Philosopher's Stone", "Fool's Gold", 'Farm', 'Gold']);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Estate', 'Copper']);
  });
});
