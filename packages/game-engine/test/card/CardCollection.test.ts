import { CardCategory, CardInfo, CardLocation, CardType, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { Cost } from '../../src/card/Cost';
import { KingdomCard } from '../../src/card/KingdomCard';
import { CardEligibilityFunction } from '../../src/CardEligibilityFunction';
import { NameSortingFunction } from '../../src/CardSortingFunctions';
import { ChangeListener } from '../../src/ChangeListener';
import { Effect } from '../../src/effects/Effect';
import { EffectTriggerType } from '../../src/effects/EffectTriggerType';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { createTestClock } from '../testClock';

class TestCard extends Card {}

const createSharedGameStateMock = (cost?: Cost) => {
  const resolvedCost = cost ?? Cost.Simple(0);
  return {
    cost: vi.fn(() => resolvedCost),
    registerEffectTrigger: vi.fn(),
    ...createTestClock(),
  } as unknown as SharedGameState;
};

const createCardInfo = (overrides?: Partial<CardInfo>): CardInfo => ({
  category: CardCategory.CARD,
  name: 'Test Card',
  text: 'Test card text',
  font_size: 'small',
  cost: {
    coins: 0,
    potions: 0,
    debt: 0,
  },
  types: [CardType.ACTION],
  expansion: Expansion.TESTING,
  mechanics: [],
  ...overrides,
});

const createCard = (options?: {
  id?: string;
  name?: string;
  types?: CardType[];
  cost?: Cost;
  score?: number;
  effects?: Effect[];
  location?: CardLocation;
}): Card => {
  const card = new TestCard(
    createSharedGameStateMock(options?.cost),
    createCardInfo({
      name: options?.name ?? 'Test Card',
      types: options?.types ?? [CardType.ACTION],
      cost: (options?.cost ?? Cost.Simple(0)).toCommonCost(),
    }),
  );

  card.setId(options?.id ?? `${options?.name ?? 'card'}-id`);
  if (options?.location !== undefined) {
    card.setLocation(options.location);
  }

  if (options?.score !== undefined) {
    vi.spyOn(card, 'score').mockReturnValue(options.score);
  }

  if (options?.effects !== undefined) {
    vi.spyOn(card, 'getEffects').mockReturnValue(options.effects);
  }

  return card;
};

const createEffect = (trigger: EffectTriggerType): Effect => {
  return {
    getTrigger: vi.fn(() => trigger),
    getSource: vi.fn(),
  } as unknown as Effect;
};

describe('CardCollection', () => {
  it('reports whether the collection is empty', () => {
    const empty = CardCollection.emptyCollection();
    const nonEmpty = CardCollection.fromCards([createCard({ id: 'copper-id', name: 'Copper' })]);

    expect(empty.isEmpty()).toBe(true);
    expect(nonEmpty.isEmpty()).toBe(false);
  });

  it('constructs from a card or another collection without sharing the cards array', () => {
    const copper = createCard({ id: 'copper-id', name: 'Copper' });
    const source = CardCollection.fromCards([copper]);

    const fromCard = new CardCollection(copper);
    const fromCollection = new CardCollection(source);

    source.addCard(createCard({ id: 'silver-id', name: 'Silver' }));

    expect(fromCard.size()).toBe(1);
    expect(fromCard.getArbitraryCard()).toBe(copper);
    expect(fromCollection.size()).toBe(1);
    expect(fromCollection.getArbitraryCard()).toBe(copper);
  });

  it('tracks membership by id and clone produces an independent cards array', () => {
    const copper = createCard({ id: 'same-id', name: 'Copper' });
    const equivalentCopper = createCard({ id: 'same-id', name: 'Copper Copy' });
    const silver = createCard({ id: 'silver-id', name: 'Silver' });
    const collection = CardCollection.fromCards([copper]);
    const clone = collection.clone();

    clone.addCard(silver);

    expect(collection.contains(equivalentCopper)).toBe(true);
    expect(clone.size()).toBe(2);
    expect(collection.size()).toBe(1);
  });

  it('notifies change listeners for add and remove mutations with the updated collection', () => {
    const copper = createCard({ id: 'copper-id', name: 'Copper' });
    const silver = createCard({ id: 'silver-id', name: 'Silver' });
    const gold = createCard({ id: 'gold-id', name: 'Gold' });
    const collection = new CardCollection();
    const seenStates: string[][] = [];

    collection.onChange(
      new ChangeListener((cards) => {
        seenStates.push(cards.toCardNameArray());
      }),
    );

    collection.addCard(copper);
    collection.addCards([silver]);
    collection.addCards(CardCollection.fromCards([gold]));
    collection.removeCard(silver);
    collection.removeCards(CardCollection.fromCards([copper]));

    expect(seenStates).toEqual([
      ['Copper'],
      ['Copper', 'Silver'],
      ['Copper', 'Silver', 'Gold'],
      ['Copper', 'Gold'],
      ['Gold'],
    ]);
  });

  it('removes cards by id for removeCard and returns the removed instance', () => {
    const copper = createCard({ id: 'shared-id', name: 'Copper' });
    const sameId = createCard({ id: 'shared-id', name: 'Other Copper' });
    const collection = CardCollection.fromCards([copper]);

    const removed = collection.removeCard(sameId);

    expect(removed).toBe(copper);
    expect(collection.size()).toBe(0);
  });

  it('removes cards by id for removeCards even when given different instances', () => {
    const copper = createCard({ id: 'copper-id', name: 'Copper' });
    const copperCopy = createCard({ id: 'copper-id', name: 'Copper Copy' });
    const silver = createCard({ id: 'silver-id', name: 'Silver' });
    const collection = CardCollection.fromCards([copper, silver]);

    const removed = collection.removeCards(CardCollection.fromCards([copperCopy]));

    expect(removed.toCardNameArray()).toEqual(['Copper Copy']);
    expect(collection.toCardNameArray()).toEqual(['Silver']);
  });

  it('groups and counts cards by name', () => {
    const copperA = createCard({ id: 'copper-a', name: 'Copper', types: [CardType.TREASURE] });
    const copperB = createCard({ id: 'copper-b', name: 'Copper', types: [CardType.TREASURE] });
    const silver = createCard({ id: 'silver-id', name: 'Silver', types: [CardType.TREASURE] });
    const collection = CardCollection.fromCards([copperA, copperB, silver]);

    const groups = collection.cardGroups();
    const counts = collection.cardCounts();

    expect(groups).toHaveLength(2);
    expect(groups[0].name).toBe('Copper');
    expect(groups[0].size).toBe(2);
    expect(groups[0].example).toBe(copperA);
    expect(counts).toEqual(
      new Map([
        ['Copper', 2],
        ['Silver', 1],
      ]),
    );
  });

  it('sums score and filters effects by trigger type across cards', () => {
    const onBuyStart = createEffect(EffectTriggerType.BUY_START);
    const onBuyEnd = createEffect(EffectTriggerType.BUY_END);
    const estate = createCard({ id: 'estate-id', name: 'Estate', score: 1, effects: [onBuyStart] });
    const duchy = createCard({ id: 'duchy-id', name: 'Duchy', score: 3, effects: [onBuyEnd, onBuyStart] });
    const collection = CardCollection.fromCards([estate, duchy]);

    expect(collection.totalScore([collection])).toBe(4);
    expect(collection.getEffectsByType(EffectTriggerType.BUY_START)).toEqual([onBuyStart, onBuyStart]);
    expect(collection.getEffectsByType(EffectTriggerType.BUY_END)).toEqual([onBuyEnd]);
  });

  it('evaluates matching helpers consistently across grouped and unique results', () => {
    const copperA = createCard({ id: 'copper-a', name: 'Copper' });
    const copperB = createCard({ id: 'copper-b', name: 'Copper' });
    const silver = createCard({ id: 'silver-id', name: 'Silver' });
    const collection = CardCollection.fromCards([copperA, copperB, silver]);
    const copperOnly = new CardEligibilityFunction((card) => card.getName() === 'Copper');

    expect(collection.hasMatchingCard(copperOnly)).toBe(true);
    expect(collection.getMatchingCards(copperOnly).toCardNameArray()).toEqual(['Copper', 'Copper']);
    expect(collection.getMatchingCardsUnique(copperOnly).toCardNameArray()).toEqual(['Copper']);
    expect(collection.numMatchingCards(copperOnly)).toBe(2);
  });

  it('iterates and sorts cards using the supplied sorting function', () => {
    const silver = createCard({ id: 'silver-id', name: 'Silver' });
    const copper = createCard({ id: 'copper-id', name: 'Copper' });
    const gold = createCard({ id: 'gold-id', name: 'Gold' });
    const collection = CardCollection.fromCards([silver, copper, gold]);

    expect(Array.from(collection).map((card) => card.getName())).toEqual(['Silver', 'Copper', 'Gold']);
    expect(Array.from(collection.sorted(new NameSortingFunction())).map((card) => card.getName())).toEqual([
      'Copper',
      'Gold',
      'Silver',
    ]);
  });

  it('retrieves arbitrary cards and card metadata by id, and throws on empty collections', () => {
    const copper = createCard({ id: 'copper-id', name: 'Copper', location: CardLocation.HAND });
    const metadata = copper.getMetadata();
    const collection = CardCollection.fromCards([copper]);

    expect(collection.getArbitraryCard()).toBe(copper);
    expect(collection.getCardByMetadata(metadata)).toBe(copper);
    expect(collection.getCardByMetadata({ ...metadata, id: 'missing-id' })).toBeUndefined();
    expect(() => CardCollection.emptyCollection().getArbitraryCard()).toThrow(
      'Tried to get arbitrary card from empty card collection',
    );
  });

  it('converts cards to names, metadata, and anonymized views', () => {
    const copper = createCard({ id: 'copper-id', name: 'Copper', location: CardLocation.HAND });
    const silver = createCard({ id: 'silver-id', name: 'Silver', location: CardLocation.DISCARD });
    const collection = CardCollection.fromCards([copper, silver]);

    expect(collection.toCardNameArray()).toEqual(['Copper', 'Silver']);
    expect(collection.toCardMetadataArray()).toEqual([copper.getMetadata(), silver.getMetadata()]);
  });

  it('prints empty collections and pluralized counts without exposing per-card metadata', () => {
    const collection = CardCollection.fromCards([
      createCard({ id: 'copper-a', name: 'Copper' }),
      createCard({ id: 'copper-b', name: 'Copper' }),
      createCard({ id: 'silver-a', name: 'Silver' }),
      createCard({ id: 'silver-b', name: 'Silver' }),
    ]);

    expect(CardCollection.emptyCollection().print()).toBe('no cards');
    expect(collection.print()).toBe('2 Coppers and 2 Silvers');
  });

  it('prints singular and mixed card counts with article handling', () => {
    const collection = CardCollection.fromCards([
      createCard({ id: 'copper-a', name: 'Copper' }),
      createCard({ id: 'silver-a', name: 'Silver' }),
      createCard({ id: 'silver-b', name: 'Silver' }),
    ]);

    expect(collection.print()).toBe('a Copper and 2 Silvers');
  });

  it('clears all cards from the collection', () => {
    const collection = CardCollection.fromCards([
      createCard({ id: 'copper-id', name: 'Copper' }),
      createCard({ id: 'silver-id', name: 'Silver' }),
    ]);

    collection.clear();

    expect(collection.size()).toBe(0);
    expect(collection.toCardNameArray()).toEqual([]);
  });

  it('reports no matching card when nothing in the collection matches', () => {
    const collection = CardCollection.fromCards([createCard({ id: 'copper-id', name: 'Copper' })]);

    expect(collection.hasMatchingCard(new CardEligibilityFunction((card) => card.getName() === 'Gold'))).toBe(false);
    expect(CardCollection.emptyCollection().hasMatchingCard(new CardEligibilityFunction(() => true))).toBe(false);
  });

  it('builds an eligibility function that matches any card sharing a name with the collection', () => {
    const collection = CardCollection.fromCards([
      createCard({ id: 'silver-a', name: 'Silver' }),
      createCard({ id: 'duchy-a', name: 'Duchy' }),
    ]);

    const sameName = collection.toCardNameEligibilityFunction();

    expect(sameName.matches(createCard({ id: 'silver-b', name: 'Silver' }))).toBe(true);
    expect(sameName.matches(createCard({ id: 'gold-a', name: 'Gold' }))).toBe(false);
  });

  it('reports the proportion of kingdom cards from an expansion', () => {
    const createKingdomCard = (name: string, expansion: Expansion): KingdomCard => {
      const card = new KingdomCard(createSharedGameStateMock(), createCardInfo({ name, expansion }));
      card.setId(`${name}-id`);
      return card;
    };
    const collection = CardCollection.fromCards([
      createKingdomCard('Platinum Mine', Expansion.PROSPERITY),
      createKingdomCard('Bank', Expansion.PROSPERITY),
      createKingdomCard('Hermit', Expansion.DARK_AGES),
      createCard({ id: 'copper-id', name: 'Copper' }),
    ]);

    expect(collection.getProportionFromExpansion(Expansion.PROSPERITY)).toBe(0.5);
    expect(collection.getProportionFromExpansion(Expansion.DARK_AGES)).toBe(0.25);
    expect(collection.getProportionFromExpansion(Expansion.ALCHEMY)).toBe(0);
  });
});
