import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Investment', () => {
  it('can trash itself for +1 VP per differently named Treasure in hand, which can still be played', async () => {
    const game = createGame({ kingdom: ['Investment'] });
    game.alice.setHand(['Investment', 'Estate', 'Copper', 'Copper', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Investment');
    // Trashing a card from hand is mandatory
    expect(game.expectDecision('chooseCard', 'Alice').noneAllowed).toBe(false);
    await game.chooseCard('Estate');
    expect(game.expectDecision('chooseOneOption', 'Alice').options).toEqual(['+$1', 'Trash this for VP']);
    await game.chooseOption('Trash this for VP');

    expect(game.alice.vpTokens).toBe(2);
    expect(game.trash).toEqual(['Estate', 'Investment']);
    expect(game.alice.inPlay).toEqual([]);
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(4);
  });

  it('counts every differently named Treasure, including Farm, a Charlatan Curse and Potion', async () => {
    const game = createGame({ kingdom: ['Investment', 'Farm', 'Charlatan', 'Golem', 'Mill'] });
    game.alice.setHand(['Investment', 'Estate', 'Copper', 'Copper', 'Farm', 'Charlatan Curse', 'Potion', 'Mill']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.endActionPhase();
    await game.playTreasure('Investment');
    await game.chooseCard('Estate');
    await game.chooseOption('Trash this for VP');

    // Copper, Farm, Curse and Potion; Mill and Estate aren't Treasures
    expect(game.alice.vpTokens).toBe(4);
  });

  it("doesn't count the Treasure it trashed from your hand", async () => {
    const game = createGame({ kingdom: ['Investment'] });
    game.alice.setHand(['Investment', 'Silver', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Investment');
    await game.chooseCard('Silver');
    await game.chooseOption('Trash this for VP');

    expect(game.alice.vpTokens).toBe(1);
    expect(game.trash).toEqual(['Silver', 'Investment']);
  });

  it('played twice by Tiara, has lost track of itself on the second play once the first has trashed it', async () => {
    const game = createGame({ kingdom: ['Investment', 'Tiara'] });
    game.alice.setHand(['Tiara', 'Investment', 'Estate', 'Estate', 'Silver']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Investment');
    await game.chooseCard('Estate');
    await game.chooseOption('Trash this for VP');
    // Only the Silver is left in hand
    expect(game.alice.vpTokens).toBe(1);
    expect(game.trash).toEqual(['Estate', 'Investment']);

    // The second play still trashes a card from hand, but can't trash Investment again, so it gives no VP
    await game.chooseCard('Estate');
    await game.chooseOption('Trash this for VP');

    expect(game.alice.log).toContain('Alice has lost track of Investment');
    expect(game.alice.vpTokens).toBe(1);
    expect(game.trash).toEqual(['Estate', 'Investment', 'Estate']);
    expect(game.alice.hand).toEqual(['Silver']);
  });
});
