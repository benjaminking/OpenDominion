import { CardType, NumberType, PileCategory, PileMetadata } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { BotStatistics } from '../src/BotStatistics';
import { Pile } from '../src/Pile';
import { Piles } from '../src/Piles';
import { Statistics } from '../src/Statistics';
import { createCardMetadata } from './TestFixtures';

const createPileMetadata = (
  name: string,
  size: number,
  categories: PileCategory[],
  topCardName?: string,
): PileMetadata => ({
  name,
  size,
  categories,
  cost: { coins: 3, debt: 0, potions: 0 },
  topCard:
    topCardName === undefined
      ? undefined
      : createCardMetadata(topCardName, { coins: 3, types: [CardType.ACTION], id: `${name}-top` }),
  types: [CardType.ACTION],
});

describe('Statistics', () => {
  it('updates each stat through direct methods and typed dispatch', () => {
    const statistics = new Statistics();

    statistics.updateActions(1);
    statistics.updateBuys(2);
    statistics.updateCoins(3);
    statistics.updateScore(4);
    expect([statistics.numActions, statistics.numBuys, statistics.numCoins, statistics.numPoints]).toEqual([
      1, 2, 3, 4,
    ]);

    statistics.updateStatistic(NumberType.ACTIONS, 5);
    statistics.updateStatistic(NumberType.BUYS, 6);
    statistics.updateStatistic(NumberType.COINS, 7);
    statistics.updateStatistic(NumberType.SCORE, 8);
    expect([statistics.numActions, statistics.numBuys, statistics.numCoins, statistics.numPoints]).toEqual([
      5, 6, 7, 8,
    ]);
  });
});

describe('BotStatistics', () => {
  it('tracks deck and pile counts and defaults missing cards to zero', () => {
    const botStatistics = new BotStatistics(2, [], []);

    botStatistics.updateCoinsInDeck(9);
    botStatistics.updateDeckCounts([
      { name: 'Copper', count: 7, card: createCardMetadata('Copper', { types: [CardType.TREASURE] }) },
      { name: 'Estate', count: 3, card: createCardMetadata('Estate', { types: [CardType.VICTORY] }) },
    ]);
    botStatistics.updatePileSize('Village', 10);

    expect(botStatistics.getCoinsInDeck()).toBe(9);
    expect(botStatistics.getCountInDeck('Copper')).toBe(7);
    expect(botStatistics.getCountInDeck('Missing')).toBe(0);
    expect(botStatistics.getCountInPile('Village')).toBe(10);
    expect(botStatistics.getCountInPile('Missing')).toBe(0);
  });
});

describe('Pile', () => {
  it('creates from metadata and allows size updates', () => {
    const pile = Pile.createFrom(createPileMetadata('Village', 10, [PileCategory.KINGDOM], 'Village'));

    expect(pile.name).toBe('Village');
    expect(pile.size).toBe(10);
    expect(pile.cost.coins).toBe(3);

    pile.updateSize(7);
    pile.updateTopCard(undefined);
    expect(pile.size).toBe(7);
  });
});

describe('Piles', () => {
  it('adds piles into all declared categories and updates existing pile sizes', () => {
    const piles = new Piles();
    const smithy = createPileMetadata('Smithy', 10, [PileCategory.KINGDOM, PileCategory.NON_SUPPLY], 'Smithy');
    const copper = createPileMetadata('Copper', 60, [PileCategory.BASIC_TREASURE], 'Copper');

    piles.updatePile(smithy);
    piles.updatePile(copper);

    expect(piles.kingdomPiles.map((pile) => pile.name)).toEqual(['Smithy']);
    expect(piles.nonSupplyPiles.map((pile) => pile.name)).toEqual(['Smithy']);
    expect(piles.basicTreasurePiles.map((pile) => pile.name)).toEqual(['Copper']);
    expect(piles.basicVictoryPiles).toEqual([]);
    expect(piles.getCountInPile('Smithy')).toBe(10);

    piles.updatePile(createPileMetadata('Smithy', 4, [PileCategory.KINGDOM], 'Smithy'));

    expect(piles.getCountInPile('Smithy')).toBe(4);
    expect(piles.getCountInPile('Missing')).toBe(0);
  });
});
