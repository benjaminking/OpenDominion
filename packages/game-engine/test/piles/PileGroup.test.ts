import { CardInfo, CardType, Expansion, PileCategory } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { Cost } from '../../src/card/Cost';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { Pile } from '../../src/piles/Pile';
import { PileGroup } from '../../src/piles/PileGroup';
import { SharedGameState } from '../../src/SharedGameState';

class TestCard extends Card {}

const createSharedGameStateMock = (cost?: Cost) => {
  const resolvedCost = cost ?? Cost.Simple(0);
  return {
    cost: vi.fn(() => resolvedCost),
    registerEffectTrigger: vi.fn(),
  } as unknown as SharedGameState;
};

const createCard = (id: string, name: string, cost: Cost): Card => {
  const card = new TestCard(createSharedGameStateMock(cost), {
    name,
    text: 'Test card text',
    font_size: 'small',
    cost: cost.toCommonCost(),
    types: [CardType.ACTION],
    expansion: Expansion.TESTING,
    mechanics: [],
  } satisfies CardInfo);
  card.setId(id);
  return card;
};

const createPile = (name: string, cards: Card[]): Pile => {
  return new Pile(name, CardCollection.fromCards(cards), new Set([CardType.ACTION]), new Set([PileCategory.KINGDOM]), {
    sendPileMetadata: vi.fn(),
  } as unknown as GameMessageBroadcaster);
};

describe('PileGroup', () => {
  it('adds, exposes, and retrieves piles by name', () => {
    const village = createPile('Village', [createCard('village-id', 'Village', Cost.Simple(3))]);
    const smithy = createPile('Smithy', [createCard('smithy-id', 'Smithy', Cost.Simple(4))]);
    const group = new PileGroup();

    group.addPile(village);
    group.addPile(smithy);

    expect(group.hasPile('Village')).toBe(true);
    expect(group.hasPile('Market')).toBe(false);
    expect(group.getPileByName('Smithy')).toBe(smithy);
    expect(group.getPileByName('Market')).toBeUndefined();
    expect(group.pileNames).toEqual(['Village', 'Smithy']);
    expect(group.piles).toEqual([village, smithy]);
  });

  it('collects top cards from non-empty piles and counts empty piles', () => {
    const village = createPile('Village', [createCard('village-id', 'Village', Cost.Simple(3))]);
    const emptyPile = createPile('Ruins', []);
    const smithy = createPile('Smithy', [createCard('smithy-id', 'Smithy', Cost.Simple(4))]);
    const group = new PileGroup();

    group.addPile(village);
    group.addPile(emptyPile);
    group.addPile(smithy);

    expect(group.getTopCards().toCardNameArray()).toEqual(['Village', 'Smithy']);
    expect(group.numEmptyPiles).toBe(1);
  });

  it('iterates piles and sorts them with the supplied sorting function', () => {
    const village = createPile('Village', [createCard('village-id', 'Village', Cost.Simple(3))]);
    const market = createPile('Market', [createCard('market-id', 'Market', Cost.Simple(5))]);
    const smithy = createPile('Smithy', [createCard('smithy-id', 'Smithy', Cost.Simple(4))]);
    const group = new PileGroup();

    group.addPile(village);
    group.addPile(market);
    group.addPile(smithy);

    expect(Array.from(group).map((pile) => pile.name)).toEqual(['Village', 'Market', 'Smithy']);
    expect(
      Array.from(
        group.sorted({
          order: (pileA, pileB) => pileA.name.localeCompare(pileB.name),
        }),
      ).map((pile) => pile.name),
    ).toEqual(['Market', 'Smithy', 'Village']);
  });
});
