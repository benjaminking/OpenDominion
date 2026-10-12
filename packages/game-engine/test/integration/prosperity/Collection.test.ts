import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

// Resolves Alice's gain triggers: mandatory ones (Collection) are resolved, optional ones (Tiara) declined
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

describe('Collection', () => {
  it('gives +1 VP for each Action card gained this turn, whether bought or gained otherwise', async () => {
    const game = createGame({ kingdom: ['Collection', 'War Chest', 'Village', 'Smithy'] });
    game.alice.setHand(['Collection', 'War Chest', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Collection');
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');
    await game.chooseCard('Village');
    expect(game.alice.vpTokens).toBe(1);
    await game.playAllTreasures();
    await game.buy('Smithy');
    expect(game.alice.vpTokens).toBe(2);
    // Non-Action cards give nothing
    await game.buy('Copper');

    expect(game.alice.vpTokens).toBe(2);
    expect(game.currentPlayerName).toBe('Bob');
  });

  it('is cumulative: with two Collections in play, buying an Action card gives +2 VP', async () => {
    const game = createGame({ kingdom: ['Collection', 'Village'] });
    game.alice.setHand(['Collection', 'Collection', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Collection');
    await game.playTreasure('Collection');
    await game.buy('Village');

    expect(game.alice.vpTokens).toBe(2);
  });

  it('only gives VP on the turn it was played', async () => {
    const game = createGame({ kingdom: ['Collection', 'Village'] });
    game.alice.setHand(['Collection', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver', 'Silver', 'Estate', 'Estate', 'Estate', ...coppers(5)]);
    game.bob.setHand(['Silver', 'Silver', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Collection');
    await game.endBuyPhase();
    // Bob buys an Action card on his turn
    await game.playAllTreasures();
    await game.buy('Village');
    // Alice buys one on her next turn
    await game.playAllTreasures();
    await game.buy('Village');

    expect(game.alice.vpTokens).toBe(0);
    expect(game.bob.vpTokens).toBe(0);
  });

  it('still gives +1 VP for a gained Action card that Watchtower trashes', async () => {
    const game = createGame({ kingdom: ['Collection', 'Watchtower', 'Village'] });
    game.alice.setHand(['Collection', 'Watchtower', 'Silver', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Collection');
    await game.playAllTreasures();
    await game.buy('Village');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    if (game.pending.kind === 'chooseFromMultipleEvents' && game.pending.playerName === 'Alice') {
      await game.chooseEffect('Collection');
    }

    expect(game.trash).toEqual(['Village']);
    expect(game.alice.vpTokens).toBe(1);
  });

  it('gives +1 VP for an Action-Victory card such as Mill, but not for a Treasure-Victory card such as Farm', async () => {
    const game = createGame({ kingdom: ['Collection', 'Mill', 'Farm'] });
    game.alice.setHand(['Collection', 'Gold', 'Gold', 'Gold', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Collection');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(11);
    await game.buy('Mill');
    expect(game.alice.vpTokens).toBe(1);
    await game.buy('Farm');

    expect(game.alice.vpTokens).toBe(1);
    expect(game.alice.discard).toEqual(expect.arrayContaining(['Mill', 'Farm']));
  });

  it("doesn't count Action cards gained earlier in the turn, before it was played", async () => {
    const game = createGame({ kingdom: ['Collection', 'War Chest', 'Village', 'Smithy'] });
    game.alice.setHand(['War Chest', 'Collection', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('War Chest');
    await game.chooseCard('Silver');
    await game.chooseCard('Village');
    await game.playTreasure('Collection');
    expect(game.alice.vpTokens).toBe(0);
    await game.playAllTreasures();
    await game.buy('Smithy');

    expect(game.alice.vpTokens).toBe(1);
  });

  it('gives +2 VP per Action card gained when Tiara plays it twice', async () => {
    const game = createGame({ kingdom: ['Collection', 'Tiara', 'Village'] });
    game.alice.setHand(['Tiara', 'Collection', 'Silver', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Collection');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(6);
    expect(game.alice.buys).toBe(4);
    await game.buy('Village');
    await resolveGainEffects(game);

    expect(game.alice.vpTokens).toBe(2);
  });

  it('still gives VP for the rest of the turn after gaining a Mint trashed it', async () => {
    const game = createGame({ kingdom: ['Collection', 'Mint', 'Village'] });
    game.alice.setHand(['Collection', 'Gold', 'Gold', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Collection');
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(8);
    await game.buy('Mint');
    // Mint is an Action card too; trash the Treasures in play first
    await game.chooseEffect('Mint');
    // Collection's +1 VP for the Mint still resolves (the only effect left, so without a prompt)
    expect(game.trash).toContain('Collection');
    expect(game.alice.vpTokens).toBe(1);
    await game.buy('Village');

    expect(game.alice.vpTokens).toBe(2);
  });

  it("doesn't give VP for Action cards another player gains during your turn, e.g. from Jester (3 players)", async () => {
    const game = createGame({
      kingdom: ['Collection', 'Crystal Ball', 'Jester', 'Village', 'Smithy'],
      players: ['Alice', 'Bob', 'Cara'],
    });
    const cara = game.player('Cara');
    game.alice.setHand(['Collection', 'Crystal Ball', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Jester', ...coppers(10)]);
    game.bob.setDeck(['Village', ...coppers(5)]);
    cara.setDeck(['Smithy', ...coppers(5)]);

    await game.start();
    await game.playTreasure('Collection');
    await game.playTreasure('Crystal Ball');
    await game.chooseOption('Play it');
    // Bob discards Village and gains the copy; Cara discards Smithy and Alice gains the copy
    await game.chooseOption('Bob gains a copy');
    await game.chooseOption('You gain a copy');
    await resolveGainEffects(game);

    expect(game.bob.discard).toEqual(['Village', 'Village']);
    expect(game.bob.vpTokens).toBe(0);
    expect(game.alice.discard).toEqual(['Smithy']);
    expect(game.alice.vpTokens).toBe(1);
  });

  it("doesn't apply on an Outpost extra turn after the turn it was played", async () => {
    const game = createGame({ kingdom: ['Collection', 'Outpost', 'Village'] });
    game.alice.setHand(['Outpost', 'Collection', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver', 'Silver', 'Estate', ...coppers(10)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Outpost');
    await game.playTreasure('Collection');
    await game.endBuyPhase();
    await game.chooseExtraTurn('Outpost');
    expect(game.currentPlayerName).toBe('Alice');
    await game.playAllTreasures();
    await game.buy('Village');

    expect(game.alice.vpTokens).toBe(0);
    expect(game.currentPlayerName).toBe('Bob');
  });
});
