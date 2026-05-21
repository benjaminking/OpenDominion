import { CardInfo, CardLocation, CardType, Expansion } from '@dominion/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { Cost } from '../../src/card/Cost';
import { OrderedStack } from '../../src/card/OrderedStack';
import { OwnedOrderedStack } from '../../src/card/OwnedOrderedStack';
import { OwnedUnorderedCardCollection } from '../../src/card/OwnedUnorderedCardCollection';
import { PrivacyType } from '../../src/card/PrivacyType';
import { SharedOrderedStack } from '../../src/card/SharedOrderedStack';
import { SharedUnorderedCardCollection } from '../../src/card/SharedUnorderedCardCollection';
import { CardCollectionSignal } from '../../src/messaging/CardCollectionSignal';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { Deck } from '../../src/players/Deck';
import { Discard } from '../../src/players/Discard';
import { Hand } from '../../src/players/Hand';
import { InPlay } from '../../src/players/InPlay';
import { SharedGameState } from '../../src/SharedGameState';
import { Trash } from '../../src/Trash';

class TestCard extends Card {}

class TestOrderedStack extends OrderedStack {
  public broadcastCount = 0;

  public constructor(cards?: CardCollection) {
    super(CardLocation.DECK, { updateSharedCards: vi.fn() } as unknown as GameMessageBroadcaster, cards);
  }

  protected broadcastValue(): void {
    this.broadcastCount += 1;
  }
}

class TestCardCollectionSignal extends CardCollectionSignal {
  public broadcastCount = 0;

  public constructor(cards?: CardCollection) {
    super(CardLocation.DECK, { updateSharedCards: vi.fn() } as unknown as GameMessageBroadcaster, cards);
  }

  protected broadcastValue(): void {
    this.broadcastCount += 1;
  }
}

const createSharedGameStateMock = (cost?: Cost) => {
  const resolvedCost = cost ?? Cost.Simple(0);
  return {
    cost: vi.fn(() => resolvedCost),
    registerEffectTrigger: vi.fn(),
  } as unknown as SharedGameState;
};

const createCardInfo = (name: string, cost: Cost): CardInfo => ({
  name,
  text: 'Test card text',
  font_size: 'small',
  cost: cost.toCommonCost(),
  types: [CardType.ACTION],
  expansion: Expansion.TESTING,
  mechanics: [],
});

const createCard = (name: string, id: string, cost = Cost.Simple(0)): Card => {
  const card = new TestCard(createSharedGameStateMock(cost), createCardInfo(name, cost));
  card.setId(id);
  return card;
};

const createBroadcaster = () => {
  return {
    updateSharedCards: vi.fn(),
    updatePlayerCards: vi.fn(),
  } as unknown as GameMessageBroadcaster;
};

const createPlayer = (name = 'Alice') => {
  return {
    getName: vi.fn(() => name),
  } as never;
};

describe('OrderedStack', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns and removes the top card from the end of the stack', () => {
    const copper = createCard('Copper', 'copper-id');
    const silver = createCard('Silver', 'silver-id');
    const stack = new TestOrderedStack(CardCollection.fromCards([copper, silver]));

    expect(stack.getTopCard()).toBe(silver);
    expect(stack.removeTopCard()).toBe(silver);
    expect(stack.getTopCard()).toBe(copper);
    expect(stack.broadcastCount).toBe(1);
  });

  it('throws when removing the top card from an empty stack', () => {
    const stack = new TestOrderedStack();

    expect(() => stack.removeTopCard()).toThrow('Error: trying to get top card of empty stack');
  });

  it('updates the location for every card in the stack', () => {
    const copper = createCard('Copper', 'copper-id');
    const silver = createCard('Silver', 'silver-id');
    const stack = new TestOrderedStack(CardCollection.fromCards([copper, silver]));

    stack.updateLocationForAll(CardLocation.HAND);

    expect(copper.getLocation()).toBe(CardLocation.HAND);
    expect(silver.getLocation()).toBe(CardLocation.HAND);
  });

  it('inserts cards at a specific position and broadcasts the change', () => {
    const copper = createCard('Copper', 'copper-id');
    const gold = createCard('Gold', 'gold-id');
    const silver = createCard('Silver', 'silver-id');
    const stack = new TestOrderedStack(CardCollection.fromCards([copper, gold]));

    stack.insertCardAtPosition(silver, 1);

    expect(stack.toCardNameArray()).toEqual(['Copper', 'Silver', 'Gold']);
    expect(stack.broadcastCount).toBe(1);
  });

  it('shuffles using Math.random and broadcasts once', () => {
    const copper = createCard('Copper', 'copper-id');
    const silver = createCard('Silver', 'silver-id');
    const gold = createCard('Gold', 'gold-id');
    const stack = new TestOrderedStack(CardCollection.fromCards([copper, silver, gold]));
    const randomSpy = vi
      .spyOn(Math, 'random')
      .mockReturnValueOnce(0.6)
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9);

    stack.shuffle();

    expect(stack.toCardNameArray()).toEqual(['Gold', 'Copper', 'Silver']);
    expect(stack.broadcastCount).toBe(1);
    expect(randomSpy).toHaveBeenCalledTimes(3);
  });
});

