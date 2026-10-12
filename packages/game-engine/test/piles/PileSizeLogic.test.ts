import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardInfo, CardType, Expansion } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { PileSizeLogic } from '../../src/piles/PileSizeLogic';

const cardInfo = (name: string, types: CardType[]): CardInfo => ({
  name,
  category: CardCategory.CARD,
  text: '',
  font_size: 'medium',
  cost: { coins: 0 },
  types,
  expansion: Expansion.TESTING,
});

describe('PileSizeLogic', () => {
  it('uses ten cards for ordinary kingdom piles regardless of player count', () => {
    for (const numPlayers of [2, 3, 4]) {
      const pileSizeLogic = new PileSizeLogic(numPlayers);

      expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Village'))).toBe(10);
      expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Hermit'))).toBe(10);
      expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Madman'))).toBe(10);
      expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Mercenary'))).toBe(10);
      expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Knights'))).toBe(10);
    }
  });

  it.each([
    [2, 8],
    [3, 12],
    [4, 12],
  ])('uses %i-player victory pile sizes for every Victory card', (numPlayers, size) => {
    const pileSizeLogic = new PileSizeLogic(numPlayers);

    expect(pileSizeLogic.getVictoryPileSize()).toBe(size);
    expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Estate'))).toBe(size);
    expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Province'))).toBe(size);
    expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Colony'))).toBe(size);
    expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Gardens'))).toBe(size);
    expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Nobles'))).toBe(size);
  });

  it.each([
    [2, 10],
    [3, 20],
    [4, 30],
  ])('uses ten Curses and ten Ruins per opponent with %i players', (numPlayers, size) => {
    const pileSizeLogic = new PileSizeLogic(numPlayers);

    expect(pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo('Curse'))).toBe(size);
    expect(pileSizeLogic.getPileSize(cardInfo('Ruins', [CardType.ACTION, CardType.RUINS]))).toBe(size);
  });

  it('applies the formulaic Curse and Ruins sizes by name before the Victory rule', () => {
    const pileSizeLogic = new PileSizeLogic(3);

    expect(pileSizeLogic.getPileSize(cardInfo('Curse', [CardType.VICTORY]))).toBe(20);
    expect(pileSizeLogic.getPileSize(cardInfo('Ruins', [CardType.VICTORY]))).toBe(20);
  });

  it('uses the fixed sizes of non-standard piles', () => {
    for (const numPlayers of [2, 4]) {
      const pileSizeLogic = new PileSizeLogic(numPlayers);
      const sizeOf = (name: string) => pileSizeLogic.getPileSize(CardInfoLookup.lookUpCardInfo(name));

      expect(sizeOf('Silver')).toBe(40);
      expect(sizeOf('Gold')).toBe(30);
      expect(sizeOf('Platinum')).toBe(12);
      expect(sizeOf('Potion')).toBe(16);
      expect(sizeOf('Rats')).toBe(20);
      expect(sizeOf('Spoils')).toBe(15);
      expect(pileSizeLogic.getPileSize(cardInfo('Port', [CardType.ACTION]))).toBe(12);
    }
  });

  it('uses one of each of the 6 Rewards with 2 players and two of each with more', () => {
    expect(new PileSizeLogic(2).getPileSize(cardInfo('Rewards', [CardType.ACTION]))).toBe(6);
    expect(new PileSizeLogic(3).getPileSize(cardInfo('Rewards', [CardType.ACTION]))).toBe(12);
    expect(new PileSizeLogic(4).getPileSize(cardInfo('Rewards', [CardType.ACTION]))).toBe(12);
  });

  it('puts the Coppers left after dealing starting decks in the Copper pile', () => {
    const copperInfo = CardInfoLookup.lookUpCardInfo('Copper');

    expect(new PileSizeLogic(2).getPileSize(copperInfo)).toBe(46);
    expect(new PileSizeLogic(3).getPileSize(copperInfo)).toBe(39);
    expect(new PileSizeLogic(4).getPileSize(copperInfo)).toBe(32);
  });
});
