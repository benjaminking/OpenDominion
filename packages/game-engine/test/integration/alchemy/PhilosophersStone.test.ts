import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const copies = (name: string, count: number): string[] => Array<string>(count).fill(name);

describe("Philosopher's Stone", () => {
  it('counts only the deck and discard pile, not cards in hand or in play', async () => {
    const game = createGame({ kingdom: ["Philosopher's Stone", 'Village'] });
    game.alice.setHand(['Village', "Philosopher's Stone", 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(copies('Estate', 11));
    game.alice.setDiscard(copies('Estate', 5));

    await game.start();
    // Village draws 1: 10 in the deck + 5 in the discard pile = 15
    await game.playAction('Village');
    await game.playTreasure("Philosopher's Stone");
    expect(game.alice.coins).toBe(3);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(6);
  });

  it('rounds down: 14 cards give $2', async () => {
    const game = createGame({ kingdom: ["Philosopher's Stone"] });
    game.alice.setHand(["Philosopher's Stone", 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(copies('Estate', 9));
    game.alice.setDiscard(copies('Copper', 5));

    await game.start();
    await game.playTreasure("Philosopher's Stone");

    expect(game.alice.coins).toBe(2);
  });

  it('gives nothing with an empty deck and discard pile', async () => {
    const game = createGame({ kingdom: ["Philosopher's Stone"] });
    game.alice.setHand(["Philosopher's Stone", 'Copper', 'Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playTreasure("Philosopher's Stone");

    expect(game.alice.coins).toBe(0);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(1);
  });

  it('counts again for each play when Tiara plays it twice', async () => {
    const game = createGame({ kingdom: ["Philosopher's Stone", 'Tiara'] });
    game.alice.setHand(['Tiara', "Philosopher's Stone", 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));
    game.alice.setDiscard(copies('Copper', 5));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard("Philosopher's Stone");

    // 15 cards: $3, twice
    expect(game.alice.coins).toBe(6);
    expect(game.alice.inPlay).toEqual(['Tiara', "Philosopher's Stone"]);
  });

  it('counts for both plays when Counterfeit plays it twice, and is then trashed', async () => {
    const game = createGame({ kingdom: ["Philosopher's Stone", 'Counterfeit'] });
    game.alice.setHand(['Counterfeit', "Philosopher's Stone", 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(copies('Estate', 10));
    game.alice.setDiscard(copies('Copper', 5));

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard("Philosopher's Stone");

    // Counterfeit's $1, plus $3 twice
    expect(game.alice.coins).toBe(7);
    expect(game.trash).toEqual(["Philosopher's Stone"]);
    expect(game.alice.inPlay).toEqual(['Counterfeit']);
  });

  it('counts the deck after a draw shuffled the discard pile into it', async () => {
    const game = createGame({ kingdom: ["Philosopher's Stone", 'Village'] });
    game.alice.setHand(['Village', "Philosopher's Stone", 'Estate', 'Estate', 'Estate']);
    game.alice.setDiscard(copies('Copper', 11));

    await game.start();
    await game.playAction('Village');
    expect(game.alice.deck).toHaveLength(10);
    expect(game.alice.discard).toEqual([]);
    await game.playTreasure("Philosopher's Stone");

    expect(game.alice.coins).toBe(2);
  });

  it('counts again when Crystal Ball plays a second one from the deck, one card fewer; the first keeps its $', async () => {
    const game = createGame({ kingdom: ["Philosopher's Stone", 'Crystal Ball'] });
    game.alice.setHand(["Philosopher's Stone", 'Crystal Ball', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(["Philosopher's Stone", ...copies('Estate', 14)]);
    game.alice.setDiscard(copies('Estate', 5));

    await game.start();
    // 15 in the deck + 5 in the discard pile: $4
    await game.playTreasure("Philosopher's Stone");
    expect(game.alice.coins).toBe(4);
    await game.playTreasure('Crystal Ball');
    expect(game.alice.coins).toBe(5);
    await game.chooseOption('Play it');

    // The second one left the deck to be played: 19 cards, $3; the first one's $4 doesn't change
    expect(game.alice.coins).toBe(8);
    expect(game.alice.inPlay).toEqual(["Philosopher's Stone", 'Crystal Ball', "Philosopher's Stone"]);
  });
});
