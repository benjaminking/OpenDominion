import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Bank', () => {
  it('counts the Treasures played before it and itself, but not ones played after it', async () => {
    const game = createGame({ kingdom: ['Bank'] });
    game.alice.setHand(['Copper', 'Silver', 'Bank', 'Gold', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Copper');
    await game.playTreasure('Silver');
    await game.playTreasure('Bank');
    expect(game.alice.coins).toBe(6);
    await game.playTreasure('Gold');

    expect(game.alice.coins).toBe(9);
  });

  it('counts Tiara and itself each time Tiara plays it', async () => {
    const game = createGame({ kingdom: ['Bank', 'Tiara'] });
    game.alice.setHand(['Tiara', 'Bank', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Bank');

    expect(game.alice.coins).toBe(4);
  });

  it('counts Crystal Ball and itself when Crystal Ball plays it from the deck', async () => {
    const game = createGame({ kingdom: ['Bank', 'Crystal Ball'] });
    game.alice.setHand(['Crystal Ball', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Bank', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');

    expect(game.alice.inPlay).toEqual(['Crystal Ball', 'Bank']);
    expect(game.alice.coins).toBe(3);
  });

  it('counts a Coronet played in the Action phase as a Treasure in play', async () => {
    const game = createGame({ kingdom: ['Bank', 'Village'] });
    game.alice.setHand(['Coronet', 'Village', 'Bank', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', 'Estate', ...coppers(10)]);

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard('Village');
    // Keep the Bank for later instead of playing it twice now
    await game.chooseNone();
    expect(game.alice.inPlay).toEqual(['Coronet', 'Village']);
    // Village's Actions are left, but there are no Action cards in hand, so Alice is in her Buy phase
    await game.playTreasure('Bank');

    // Coronet and Bank
    expect(game.alice.coins).toBe(2);
  });

  it('counts Charlatan Curses played as Treasures', async () => {
    const game = createGame({ kingdom: ['Bank', 'Charlatan'] });
    game.alice.setHand(['Charlatan Curse', 'Charlatan Curse', 'Bank', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(2);
    await game.playTreasure('Bank');

    expect(game.alice.coins).toBe(5);
  });

  it('counts a Duration Treasure still in play from your previous turn', async () => {
    const game = createGame({ kingdom: ['Bank', 'Astrolabe'] });
    game.alice.setHand(['Astrolabe', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Bank', 'Estate', 'Estate', 'Estate', 'Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Astrolabe');
    await game.endBuyPhase();
    await game.endTurn();
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Astrolabe');
    }
    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.inPlay).toEqual(['Astrolabe']);
    expect(game.alice.coins).toBe(1);
    await game.playTreasure('Bank');

    // Astrolabe and Bank
    expect(game.alice.coins).toBe(3);
  });

  it('counts a Potion in play, even though it made no $', async () => {
    const game = createGame({ kingdom: ['Bank', 'Golem'] });
    game.alice.setHand(['Potion', 'Copper', 'Bank', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(1);
    expect(game.alice.potions).toBe(1);
    await game.playTreasure('Bank');

    expect(game.alice.coins).toBe(4);
  });

  it('counts a Treasure-Victory Farm in play', async () => {
    const game = createGame({ kingdom: ['Bank', 'Farm'] });
    game.alice.setHand(['Farm', 'Bank', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Farm');
    await game.playTreasure('Bank');

    // Farm's $2, and $2 from Bank for Farm and itself
    expect(game.alice.coins).toBe(4);
  });

  it("doesn't count another player's Duration Treasure that is still in play", async () => {
    const game = createGame({ kingdom: ['Bank', 'Astrolabe'] });
    game.alice.setHand(['Astrolabe', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Bank', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Astrolabe');
    await game.endBuyPhase();
    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual(['Astrolabe']);
    await game.playTreasure('Bank');

    expect(game.bob.coins).toBe(1);
  });
});
