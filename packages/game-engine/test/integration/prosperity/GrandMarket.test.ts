import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

const offeredSupplyNames = (game: GameHarness): string[] =>
  game.pending.cardChoices
    .filter((choice) => choice.card.location === CardLocation.PILE)
    .map((choice) => choice.card.name);

describe('Grand Market', () => {
  it("can't be bought once a Copper is in play, but Coppers in hand don't matter", async () => {
    const game = createGame({ kingdom: ['Grand Market'] });
    game.alice.setHand(['Gold', 'Gold', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Gold');
    await game.playTreasure('Gold');
    expect(offeredSupplyNames(game)).toContain('Grand Market');
    await game.playTreasure('Copper');

    expect(game.alice.coins).toBe(7);
    expect(offeredSupplyNames(game)).toContain('Gold');
    expect(offeredSupplyNames(game)).not.toContain('Grand Market');
  });

  it('can be bought after gaining a Mint trashed the Coppers that were in play', async () => {
    const game = createGame({ kingdom: ['Grand Market', 'Mint', "Worker's Village"] });
    game.alice.setHand(["Worker's Village", ...coppers(11)]);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("Worker's Village");
    await game.playAllTreasures();
    expect(offeredSupplyNames(game)).not.toContain('Grand Market');
    await game.buy('Mint');
    expect(game.alice.inPlay).toEqual(["Worker's Village"]);
    expect(offeredSupplyNames(game)).toContain('Grand Market');
    await game.buy('Grand Market');

    expect(game.alice.discard).toContain('Grand Market');
    expect(game.alice.discard).toContain('Mint');
  });

  it("doesn't let you play a Copper after buying it", async () => {
    const game = createGame({ kingdom: ['Grand Market', "Worker's Village"] });
    game.alice.setHand(["Worker's Village", 'Gold', 'Gold', 'Copper', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);

    await game.start();
    await game.playAction("Worker's Village");
    await game.playTreasure('Gold');
    await game.playTreasure('Gold');
    await game.buy('Grand Market');

    expect(game.alice.buys).toBe(1);
    expect(game.pending.cardChoices.filter((choice) => choice.card.location === CardLocation.HAND)).toEqual([]);
  });

  it('can be gained other than by buying it while Coppers are in play', async () => {
    const game = createGame({ kingdom: ['Grand Market', 'Quarry', 'War Chest'] });
    game.alice.setHand(['Copper', 'Quarry', 'War Chest', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Copper');
    // Quarry makes Grand Market cost $4, so War Chest can gain it
    await game.playTreasure('Quarry');
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');
    await game.chooseCard('Grand Market');

    expect(game.alice.discard).toEqual(['Grand Market']);
  });

  it("can't be bought after Crystal Ball plays a Copper from the deck", async () => {
    const game = createGame({ kingdom: ['Grand Market', 'Crystal Ball'] });
    game.alice.setHand(['Crystal Ball', 'Gold', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(['Copper', ...coppers(10)]);

    await game.start();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(8);
    expect(game.alice.inPlay).toContain('Copper');
    expect(offeredSupplyNames(game)).toContain('Gold');
    expect(offeredSupplyNames(game)).not.toContain('Grand Market');
  });
});
