import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';

const coppers = (count: number): string[] => Array<string>(count).fill('Copper');

describe('Platinum', () => {
  it('is only in the Supply in games using Colonies, with 12 cards for any number of players', () => {
    expect(createGame().hasPile('Platinum')).toBe(false);
    expect(createGame().hasPile('Colony')).toBe(false);
    expect(createGame({ useColoniesPlatinum: true }).pileSize('Platinum')).toBe(12);
    expect(createGame({ useColoniesPlatinum: true, players: ['Alice', 'Bob', 'Cara'] }).pileSize('Platinum')).toBe(12);
  });

  it('is played for $5 and can be bought for $9', async () => {
    const game = createGame({ useColoniesPlatinum: true });
    game.alice.setHand(['Platinum', 'Gold', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playAllTreasures();
    expect(game.alice.coins).toBe(9);
    const platinum = game.pending.cardChoices.find(
      (choice) => choice.card.name === 'Platinum' && choice.card.location === CardLocation.PILE,
    );
    expect(platinum?.card.cost.coins).toBe(9);
    await game.buy('Platinum');

    expect(game.alice.discard).toContain('Platinum');
    expect(game.pileSize('Platinum')).toBe(11);
  });

  it('has 12 cards with 4 players', () => {
    const game = createGame({ useColoniesPlatinum: true, players: ['Alice', 'Bob', 'Cara', 'Dan'] });
    expect(game.pileSize('Platinum')).toBe(12);
  });

  it('is played twice by Tiara for $10', async () => {
    const game = createGame({ kingdom: ['Tiara'], useColoniesPlatinum: true });
    game.alice.setHand(['Tiara', 'Platinum', 'Copper', 'Estate', 'Estate']);
    game.alice.setDeck(coppers(10));

    await game.start();
    await game.playTreasure('Tiara');
    await game.chooseCard('Platinum');
    await game.playAllTreasures();

    expect(game.alice.coins).toBe(11);
    expect(game.pending.cardChoices.map((choice) => choice.card.name)).toContain('Colony');
  });
});
