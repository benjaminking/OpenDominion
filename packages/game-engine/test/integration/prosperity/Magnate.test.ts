import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Magnate', () => {
  it('counts every Treasure in hand, including Action-Treasure, Treasure-Victory and Curse-Treasure cards', async () => {
    const game = createGame({ kingdom: ['Magnate', 'Farm', 'Mill', 'Charlatan'] });
    game.alice.setHand(['Magnate', 'Farm', 'Coronet', 'Charlatan Curse', 'Mill', 'Estate']);
    game.alice.setDeck(['Gold', 'Gold', 'Gold', 'Gold', 'Gold']);

    await game.start();
    await game.playAction('Magnate');

    // Farm, Coronet and the Curse; not Mill or Estate
    expect(game.alice.hand).toHaveLength(8);
    expect(game.alice.deck).toEqual(['Gold', 'Gold']);
  });

  it("played by King's Court, counts the Treasures in hand again on each play", async () => {
    const game = createGame({ kingdom: ['Magnate', "King's Court"] });
    game.alice.setHand(["King's Court", 'Magnate', 'Copper']);
    game.alice.setDeck(['Silver', 'Estate', 'Copper', 'Gold', 'Estate', 'Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard('Magnate');

    // 1 Treasure: Silver. 2 Treasures: Estate, Copper. 3 Treasures: Gold, Estate, Estate
    expect(game.alice.hand).toEqual(['Copper', 'Silver', 'Estate', 'Copper', 'Gold', 'Estate', 'Estate']);
    expect(game.alice.deck).toEqual(['Estate', 'Estate']);
  });

  it('draws nothing when the deck and discard pile are empty', async () => {
    const game = createGame({ kingdom: ['Magnate'] });
    game.alice.setHand(['Magnate', 'Copper', 'Copper', 'Silver', 'Estate']);

    await game.start();
    await game.playAction('Magnate');

    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Silver', 'Estate']);
    expect(game.expectDecision('treasurePhase', 'Alice')).toBeDefined();
  });

  it('played by Crystal Ball in the Buy phase, draws Treasures that can still be played', async () => {
    const game = createGame({ kingdom: ['Magnate', 'Crystal Ball'] });
    game.alice.setHand(['Crystal Ball', 'Copper', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Magnate', 'Gold', ...coppers(5)]);

    await game.start();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    expect(game.alice.hand).toEqual(['Copper', 'Estate', 'Estate', 'Estate', 'Gold']);
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(5);
  });
});
