import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

describe('Menagerie', () => {
  it('draws 3, shuffling if needed, when the hand has no duplicates', async () => {
    const game = createGame({ kingdom: ['Menagerie'] });
    game.alice.setHand(['Menagerie', 'Copper', 'Silver']);
    game.alice.setDeck(['Estate']);
    game.alice.setDiscard(['Gold', 'Duchy']);

    await game.start();
    await game.playAction('Menagerie');

    expect([...game.alice.hand].sort()).toEqual(['Copper', 'Duchy', 'Estate', 'Gold', 'Silver']);
    expect(game.alice.actions).toBe(1);
  });

  it('draws only 1 when the hand has duplicates, even when that needs a shuffle', async () => {
    const game = createGame({ kingdom: ['Menagerie'] });
    game.alice.setHand(['Menagerie', 'Copper', 'Copper', 'Silver']);
    game.alice.setDiscard(['Gold', 'Duchy']);

    await game.start();
    await game.playAction('Menagerie');

    expect(game.alice.hand).toHaveLength(4);
    expect(game.alice.deck).toHaveLength(1);
  });

  it('played twice by Coronet, checks the hand again for the second play', async () => {
    const game = createGame({ kingdom: ['Menagerie'] });
    game.alice.setHand(['Coronet', 'Menagerie', 'Copper', 'Silver', 'Estate']);
    game.alice.setDeck(['Gold', 'Duchy', 'Copper', 'Province', 'Curse', ...Array<string>(5).fill('Estate')]);

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard('Menagerie');
    // Decline Coronet's Treasure play
    await game.chooseNone();

    // First play: Copper, Silver, Estate are all different, +3 Cards (one is a second Copper). Second play: +1 Card.
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Estate', 'Gold', 'Duchy', 'Copper', 'Province']);
    expect(game.alice.actions).toBe(2);
  });

  it('treats differently named Ruins, Knights and Shelters as different cards, so draws 3', async () => {
    const game = createGame({ kingdom: ['Menagerie'] });
    game.alice.setHand([
      'Menagerie',
      'Ruined Library',
      'Ruined Market',
      'Sir Martin',
      'Dame Anna',
      'Hovel',
      'Necropolis',
    ]);
    game.alice.setDeck(['Copper', 'Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Menagerie');

    expect(game.alice.hand).toHaveLength(6 + 3);
    expect(game.alice.deck).toEqual(['Copper']);
  });

  it('draws only 1 with two Ruins of the same name', async () => {
    const game = createGame({ kingdom: ['Menagerie'] });
    game.alice.setHand(['Menagerie', 'Survivors', 'Survivors', 'Ruined Village']);
    game.alice.setDeck(['Copper', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Menagerie');

    expect(game.alice.hand).toHaveLength(3 + 1);
    expect(game.alice.deck).toEqual(['Copper', 'Copper']);
  });

  it('with a single card in hand, draws 3, but only as many as the deck and discard pile hold', async () => {
    const game = createGame({ kingdom: ['Menagerie'] });
    game.alice.setHand(['Menagerie', 'Estate']);
    game.alice.setDeck(['Silver']);
    game.alice.setDiscard(['Gold']);

    await game.start();
    await game.playAction('Menagerie');

    expect([...game.alice.hand].sort()).toEqual(['Estate', 'Gold', 'Silver']);
    expect(game.alice.deck).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(1);
  });
});
