import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const COPPERS = Array<string>(10).fill('Copper');

describe('Dame Josephine', () => {
  it('is worth 2 VP to its owner wherever it is', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Josephine', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Estate', ...COPPERS]);
    game.bob.setDeck(COPPERS);

    expect(game.alice.score).toBe(3);

    await game.start();
    await game.playAction('Dame Josephine');
    expect(game.alice.inPlay).toEqual(['Dame Josephine']);
    expect(game.alice.score).toBe(3);
  });

  it("stops counting when it is trashed by another player's Knight, which is trashed too", async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setDeck(['Dame Josephine', 'Estate', ...COPPERS]);
    expect(game.bob.score).toBe(3);

    await game.start();
    await game.playAction('Sir Martin');

    expect(game.trash).toEqual(['Dame Josephine', 'Sir Martin']);
    expect(game.bob.score).toBe(1);
  });

  it('is worth 2 VP at the end of the game only while its owner still has it', async () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.alice.setHand(['Dame Josephine', 'Gold', 'Gold', 'Gold', 'Copper']);
    game.alice.setDeck(['Dame Josephine', ...COPPERS]);
    game.bob.setDeck(['Dame Josephine', 'Copper', ...COPPERS]);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAction('Dame Josephine');
    // Bob's Dame Josephine is a Knight, so the one Alice played is trashed too
    expect(game.trash).toEqual(['Dame Josephine', 'Dame Josephine']);
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    const total = (name: string): number | undefined =>
      game.gameResult?.playerResults.find((result) => result.playerName === name)?.scoreReport.total;
    // Province 6 + the Dame Josephine still in Alice's deck 2
    expect(total('Alice')).toBe(8);
    expect(total('Bob')).toBe(0);
  });

  it('still counts its 2 VP while it is on the Island mat', async () => {
    const game = createGame({ kingdom: ['Knights', 'Island'] });
    game.alice.setHand(['Island', 'Dame Josephine', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);

    await game.start();
    expect(game.alice.score).toBe(4);
    await game.playAction('Island');
    await game.chooseCard('Dame Josephine');

    expect(game.alice.islandMat).toEqual(['Island', 'Dame Josephine']);
    expect(game.alice.score).toBe(4);
  });
  it('counts 2 VP in hand, deck and discard pile alike, but not while it is still in the Knights pile', () => {
    const game = createGame({ kingdom: ['Knights'] });
    game.setPile('Knights', ['Dame Josephine', 'Sir Martin']);
    game.alice.setHand(['Dame Josephine', 'Copper']);
    game.alice.setDeck(['Dame Josephine', 'Copper']);
    game.alice.setDiscard(['Dame Josephine', 'Estate']);

    expect(game.alice.score).toBe(7);
    expect(game.bob.score).toBe(0);
  });
});