describe('CardCollectionSignal', () => {
  it('broadcasts for mutating operations and forceBroadcast', () => {
    const copper = createCard('Copper', 'copper-id');
    const signal = new TestCardCollectionSignal();

    signal.addCard(copper);
    signal.clear();
    signal.forceBroadcast();

    expect(signal.broadcastCount).toBe(3);
  });

  it('does not broadcast removeCard when no card is removed', () => {
    const signal = new TestCardCollectionSignal(CardCollection.fromCards([createCard('Copper', 'copper-id')]));

    const removed = signal.removeCard(createCard('Silver', 'silver-id'));

    expect(removed).toBeUndefined();
    expect(signal.broadcastCount).toBe(0);
  });

  it('does not broadcast removeCards when the collection size does not change', () => {
    const signal = new TestCardCollectionSignal(CardCollection.fromCards([createCard('Copper', 'copper-id')]));

    signal.removeCards(CardCollection.emptyCollection());

    expect(signal.broadcastCount).toBe(0);
    expect(signal.toCardNameArray()).toEqual(['Copper']);
  });
});

describe('Shared stack wrappers', () => {
  it('SharedOrderedStack broadcasts shared-card updates with its configured visibility', () => {
    const broadcaster = createBroadcaster();
    const stack = new SharedOrderedStack(
      CardLocation.DECK,
      broadcaster,
      PrivacyType.TOP_CARD_VISIBLE_TO_ALL,
      CardCollection.fromCards([createCard('Copper', 'copper-id')]),
    );

    stack.addCard(createCard('Silver', 'silver-id'));

    expect((broadcaster.updateSharedCards as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([
      CardLocation.DECK,
      PrivacyType.TOP_CARD_VISIBLE_TO_ALL,
      stack,
    ]);
  });

  it('SharedUnorderedCardCollection broadcasts when its contents change', () => {
    const broadcaster = createBroadcaster();
    const collection = new SharedUnorderedCardCollection(
      CardLocation.REVEAL_LIMBO,
      broadcaster,
      PrivacyType.ALL_VISIBLE,
    );

    collection.addCard(createCard('Copper', 'copper-id'));
    collection.clear();

    expect(broadcaster.updateSharedCards).toHaveBeenCalledTimes(2);
    expect((broadcaster.updateSharedCards as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([
      CardLocation.REVEAL_LIMBO,
      PrivacyType.ALL_VISIBLE,
      collection,
    ]);
  });

  it('Trash uses the trash location and all-visible privacy when broadcasting', () => {
    const broadcaster = createBroadcaster();
    const trash = new Trash(broadcaster);

    trash.addCard(createCard('Copper', 'copper-id'));

    expect((broadcaster.updateSharedCards as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual([
      CardLocation.TRASH,
      PrivacyType.ALL_VISIBLE,
      trash,
    ]);
  });

  it('OwnedOrderedStack broadcasts player-card updates instead of shared-card updates', () => {
    const broadcaster = createBroadcaster();
    const owner = createPlayer();
    const stack = new OwnedOrderedStack(owner, CardLocation.DECK, broadcaster, PrivacyType.SIZE_VISIBLE_TO_ALL);

    stack.addCard(createCard('Copper', 'copper-id'));

    expect(broadcaster.updatePlayerCards).toHaveBeenCalledWith(
      owner,
      CardLocation.DECK,
      PrivacyType.SIZE_VISIBLE_TO_ALL,
      stack,
    );
    expect(broadcaster.updateSharedCards).not.toHaveBeenCalled();
  });

  it('OwnedUnorderedCardCollection broadcasts player-card updates for owned areas', () => {
    const broadcaster = createBroadcaster();
    const owner = createPlayer();
    const collection = new OwnedUnorderedCardCollection(
      owner,
      CardLocation.HAND,
      broadcaster,
      PrivacyType.SIZE_VISIBLE_TO_OPPONENTS,
    );

    collection.addCard(createCard('Copper', 'copper-id'));

    expect(broadcaster.updatePlayerCards).toHaveBeenCalledWith(
      owner,
      CardLocation.HAND,
      PrivacyType.SIZE_VISIBLE_TO_OPPONENTS,
      collection,
    );
    expect(broadcaster.updateSharedCards).not.toHaveBeenCalled();
  });

  it('player-area wrappers preserve their configured locations and privacy modes', () => {
    const broadcaster = createBroadcaster();
    const owner = createPlayer();

    new Deck(owner, broadcaster).addCard(createCard('Copper', 'copper-id'));
    new Discard(owner, broadcaster).addCard(createCard('Silver', 'silver-id'));
    new Hand(owner, broadcaster).addCard(createCard('Gold', 'gold-id'));
    new InPlay(owner, broadcaster).addCard(createCard('Village', 'village-id'));

    expect((broadcaster.updatePlayerCards as ReturnType<typeof vi.fn>).mock.calls).toEqual([
      [owner, CardLocation.DECK, PrivacyType.SIZE_VISIBLE_TO_ALL, expect.any(Deck)],
      [owner, CardLocation.DISCARD, PrivacyType.TOP_CARD_VISIBLE_TO_ALL, expect.any(Discard)],
      [owner, CardLocation.HAND, PrivacyType.SIZE_VISIBLE_TO_OPPONENTS, expect.any(Hand)],
      [owner, CardLocation.IN_PLAY, PrivacyType.ALL_VISIBLE, expect.any(InPlay)],
    ]);
  });
});
