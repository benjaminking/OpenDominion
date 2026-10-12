import { describe, expect, it } from 'vitest';

import { finalScore } from '../base_game/baseGameHelpers';
import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Demesne', () => {
  it('gains a Gold, and is worth 1 VP per Gold Alice has, including the new one', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Demesne', 'Gold']);
    game.alice.setDeck(coppers(10));
    expect(game.alice.score).toBe(1);

    await game.start();
    await game.playAction('Demesne');

    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.score).toBe(2);
  });

  it('still gives +2 Actions and +2 Buys when there is no Gold left', async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Demesne', 'Gold']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Gold', 0);

    await game.start();
    await game.playAction('Demesne');

    expect(game.alice.discard).toEqual([]);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(3);
    expect(game.alice.score).toBe(1);
  });

  it('played twice by Throne Room, gives +4 Actions, +4 Buys and two Golds, and is worth 1 VP per Gold', async () => {
    const game = createGame({ kingdom: ['Throne Room'] });
    game.alice.setHand(['Throne Room', 'Demesne']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Demesne');

    expect(game.alice.discard).toEqual(['Gold', 'Gold']);
    expect(game.alice.actions).toBe(4);
    expect(game.alice.buys).toBe(5);
    expect(game.alice.score).toBe(2);
  });

  it('played twice by Throne Room with only one Gold left, gains just that one', async () => {
    const game = createGame({ kingdom: ['Throne Room'] });
    game.alice.setHand(['Throne Room', 'Demesne']);
    game.alice.setDeck(coppers(10));
    game.setPileSize('Gold', 1);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Demesne');

    expect(game.alice.discard).toEqual(['Gold']);
    expect(game.alice.actions).toBe(4);
    expect(game.pileSize('Gold')).toBe(0);
  });

  it('counts Golds on the Island mat and set aside by Haven', async () => {
    const game = createGame({ kingdom: ['Island', 'Haven'] });
    game.alice.setHand(['Haven', 'Island', 'Gold', 'Gold', 'Demesne']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction('Haven');
    await game.chooseCard('Gold');
    await game.playAction('Island');
    await game.chooseCard('Gold');

    expect(game.alice.islandMat.sort()).toEqual(['Gold', 'Island']);
    expect(game.alice.setAside).toEqual(['Gold']);
    // Demesne: 2 Golds; Island: 2 VP
    expect(game.alice.score).toBe(4);
  });

  it("at the end of the game, each Demesne is worth 1 VP per Gold Alice has anywhere, but not Golds in the trash or Bob's", async () => {
    const game = createGame({ kingdom: ['Village'] });
    game.alice.setHand(['Gold', 'Gold', 'Gold']);
    game.alice.setDeck(['Demesne', 'Gold', ...coppers(5)]);
    game.alice.setDiscard(['Demesne', 'Silver']);
    game.bob.setHand(['Gold', 'Gold']);
    game.setTrash(['Gold']);
    game.setPileSize('Province', 1);

    await game.start();
    await game.playAllTreasures();
    await game.buy('Province');

    expect(game.isFinished).toBe(true);
    // Province 6, and two Demesnes each worth 4 (3 Golds played, 1 in the deck)
    expect(finalScore(game, 'Alice')).toBe(6 + 2 * 4);
  });

  it('a Silver or Platinum is not a Gold', async () => {
    const game = createGame({ kingdom: ['Village'], useColoniesPlatinum: true });
    game.alice.setHand(['Demesne', 'Silver', 'Platinum', 'Gold']);

    expect(game.alice.score).toBe(1);
  });
});
