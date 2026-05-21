import { CardInfo, CardType, Expansion, PileCategory } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { Cost } from '../../src/card/Cost';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { Pile } from '../../src/piles/Pile';
import { SharedGameState } from '../../src/SharedGameState';

class TestCard extends Card {}

const createSharedGameStateMock = (cost?: Cost) => {
  const resolvedCost = cost ?? Cost.Simple(0);
  return {
    cost: vi.fn(() => resolvedCost),
    registerEffectTrigger: vi.fn(),
  } as unknown as SharedGameState;
};

const createCard = (options: { id: string; name: string; cost: Cost; types?: CardType[] }): Card => {
  const card = new TestCard(createSharedGameStateMock(options.cost), {
    name: options.name,
    text: 'Test card text',
    font_size: 'small',
    cost: options.cost.toCommonCost(),
    types: options.types ?? [CardType.ACTION],
    expansion: Expansion.TESTING,
    mechanics: [],
  } satisfies CardInfo);
  card.setId(options.id);
  return card;
};

const createBroadcaster = () => {
  return {
    sendPileMetadata: vi.fn(),
  } as unknown as GameMessageBroadcaster;
};

describe('Pile', () => {
  it('captures its original size and initial top-card cost at construction', () => {
    const estate = createCard({ id: 'estate-id', name: 'Estate', cost: Cost.Simple(2) });
    const duchy = createCard({ id: 'duchy-id', name: 'Duchy', cost: Cost.Simple(5) });
    const pile = new Pile(
      'Victory',
      CardCollection.fromCards([estate, duchy]),
      new Set([CardType.VICTORY]),
      new Set([PileCategory.KINGDOM]),
      createBroadcaster(),
    );

    pile.removeTopCard();

    expect(pile.name).toBe('Victory');
    expect(pile.originalSize).toBe(2);
    expect(pile.cost.isEqualTo(Cost.Simple(5))).toBe(true);
    expect(pile.size()).toBe(1);
  });

  it('reports emptiness, types, categories, and metadata from the current top card', () => {
    const estate = createCard({ id: 'estate-id', name: 'Estate', cost: Cost.Simple(2), types: [CardType.VICTORY] });
    const duchy = createCard({
      id: 'duchy-id',
      name: 'Duchy',
      cost: Cost.Simple(5),
      types: [CardType.ACTION, CardType.VICTORY],
    });
    const categories = new Set([PileCategory.KINGDOM]);
    const pile = new Pile(
      'Victory',
      CardCollection.fromCards([estate, duchy]),
      new Set([CardType.VICTORY]),
      categories,
      createBroadcaster(),
    );

    expect(pile.isEmpty()).toBe(false);
    expect(pile.getTypes()).toEqual(new Set([CardType.VICTORY]));
    expect(pile.getCategories()).toBe(categories);
    expect(pile.getPileMetadata()).toEqual({
      name: 'Victory',
      size: 2,
      cost: Cost.Simple(5).toCommonCost(),
      topCard: duchy.getMetadata(),
      types: [CardType.ACTION, CardType.VICTORY],
      categories: [PileCategory.KINGDOM],
    });

    pile.removeTopCard();

    expect(pile.getPileMetadata().topCard).toEqual(estate.getMetadata());
    expect(pile.getPileMetadata().types).toEqual([CardType.VICTORY]);
  });

  it('broadcasts pile metadata for initial communication and top-card removal', () => {
    const broadcaster = createBroadcaster();
    const pile = new Pile(
      'Treasure',
      CardCollection.fromCards([
        createCard({ id: 'gold-id', name: 'Gold', cost: Cost.Simple(6), types: [CardType.TREASURE] }),
      ]),
      new Set([CardType.TREASURE]),
      new Set([PileCategory.BASIC_TREASURE]),
      broadcaster,
    );
    const initialMetadata = pile.getPileMetadata();

    pile.communicateInitialState();
    pile.removeTopCard();

    expect(broadcaster.sendPileMetadata).toHaveBeenCalledTimes(2);
    expect((broadcaster.sendPileMetadata as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual(initialMetadata);
    expect((broadcaster.sendPileMetadata as ReturnType<typeof vi.fn>).mock.calls[1][0]).toEqual(pile.getPileMetadata());
    expect(pile.isEmpty()).toBe(true);
  });
});
