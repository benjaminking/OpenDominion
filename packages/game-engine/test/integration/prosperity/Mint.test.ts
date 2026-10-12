import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Mint', () => {
  it('trashes your non-Duration Treasures in play when you buy it, but you keep the $ they made', async () => {
    const game = createGame({ kingdom: ['Mint', "Worker's Village", 'Astrolabe'] });
    game.alice.setHand(["Worker's Village", 'Astrolabe', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction("Worker's Village");
    await game.playTreasure('Astrolabe');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(8);
    await game.buy('Mint');

    expect([...game.trash].sort()).toEqual(['Copper', 'Gold', 'Gold']);
    expect(game.alice.inPlay).toEqual(["Worker's Village", 'Astrolabe']);
    expect(game.alice.coins).toBe(3);
    await game.buy('Silver');
    expect(game.alice.discard).toEqual(['Mint', 'Silver']);
  });

  it('trashes your Treasures in play when gained without buying it, including the War Chest that gained it', async () => {
    const game = createGame({ kingdom: ['Mint', 'War Chest'] });
    game.alice.setHand(['War Chest', 'Silver', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    await game.playTreasure('War Chest');
    game.expectDecision('chooseCard', 'Bob');
    await game.chooseCard('Silver');
    await game.chooseCard('Mint');

    expect([...game.trash].sort()).toEqual(['Copper', 'Silver', 'War Chest']);
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toEqual(['Mint']);
    expect(game.alice.coins).toBe(3);
  });

  it('can be put onto your deck with Tiara even though gaining it trashes the Tiara', async () => {
    const game = createGame({ kingdom: ['Mint', 'Tiara'] });
    game.alice.setHand(['Tiara', 'Silver', 'Silver', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Silver');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(7);
    await game.buy('Mint');
    const gainEffects = game.expectDecision('chooseFromMultipleEvents', 'Alice');
    expect(gainEffects.optionalEffects.map((effect) => effect.effectName)).toEqual(['Tiara']);
    expect(gainEffects.mandatoryEffects.map((effect) => effect.effectName)).toEqual(['Mint']);
    await game.chooseEffect('Mint');
    expect(game.trash).toContain('Tiara');
    await game.chooseEffect('Tiara');
    await game.endBuyPhase();

    expect(game.alice.hand[0]).toBe('Mint');
    expect(game.alice.discard).not.toContain('Mint');
  });

  it('may reveal a Treasure to gain a copy of it, and the revealed Treasure can still be played', async () => {
    const game = createGame({ kingdom: ['Mint'] });
    game.alice.setHand(['Mint', 'Silver', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Mint');
    const reveal = game.expectDecision('chooseCard', 'Alice');
    expect(reveal.noneAllowed).toBe(true);
    expect(reveal.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Copper', 'Silver']);
    await game.chooseCard('Silver');

    expect(game.alice.discard).toEqual(['Silver']);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(3);
  });

  it('trashes a Coronet played in the Action phase, since it is also a Treasure, and the Treasure it played twice', async () => {
    const game = createGame({ kingdom: ['Mint', "Worker's Village"] });
    game.alice.setHand(['Coronet', "Worker's Village", 'Silver', 'Gold', 'Estate']);
    game.alice.setDeck(['Estate', 'Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Coronet');
    await game.chooseCard("Worker's Village");
    await game.chooseCard('Silver');
    expect(game.alice.coins).toBe(4);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(7);
    await game.buy('Mint');

    expect([...game.trash].sort()).toEqual(['Coronet', 'Gold', 'Silver']);
    expect(game.alice.inPlay).toEqual(["Worker's Village"]);
    expect(game.alice.coins).toBe(2);
  });

  it('trashes a Tiara that played a Duration Treasure twice, but the Duration still gives its next-turn bonus twice', async () => {
    const game = createGame({ kingdom: ['Mint', 'Tiara', 'Astrolabe'] });
    game.alice.setHand(['Tiara', 'Astrolabe', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Astrolabe');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(5);
    await game.buy('Mint');
    await game.chooseEffect('Mint');
    // Tiara (now in the trash) still offers to put the Mint onto the deck
    await game.declineEffects();

    expect([...game.trash].sort()).toEqual(['Gold', 'Tiara']);
    expect(game.alice.inPlay).toEqual(['Astrolabe']);
    await game.endBuyPhase();
    expect(game.alice.inPlay).toEqual(['Astrolabe']);
    await game.endTurn();
    while (game.pending.kind === 'chooseFromMultipleEvents') {
      await game.chooseEffect('Astrolabe');
    }

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.coins).toBe(2);
    expect(game.alice.buys).toBe(3);
  });

  it('trashes the Counterfeit in play, after Counterfeit has already trashed the Treasure it played twice', async () => {
    const game = createGame({ kingdom: ['Mint', 'Counterfeit'] });
    game.alice.setHand(['Counterfeit', 'Silver', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Counterfeit');
    await game.chooseCard('Silver');
    expect(game.trash).toEqual(['Silver']);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(6);
    await game.buy('Mint');

    expect([...game.trash].sort()).toEqual(['Copper', 'Counterfeit', 'Silver']);
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.buys).toBe(1);
  });

  it('still trashes your Treasures when Trader exchanges the gained Mint for a Silver first', async () => {
    const game = createGame({ kingdom: ['Mint', 'Trader'] });
    game.alice.setHand(['Trader', 'Silver', 'Silver', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    const mintsBefore = game.pileSize('Mint');

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Mint');
    await game.chooseEffect('Trader');
    // Mint was still gained, so its when-gain ability still happens
    if (game.pending.kind === 'chooseFromMultipleEvents' && game.pending.playerName === 'Alice') {
      await game.chooseEffect('Mint');
    }

    expect(game.pileSize('Mint')).toBe(mintsBefore);
    expect([...game.trash].sort()).toEqual(['Copper', 'Silver', 'Silver']);
    expect(game.alice.discard).toContain('Silver');
  });

  it('still trashes your Treasures when Watchtower trashes the gained Mint first', async () => {
    const game = createGame({ kingdom: ['Mint', 'Watchtower'] });
    game.alice.setHand(['Watchtower', 'Silver', 'Silver', 'Copper', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Mint');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    if (game.pending.kind === 'chooseFromMultipleEvents' && game.pending.playerName === 'Alice') {
      await game.chooseEffect('Mint');
    }

    expect([...game.trash].sort()).toEqual(['Copper', 'Mint', 'Silver', 'Silver']);
    expect(game.currentPlayerName).toBe('Bob');
  });

  it("can't gain a copy of a revealed Treasure that isn't in the Supply, such as Spoils", async () => {
    const game = createGame({ kingdom: ['Mint', 'Bandit Camp'] });
    game.alice.setHand(['Mint', 'Spoils', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    const spoilsBefore = game.pileSize('Spoils');

    await game.start();
    await game.playAction('Mint');
    await game.chooseCard('Spoils');

    expect(game.pileSize('Spoils')).toBe(spoilsBefore);
    expect(game.alice.discard).toEqual([]);
    expect(game.alice.hand).toContain('Spoils');
  });

  it('gains a Curse when revealing a Curse that Charlatan made a Treasure', async () => {
    const game = createGame({ kingdom: ['Mint', 'Charlatan'] });
    game.alice.setHand(['Mint', 'Charlatan Curse', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Mint');
    await game.chooseCard('Curse');

    expect(game.pileSize('Curse')).toBe(9);
    expect(game.alice.discard).toEqual(['Charlatan Curse']);
  });

  it("gained by another player during your turn (Jester's copy), trashes none of your Treasures in play", async () => {
    const game = createGame({ kingdom: ['Mint', 'Crystal Ball', 'Jester'] });
    game.alice.setHand(['Crystal Ball', 'Copper', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(['Jester', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Mint', ...coppers(5)]);

    await game.start();
    await game.playAllTreasures();
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    await game.chooseOption('Bob gains a copy');

    expect(game.bob.discard).toEqual(['Mint', 'Mint']);
    expect(game.trash).toEqual([]);
    expect(game.alice.inPlay).toEqual(['Copper', 'Copper', 'Crystal Ball', 'Jester']);
    expect(game.alice.coins).toBe(5);
  });

  it('can reveal a Treasure-Victory Farm or a Potion to gain a copy', async () => {
    const game = createGame({ kingdom: ['Mint', 'Farm', 'Golem', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Mint', 'Farm', 'Potion', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Mint');
    expect([...game.pending.cardChoices.map((choice) => choice.card.name)].sort()).toEqual(['Farm', 'Potion']);
    await game.chooseCard('Farm');
    await game.chooseCard('Potion');

    expect(game.alice.discard).toEqual(['Farm', 'Potion']);
    expect(game.alice.hand).toEqual(['Farm', 'Potion', 'Estate']);
  });

  it('trashes a Treasure-Victory Farm and a Potion in play when gained', async () => {
    const game = createGame({ kingdom: ['Mint', 'Farm', 'Golem'] });
    game.alice.setHand(['Farm', 'Potion', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Farm');
    await game.playTreasure('Potion');
    await game.playTreasure('Gold');
    expect(game.alice.coins).toBe(5);
    await game.buy('Mint');

    expect([...game.trash].sort()).toEqual(['Farm', 'Gold', 'Potion']);
    expect(game.alice.inPlay).toEqual([]);
  });
});
