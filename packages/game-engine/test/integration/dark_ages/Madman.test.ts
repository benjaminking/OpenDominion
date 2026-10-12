import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Madman', () => {
  it('played twice by Throne Room: returns to its pile and draws only the first time', async () => {
    const game = createGame({ kingdom: ['Hermit', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Madman', 'Copper', 'Copper', 'Estate']);
    game.alice.setDeck(Array<string>(20).fill('Silver'));
    const madmen = game.pileSize('Madman');

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Madman');

    // +2 Actions twice; one card drawn per card in hand (3) only after the first, successful return
    expect(game.alice.actions).toBe(4);
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Estate', 'Silver', 'Silver', 'Silver']);
    expect(game.alice.inPlay).toEqual(['Throne Room']);
    expect(game.pileSize('Madman')).toBe(madmen + 1);
    // The second play can't return it: it has already left play
    expect(game.alice.log.filter((line) => line === 'Alice has lost track of Madman')).toHaveLength(1);
  });
});

describe('Madman: interactions', () => {
  it("played three times by King's Court: +6 Actions, but it returns and draws only the first time", async () => {
    const game = createGame({ kingdom: ['Hermit', "King's Court"] });
    game.alice.setHand(["King's Court", 'Madman', 'Copper', 'Estate']);
    game.alice.setDeck(Array<string>(20).fill('Silver'));
    const madmen = game.pileSize('Madman');

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Madman');

    expect(game.alice.actions).toBe(6);
    expect(game.alice.hand).toEqual(['Copper', 'Estate', 'Silver', 'Silver']);
    expect(game.alice.inPlay).toEqual(["King's Court"]);
    expect(game.pileSize('Madman')).toBe(madmen + 1);
    expect(game.alice.log.filter((line) => line === 'Alice has lost track of Madman')).toHaveLength(2);
  });

  it('with an empty hand, returns to its pile and draws nothing', async () => {
    const game = createGame({ kingdom: ['Hermit'] });
    game.alice.setHand(['Madman']);
    game.alice.setDeck(Array<string>(20).fill('Silver'));
    const madmen = game.pileSize('Madman');

    await game.start();
    await game.playAction('Madman');

    expect(game.alice.hand).toEqual([]);
    expect(game.alice.actions).toBe(2);
    expect(game.pileSize('Madman')).toBe(madmen + 1);
    expect(game.alice.inPlay).toEqual([]);
  });

  it('draws as many as it can when the deck and discard pile hold fewer cards than the hand, reshuffling mid-draw', async () => {
    const game = createGame({ kingdom: ['Hermit'] });
    game.alice.setHand(['Madman', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold']);
    game.alice.setDiscard(['Silver', 'Silver']);
    const madmen = game.pileSize('Madman');

    await game.start();
    await game.playAction('Madman');

    // 4 cards in hand, but only 3 left to draw
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Copper', 'Gold', 'Silver', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.pileSize('Madman')).toBe(madmen + 1);
  });
});
