import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

describe('Forager', () => {
  it('played twice by Throne Room: each play counts the Treasures in the trash at that time', async () => {
    const game = createGame({ kingdom: ['Forager', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Forager', 'Copper', 'Silver', 'Estate']);
    game.alice.setDeck(COPPERS);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Forager');
    await game.chooseCard('Copper');
    expect(game.alice.coins).toBe(1);
    await game.chooseCard('Silver');

    // $1 (Copper) + $2 (Copper and Silver)
    expect(game.alice.coins).toBe(3);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.actions).toBe(2);
    expect(game.trash).toEqual(['Copper', 'Silver']);
  });

  it('trashing a Spoils from hand leaves it in the trash, where it counts as a Treasure', async () => {
    const game = createGame({ kingdom: ['Forager', 'Marauder'] });
    game.alice.setHand(['Forager', 'Spoils', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    const spoils = game.pileSize('Spoils');

    await game.start();
    await game.playAction('Forager');
    await game.chooseCard('Spoils');

    expect(game.trash).toEqual(['Spoils']);
    expect(game.pileSize('Spoils')).toBe(spoils);
    expect(game.alice.coins).toBe(1);
  });

  it('trashing a card lets Market Square be discarded for a Gold, which does not add to the count', async () => {
    const game = createGame({ kingdom: ['Forager', 'Market Square'] });
    game.alice.setHand(['Forager', 'Market Square', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.setTrash(['Silver']);

    await game.start();
    await game.playAction('Forager');
    await game.chooseCard('Copper');
    await game.chooseEffect('Market Square');

    expect(game.alice.discard).toEqual(['Market Square', 'Gold']);
    // Copper and Silver are in the trash
    expect(game.alice.coins).toBe(2);
  });

  it("counts multi-type Treasures in the trash (Farm, Coronet, Potion, Fool's Gold) but not Action-Victory or other cards", async () => {
    const game = createGame({ kingdom: ['Forager', 'Farm', 'Mill', "Fool's Gold", 'Familiar'] });
    game.alice.setHand(['Forager', "Fool's Gold", 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.setTrash(['Copper', 'Copper', 'Farm', 'Coronet', 'Potion', 'Mill', 'Estate', 'Curse']);

    await game.start();
    await game.playAction('Forager');
    await game.chooseCard("Fool's Gold");

    // Copper, Farm, Coronet, Potion and Fool's Gold
    expect(game.alice.coins).toBe(5);
  });

  it('with Charlatan in the game, counts a Curse in the trash as a Treasure', async () => {
    const game = createGame({ kingdom: ['Forager', 'Charlatan'] });
    game.alice.setHand(['Forager', 'Copper', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(COPPERS);
    game.setTrash(['Charlatan Curse', 'Charlatan Curse']);

    await game.start();
    await game.playAction('Forager');
    await game.chooseCard('Copper');

    // Curse and Copper
    expect(game.alice.coins).toBe(2);
  });
});
