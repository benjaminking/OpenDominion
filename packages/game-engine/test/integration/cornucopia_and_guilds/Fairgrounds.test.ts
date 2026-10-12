import { describe, expect, it } from 'vitest';

import { finalScore } from '../base_game/baseGameHelpers';
import { createGame } from '../gameHarness';

// Village and Copper start in hand; the rest are spread over the deck and discard pile
const OTHER_NAMES = ['Village', 'Copper', 'Silver', 'Gold', 'Smithy', 'Market', 'Festival', 'Laboratory', 'Cellar'];

describe('Fairgrounds', () => {
  it.each([
    { numNames: 4, expectedVP: 0 },
    { numNames: 5, expectedVP: 2 },
    { numNames: 9, expectedVP: 2 },
    { numNames: 10, expectedVP: 4 },
  ])(
    'with $numNames differently named cards across hand, play, deck and discard, is worth $expectedVP VP',
    async ({ numNames, expectedVP }) => {
      const game = createGame({ kingdom: ['Fairgrounds'] });
      const others = OTHER_NAMES.slice(0, numNames - 1);
      game.alice.setHand(['Village', 'Fairgrounds', 'Copper']);
      // A duplicate Copper doesn't count again
      game.alice.setDeck(['Copper', ...others.slice(2, 4)]);
      game.alice.setDiscard(others.slice(4));

      await game.start();
      await game.playAction('Village');
      expect(game.alice.inPlay).toEqual(['Village']);

      expect(game.alice.score).toBe(expectedVP);
    },
  );

  it('counts itself once even when there are two, and each Fairgrounds is worth the same', () => {
    const game = createGame({ kingdom: ['Fairgrounds'] });
    game.alice.setHand(['Fairgrounds', 'Fairgrounds', 'Copper', 'Silver', 'Gold']);

    expect(game.alice.score).toBe(0);
    game.alice.setDeck(['Cellar']);
    expect(game.alice.score).toBe(4);
  });

  it('counts differently named cards on the Island mat and set aside by Haven', async () => {
    const game = createGame({ kingdom: ['Fairgrounds', 'Island', 'Haven'] });
    game.alice.setHand(['Haven', 'Island', 'Gold', 'Silver', 'Fairgrounds']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    await game.playAction('Haven');
    await game.chooseCard('Silver');
    await game.playAction('Island');
    await game.chooseCard('Gold');

    expect(game.alice.inPlay).toEqual(['Haven']);
    expect(game.alice.hand).toEqual(['Fairgrounds', 'Copper']);
    // Haven, Island, Gold, Silver, Fairgrounds and Copper: 6 names, so 2 VP; Island is worth 2 VP
    expect(game.alice.score).toBe(2 + 2);
  });

  it('counts each differently named Ruins and Knight separately', () => {
    const game = createGame({ kingdom: ['Fairgrounds'] });
    game.alice.setHand(['Fairgrounds', 'Ruined Village', 'Survivors', 'Sir Martin', 'Dame Anna']);

    expect(game.alice.score).toBe(2);
  });

  it('has 8 cards in its pile with 2 players and 12 with 3 or more, like other Victory cards', () => {
    expect(createGame({ kingdom: ['Fairgrounds'] }).pileSize('Fairgrounds')).toBe(8);
    expect(createGame({ kingdom: ['Fairgrounds'], players: ['Alice', 'Bob', 'Cara'] }).pileSize('Fairgrounds')).toBe(
      12,
    );
  });

  it('counts differently named Shelters, and cards on the Native Village mat, at the end of the game', async () => {
    const game = createGame({ kingdom: ['Fairgrounds', 'Native Village'] });
    game.alice.setHand(['Native Village', 'Gold', 'Gold', 'Silver']);
    game.alice.setDeck(['Hovel', 'Fairgrounds', 'Necropolis', 'Copper', 'Copper', 'Copper']);
    game.alice.setDiscard(['Overgrown Estate']);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Native Village');
    await game.chooseOption('Put the top card of your deck face down on your Native Village mat');
    expect(game.alice.nativeVillageMat).toEqual(['Hovel']);
    await game.playAllTreasures();
    await game.buy('Province');

    // Native Village, Gold, Silver, Hovel, Fairgrounds, Necropolis, Copper, Overgrown Estate, Province: 9 names
    expect(game.isFinished).toBe(true);
    expect(finalScore(game, 'Alice')).toBe(2 + 6);
  });
});
