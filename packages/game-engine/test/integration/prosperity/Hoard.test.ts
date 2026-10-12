import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

// Resolves the gain triggers: mandatory ones (Hoard) are resolved, optional ones (Tiara) declined
const resolveGainEffects = async (game: GameHarness): Promise<void> => {
  while (game.pending.kind === 'chooseFromMultipleEvents' && game.pending.playerName === 'Alice') {
    const mandatoryEffects = game.pending.mandatoryEffects;
    if (mandatoryEffects.length > 0) {
      await game.chooseEffect(mandatoryEffects[0].effectName);
    } else {
      await game.declineEffects();
    }
  }
};

describe('Hoard', () => {
  it('gains a Gold when you buy a Victory card, but not when you gain one without buying it', async () => {
    const game = createGame({ kingdom: ['Hoard', 'War Chest'] });
    game.alice.setHand(['Hoard', 'War Chest', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const goldsBefore = game.pileSize('Gold');

    await game.start();
    await game.playTreasure('Hoard');
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');
    await game.chooseCard('Duchy');
    expect(game.pileSize('Gold')).toBe(goldsBefore);
    await game.playAllTreasures();
    await game.buy('Duchy');

    expect(game.pileSize('Gold')).toBe(goldsBefore - 1);
    expect(game.alice.discard.filter((name) => name === 'Duchy')).toHaveLength(2);
  });

  it('is cumulative: two Hoards and two bought Estates gain four Golds', async () => {
    const game = createGame({ kingdom: ['Hoard', "Worker's Village"] });
    game.alice.setHand(["Worker's Village", 'Hoard', 'Hoard', 'Estate', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const goldsBefore = game.pileSize('Gold');

    await game.start();
    await game.playAction("Worker's Village");
    await game.playTreasure('Hoard');
    await game.playTreasure('Hoard');
    await game.buy('Estate');
    await resolveGainEffects(game);
    await game.buy('Estate');
    await resolveGainEffects(game);

    expect(game.pileSize('Gold')).toBe(goldsBefore - 4);
  });

  it('gains a Gold for each time it was played, when Tiara plays it twice', async () => {
    const game = createGame({ kingdom: ['Hoard', 'Tiara'] });
    game.alice.setHand(['Tiara', 'Hoard', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const goldsBefore = game.pileSize('Gold');

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Hoard');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(7);
    await game.buy('Duchy');
    await resolveGainEffects(game);

    expect(game.pileSize('Gold')).toBe(goldsBefore - 2);
  });

  it('still gains a Gold after the Hoard has been trashed by gaining a Mint', async () => {
    const game = createGame({ kingdom: ['Hoard', 'Mint', "Worker's Village"] });
    game.alice.setHand(["Worker's Village", 'Hoard', 'Gold', 'Silver', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const goldsBefore = game.pileSize('Gold');

    await game.start();
    await game.playAction("Worker's Village");
    await game.playTreasure('Hoard');
    await game.playAllTreasures();
    await game.buy('Mint');
    expect(game.trash).toContain('Hoard');
    await game.buy('Estate');

    expect(game.pileSize('Gold')).toBe(goldsBefore - 1);
  });

  it('still gains a Gold when Trader exchanges the bought Victory card for a Silver', async () => {
    const game = createGame({ kingdom: ['Hoard', 'Trader'] });
    game.alice.setHand(['Trader', 'Hoard', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const goldsBefore = game.pileSize('Gold');

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Hoard');
    await game.playAllTreasures();
    await game.buy('Duchy');
    await game.chooseEffect('Trader');
    // You still bought and gained the Duchy
    await resolveGainEffects(game);

    expect(game.pileSize('Duchy')).toBe(8);
    expect(game.pileSize('Gold')).toBe(goldsBefore - 1);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Silver', 'Gold']));
  });

  it('gains a Gold for a bought card that is a Victory card as well as another type', async () => {
    const game = createGame({ kingdom: ['Hoard', 'Mill', 'Farm', "Worker's Village"] });
    game.alice.setHand(["Worker's Village", 'Hoard', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const goldsBefore = game.pileSize('Gold');

    await game.start();
    await game.playAction("Worker's Village");
    await game.playTreasure('Hoard');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(8);
    await game.buy('Mill');
    await resolveGainEffects(game);
    await game.buy('Silver');

    expect(game.pileSize('Gold')).toBe(goldsBefore - 1);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Mill', 'Silver']));
  });

  it('gains nothing when the Gold pile is empty', async () => {
    const game = createGame({ kingdom: ['Hoard'] });
    game.alice.setHand(['Hoard', 'Gold', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playTreasure('Hoard');
    await game.playAllTreasures();
    await game.buy('Duchy');
    await resolveGainEffects(game);

    expect(game.currentPlayerName).toBe('Bob');
    // Only the Gold that was played
    expect(game.alice.discard.filter((name) => name === 'Gold')).toHaveLength(1);
  });

  it("doesn't apply on an Outpost extra turn after the turn it was played", async () => {
    const game = createGame({ kingdom: ['Hoard', 'Outpost'] });
    game.alice.setHand(['Outpost', 'Hoard', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Gold', 'Silver', 'Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const goldsBefore = game.pileSize('Gold');

    await game.start();
    await game.playAction('Outpost');
    await game.playTreasure('Hoard');
    await game.endBuyPhase();
    await game.chooseExtraTurn('Outpost');
    expect(game.currentPlayerName).toBe('Alice');
    await game.playAllTreasures();
    await game.buy('Duchy');

    expect(game.pileSize('Gold')).toBe(goldsBefore);
    expect(game.currentPlayerName).toBe('Bob');
  });

  it('gains a Gold for a bought Treasure-Victory card such as Farm', async () => {
    const game = createGame({ kingdom: ['Hoard', 'Farm'] });
    game.alice.setHand(['Hoard', 'Gold', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const goldsBefore = game.pileSize('Gold');

    await game.start();
    await game.playTreasure('Hoard');
    await game.playAllTreasures();
    await game.buy('Farm');
    await resolveGainEffects(game);

    expect(game.pileSize('Gold')).toBe(goldsBefore - 1);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Farm', 'Gold']));
  });
});
