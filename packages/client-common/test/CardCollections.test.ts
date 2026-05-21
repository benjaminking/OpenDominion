import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardGroup } from '../src/CardGroup';
import { CardGrouper, SingleCardGrouper } from '../src/CardGrouper';
import { GroupedCardCollection } from '../src/GroupedCardCollection';
import { createCardMetadata } from './TestFixtures';

describe('CardGroup', () => {
  it('exposes exemplar-derived data and card count', () => {
    const villageA = createCardMetadata('Village', { coins: 3, types: [CardType.ACTION], id: 'village-a' });
    const villageB = createCardMetadata('Village', { coins: 3, types: [CardType.ACTION], id: 'village-b' });
    const cardGroup = new CardGroup([villageA, villageB]);

    expect(cardGroup.exemplar).toBe(villageA);
    expect(cardGroup.name).toBe('Village');
    expect(cardGroup.hasType(CardType.ACTION)).toBe(true);
    expect(cardGroup.numCards).toBe(2);
    expect(cardGroup.cards).toEqual([villageA, villageB]);
  });
});

describe('CardGrouper', () => {
  it('groups cards by name without sorting', () => {
    const cards = [
      createCardMetadata('Estate', { coins: 2, types: [CardType.VICTORY] }),
      createCardMetadata('Village', { coins: 3, types: [CardType.ACTION] }),
      createCardMetadata('Estate', { coins: 2, types: [CardType.VICTORY] }),
    ];

    const grouped = new CardGrouper(cards).getCardGroups();

    expect(grouped).toHaveLength(2);
    expect(grouped[0].name).toBe('Estate');
    expect(grouped[0].numCards).toBe(2);
    expect(grouped[1].name).toBe('Village');
    expect(grouped[1].numCards).toBe(1);
  });

  it('sorts grouped cards using default group ordering when requested', () => {
    const cards = [
      createCardMetadata('Estate', { coins: 2, types: [CardType.VICTORY] }),
      createCardMetadata('Village', { coins: 3, types: [CardType.ACTION] }),
      createCardMetadata('Silver', { coins: 3, types: [CardType.TREASURE] }),
    ];

    const grouped = new CardGrouper(cards, true).getCardGroups();

    expect(grouped.map((group) => group.name)).toEqual(['Village', 'Silver', 'Estate']);
  });
});

describe('SingleCardGrouper', () => {
  it('creates one group per card and preserves order by default', () => {
    const cards = [
      createCardMetadata('Silver', { coins: 3, types: [CardType.TREASURE], id: 'silver-a' }),
      createCardMetadata('Silver', { coins: 3, types: [CardType.TREASURE], id: 'silver-b' }),
    ];

    const grouped = new SingleCardGrouper(cards).getCardGroups();

    expect(grouped).toHaveLength(2);
    expect(grouped[0].cards).toEqual([cards[0]]);
    expect(grouped[1].cards).toEqual([cards[1]]);
  });
});

describe('GroupedCardCollection', () => {
  it('replaces groups by card name and discards previous state', () => {
    const collection = new GroupedCardCollection();

    collection.replaceCards([
      createCardMetadata('Copper', { coins: 0, types: [CardType.TREASURE] }),
      createCardMetadata('Copper', { coins: 0, types: [CardType.TREASURE] }),
      createCardMetadata('Estate', { coins: 2, types: [CardType.VICTORY] }),
    ]);

    expect(collection.getCardGroups().map((group) => [group.name, group.numCards])).toEqual([
      ['Copper', 2],
      ['Estate', 1],
    ]);

    collection.replaceCards([createCardMetadata('Village', { coins: 3, types: [CardType.ACTION] })]);

    expect(collection.getCardGroups().map((group) => [group.name, group.numCards])).toEqual([['Village', 1]]);
  });
});
