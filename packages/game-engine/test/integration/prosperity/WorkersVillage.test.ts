import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe("Worker's Village", () => {
  it('still gives +2 Actions and +1 Buy with no card to draw', async () => {
    const game = createGame({ kingdom: ["Worker's Village"] });
    game.alice.setHand(["Worker's Village", 'Estate', 'Estate', 'Estate', 'Estate']);

    await game.start();
    await game.playAction("Worker's Village");

    expect(game.alice.hand).toHaveLength(4);
    expect(game.alice.actions).toBe(2);
    expect(game.alice.buys).toBe(2);
  });

  it("played by King's Court, gives +3 Cards, +6 Actions and +3 Buys", async () => {
    const game = createGame({ kingdom: ["Worker's Village", "King's Court"] });
    game.alice.setHand(["King's Court", "Worker's Village", 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAction("King's Court");
    await game.chooseCard("Worker's Village");

    expect(game.alice.hand).toHaveLength(6);
    expect(game.alice.actions).toBe(6);
    expect(game.alice.buys).toBe(4);
  });
});
