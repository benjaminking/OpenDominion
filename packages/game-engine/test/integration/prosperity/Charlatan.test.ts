import { CardLocation, CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Charlatan', () => {
  it('gives +$3 and each other player gains a Curse in turn order, until the pile runs out (3 players)', async () => {
    const game = createGame({ kingdom: ['Charlatan'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Charlatan', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    expect(game.pileSize('Curse')).toBe(20);
    game.setPileSize('Curse', 1);

    await game.start();
    await game.playAction('Charlatan');

    expect(game.alice.coins).toBe(3);
    expect(game.bob.discard).toHaveLength(1);
    expect(game.player('Cara').discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(0);
  });

  it('makes the Curses players gain Treasures worth $1', async () => {
    const game = createGame({ kingdom: ['Charlatan'] });
    game.alice.setHand(['Charlatan', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Charlatan');

    const [gainedCurse] = game.bob.cards(CardLocation.DISCARD);
    expect(gainedCurse.getDisplayName()).toBe('Curse');
    expect(gainedCurse.hasType(CardType.CURSE)).toBe(true);
    expect(gainedCurse.hasType(CardType.TREASURE)).toBe(true);
    expect(gainedCurse.isSimpleTreasure()).toBe(true);
    expect(gainedCurse.getCoins()).toBe(1);
  });

  it('makes Curses Treasures that are played for $1 and trashed from play when you gain a Mint', async () => {
    const game = createGame({ kingdom: ['Charlatan', 'Mint'] });
    game.alice.setHand(['Charlatan Curse', 'Charlatan Curse', 'Silver', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const scoreBefore = game.alice.score;

    await game.start();
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(5);
    await game.buy('Mint');

    expect([...game.trash].sort()).toEqual(['Charlatan Curse', 'Charlatan Curse', 'Copper', 'Silver']);
    // Trashing the two Curses is +2 VP
    expect(game.alice.score).toBe(scoreBefore + 2);
  });

  it('makes Curses Treasures that Magnate counts in hand', async () => {
    const game = createGame({ kingdom: ['Charlatan', 'Magnate'] });
    game.alice.setHand(['Magnate', 'Charlatan Curse', 'Charlatan Curse', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', 'Estate', 'Estate', ...coppers(5)]);

    await game.start();
    await game.playAction('Magnate');

    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.deck).toEqual(['Estate', ...coppers(5)]);
  });

  it('makes the Curses given by other cards, such as Witch, Treasures too', async () => {
    const game = createGame({ kingdom: ['Charlatan', 'Witch'] });
    game.alice.setHand(['Witch', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Witch');

    const [gainedCurse] = game.bob.cards(CardLocation.DISCARD);
    expect(gainedCurse.getDisplayName()).toBe('Curse');
    expect(gainedCurse.hasType(CardType.TREASURE)).toBe(true);
    expect(game.pileSize('Curse')).toBe(9);
  });

  it('makes Curses Treasures that Rabble makes a player discard when revealed', async () => {
    const game = createGame({ kingdom: ['Charlatan', 'Rabble'] });
    game.alice.setHand(['Rabble', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setDeck(['Charlatan Curse', 'Estate', 'Charlatan Curse', 'Copper']);

    await game.start();
    await game.playAction('Rabble');

    expect(game.bob.discard).toEqual(['Charlatan Curse', 'Charlatan Curse']);
    expect(game.bob.deck).toEqual(['Estate', 'Copper']);
  });

  it('gives each of three other players a Curse in turn order until the pile runs out (4 players)', async () => {
    const game = createGame({ kingdom: ['Charlatan'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    game.alice.setHand(['Charlatan', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    expect(game.pileSize('Curse')).toBe(30);
    game.setPileSize('Curse', 2);

    await game.start();
    await game.playAction('Charlatan');

    expect(game.bob.discard).toEqual(['Charlatan Curse']);
    expect(game.player('Cara').discard).toEqual(['Charlatan Curse']);
    expect(game.player('Dan').discard).toEqual([]);
    expect(game.alice.discard).toEqual([]);
    expect(game.pileSize('Curse')).toBe(0);
  });

  it('makes Curses in the trash Treasures, which Forager counts', async () => {
    const game = createGame({ kingdom: ['Charlatan', 'Forager'] });
    game.alice.setHand(['Forager', 'Charlatan Curse', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Forager');
    await game.chooseCard('Curse');

    expect(game.trash).toEqual(['Charlatan Curse']);
    expect(game.alice.coins).toBe(1);
  });
});
