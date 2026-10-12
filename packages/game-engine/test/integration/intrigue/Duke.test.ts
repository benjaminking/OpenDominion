import { GameOutcome } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Duke', () => {
  it('is worth 1VP per Duchy the player has in any zone, and only counts their own Duchies', async () => {
    const game = createGame({ kingdom: ['Duke'] });
    game.alice.setHand(['Duke', 'Duchy', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Duchy', 'Duke', 'Estate']);
    game.alice.setDiscard(['Duchy']);
    game.bob.setHand(['Duchy', 'Duchy', 'Copper', 'Copper', 'Copper']);

    await game.start();

    // 3 Duchies (9) + 2 Dukes worth 3 each (6) + Estate (1)
    expect(game.alice.score).toBe(16);
    // Bob's Duchies don't count for Alice's Dukes, and Bob has no Dukes
    expect(game.bob.score).toBe(6);
  });

  it('is worth 0VP with no Duchies, and goes up as soon as a Duchy is gained', async () => {
    const game = createGame({ kingdom: ['Duke'] });
    game.alice.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Duke']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();
    expect(game.alice.score).toBe(0);

    await game.playAllTreasures();
    await game.buy('Duchy');
    expect(game.alice.score).toBe(4);
  });

  it('is scored at the end of the game', async () => {
    const game = createGame({ kingdom: ['Duke'] });
    game.alice.setHand(['Gold', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(['Duke', 'Duchy', 'Duchy', 'Copper', 'Copper', 'Copper']);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const aliceResult = game.gameResult?.playerResults.find((result) => result.playerName === 'Alice');
    // Province 6 + 2 Duchies 6 + Duke 2
    expect(aliceResult?.scoreReport.total).toBe(14);
  });

  it('does not count other Victory cards, including Dukes', async () => {
    const game = createGame({ kingdom: ['Duke', 'Nobles', 'Mill'] });
    game.alice.setHand(['Duke', 'Duke', 'Province', 'Nobles', 'Mill']);
    game.alice.setDeck(Array<string>(10).fill('Copper'));

    await game.start();

    // Province 6 + Nobles 2 + Mill 1; the Dukes are worth 0
    expect(game.alice.score).toBe(9);
  });

  it('counts a Duchy on the Island mat', async () => {
    const game = createGame({ kingdom: ['Duke', 'Island'] });
    game.alice.setHand(['Island', 'Duchy', 'Duke', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Island');
    await game.chooseCard('Duchy');

    expect(game.alice.islandMat).toEqual(['Island', 'Duchy']);
    // Duchy 3 + Island 2 + Duke 1
    expect(game.alice.score).toBe(6);
  });

  it('adds VP tokens to the score, and both count at the end of the game', async () => {
    const game = createGame({ kingdom: ['Duke', 'Monument'] });
    game.alice.setHand(['Monument', 'Gold', 'Gold', 'Gold', 'Duke']);
    game.alice.setDeck(['Duchy', 'Duchy', ...coppers(10)]);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Monument');
    expect(game.alice.vpTokens).toBe(1);
    // Duchies 6 + Duke 2 + 1 VP token
    expect(game.alice.score).toBe(9);
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const aliceResult = game.gameResult?.playerResults.find((result) => result.playerName === 'Alice');
    expect(aliceResult?.scoreReport.total).toBe(15);
  });

  it('changes value for both players when a Duchy is passed with Masquerade', async () => {
    const game = createGame({ kingdom: ['Duke', 'Masquerade'] });
    game.alice.setHand(['Masquerade', 'Duchy', 'Duke', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Duke', 'Duke', 'Copper']);

    await game.start();
    expect(game.alice.score).toBe(4);
    expect(game.bob.score).toBe(0);
    await game.playAction('Masquerade');
    await game.chooseCard('Duchy');
    await game.chooseCard('Copper');

    expect(game.alice.score).toBe(0);
    // Duchy 3 + 2 Dukes worth 1 each
    expect(game.bob.score).toBe(5);
  });

  it('has a Victory-card pile size (like Nobles, Mill and Farm): 8 with 2 players, 12 with 3', async () => {
    const twoPlayers = createGame({ kingdom: ['Duke', 'Nobles', 'Mill', 'Farm'] });
    const threePlayers = createGame({ kingdom: ['Duke', 'Nobles', 'Mill', 'Farm'], players: ['Alice', 'Bob', 'Cara'] });

    for (const name of ['Duke', 'Nobles', 'Mill', 'Farm']) {
      expect(twoPlayers.pileSize(name)).toBe(8);
      expect(threePlayers.pileSize(name)).toBe(12);
    }
    // Other Intrigue kingdom piles have 10
    expect(twoPlayers.pileSize('Village')).toBe(10);
  });

  it('can tie the game, which the player with fewer turns wins', async () => {
    const game = createGame({ kingdom: ['Duke'] });
    game.alice.setHand(['Gold', 'Gold', 'Gold', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Duchy', 'Duke', 'Duke', 'Estate', 'Copper']);
    game.bob.setDeck(coppers(10));
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const results = game.gameResult!.playerResults;
    const alice = results.find((result) => result.playerName === 'Alice')!;
    const bob = results.find((result) => result.playerName === 'Bob')!;
    // Province 6 vs Duchy 3 + 2 Dukes worth 1 each + Estate 1
    expect(alice.scoreReport.total).toBe(6);
    expect(bob.scoreReport.total).toBe(6);
    expect(bob.outcome).toBe(GameOutcome.WIN);
    expect(alice.outcome).toBe(GameOutcome.LOSS);
  });

  it('counts a Duchy set aside by Haven', async () => {
    const game = createGame({ kingdom: ['Duke', 'Haven'] });
    game.alice.setHand(['Haven', 'Duchy', 'Duke', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Haven');
    await game.chooseCard('Duchy');

    expect(game.alice.setAside).toEqual(['Duchy']);
    expect(game.alice.score).toBe(4);
  });

  it('goes down when a Duchy is trashed', async () => {
    const game = createGame({ kingdom: ['Duke', 'Chapel'] });
    game.alice.setHand(['Chapel', 'Duchy', 'Duchy', 'Duke', 'Copper']);
    game.alice.setDeck(coppers(10));

    await game.start();
    expect(game.alice.score).toBe(8);
    await game.playAction('Chapel');
    await game.chooseCards(['Duchy']);

    expect(game.alice.score).toBe(4);
  });

  it('has 12 cards with 4 players', () => {
    const game = createGame({ kingdom: ['Duke'], players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    expect(game.pileSize('Duke')).toBe(12);
  });
});
