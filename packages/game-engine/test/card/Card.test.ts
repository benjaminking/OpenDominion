import { CardInfo, CardLocation, CardType, Expansion, Mechanic } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { Cost } from '../../src/card/Cost';
import { CardEligibilityFunction } from '../../src/CardEligibilityFunction';
import { Effect } from '../../src/effects/Effect';
import { EffectSource } from '../../src/effects/EffectSource';
import { EffectTriggerType } from '../../src/effects/EffectTriggerType';
import { SharedGameState } from '../../src/game-state/SharedGameState';

interface SharedGameStateMock {
  cost: ReturnType<typeof vi.fn>;
  registerEffectTrigger: ReturnType<typeof vi.fn>;
}

class TestCard extends Card {
  public markSimpleTreasureForTest(): void {
    this.markAsSimpleTreasure();
  }

  public setCoinsForTest(value: number): void {
    this.setCoins(value);
  }
}

const createCardInfo = (overrides?: Partial<CardInfo>): CardInfo => ({
  name: "Witch's Hut",
  text: 'Test card text',
  font_size: 'small',
  cost: {
    coins: 5,
    potions: 1,
    debt: 2,
  },
  types: [CardType.ACTION, CardType.DURATION],
  expansion: Expansion.TESTING,
  mechanics: [Mechanic.DEBT],
  ...overrides,
});

const createSharedGameStateMock = (costToReturn?: Cost): SharedGameStateMock => {
  const resolvedCost = costToReturn ?? Cost.Simple(7);
  return {
    cost: vi.fn(() => resolvedCost),
    registerEffectTrigger: vi.fn(),
  };
};

const createCard = (
  overrides?: Partial<CardInfo>,
  sharedGameState?: SharedGameState | SharedGameStateMock,
): TestCard => {
  const gameState = sharedGameState ?? createSharedGameStateMock();
  return new TestCard(gameState as SharedGameState, createCardInfo(overrides));
};

describe('Card', () => {
  it('initializes name-derived fields correctly', () => {
    const card = createCard({ name: "King's Court" });

    expect(card.getName()).toBe("King's Court");
    expect(card.getFilename()).toBe('kings_court');
    expect(card.getClassName()).toBe('KingsCourt');
    expect(card.getPileName()).toBe("King's Court");
  });

  it('initializes default values correctly', () => {
    const card = createCard();

    expect(card.getId()).toBe('default_id');
    expect(card.getLocation()).toBe(CardLocation.PILE);
    expect(card.isSimpleTreasure()).toBe(false);
    expect(card.isSupplyCard()).toBe(false);
    expect(card.getCoins()).toBe(0);
    expect(card.getEffects()).toEqual([]);
    expect(card.canBeDiscardedInCleanup()).toBe(true);
  });

  it('setId updates id and equals compares by id only', () => {
    const cardA = createCard({ name: 'Card A' });
    const cardB = createCard({ name: 'Card B' });

    cardA.setId('same-id');
    cardB.setId('same-id');

    expect(cardA.equals(cardB)).toBe(true);
  });

  it('equals returns false when ids differ', () => {
    const cardA = createCard();
    const cardB = createCard();

    cardA.setId('id-a');
    cardB.setId('id-b');

    expect(cardA.equals(cardB)).toBe(false);
  });

  it('getOriginalCost returns constructor cost while getCost delegates to SharedGameState', () => {
    const delegatedCost = Cost.Simple(11);
    const shared = createSharedGameStateMock(delegatedCost);
    const card = createCard(
      {
        cost: { coins: 3, potions: 1, debt: 4 },
      },
      shared,
    );

    expect(card.getOriginalCost().coins).toBe(3);
    expect(card.getOriginalCost().potions).toBe(1);
    expect(card.getOriginalCost().debt).toBe(4);

    const cost = card.getCost();
    expect(cost).toBe(delegatedCost);
    expect(shared.cost.mock.calls).toContainEqual([card]);
  });

  it('getTypes and hasType reflect the card types', () => {
    const card = createCard({ types: [CardType.TREASURE, CardType.VICTORY] });

    expect(card.getTypes()).toEqual(new Set([CardType.TREASURE, CardType.VICTORY]));
    expect(card.hasType(CardType.TREASURE)).toBe(true);
    expect(card.hasType(CardType.ACTION)).toBe(false);
  });

  it('usesMechanic returns true for included mechanics and false otherwise', () => {
    const card = createCard({ mechanics: [Mechanic.DEBT, Mechanic.COFFERS] });

    expect(card.usesMechanic(Mechanic.DEBT)).toBe(true);
    expect(card.usesMechanic(Mechanic.COFFERS)).toBe(true);
    expect(card.usesMechanic(Mechanic.VILLAGERS)).toBe(false);
  });

  it('usesMechanic returns false when no mechanics are provided', () => {
    const card = createCard({ mechanics: undefined });
    expect(card.usesMechanic(Mechanic.DEBT)).toBe(false);
  });

  it('setLocation updates location', () => {
    const card = createCard();

    card.setLocation(CardLocation.HAND);
    expect(card.getLocation()).toBe(CardLocation.HAND);

    card.setLocation(CardLocation.TRASH);
    expect(card.getLocation()).toBe(CardLocation.TRASH);
  });

  it('markAsSimpleTreasure updates simple treasure state', () => {
    const card = createCard();

    expect(card.isSimpleTreasure()).toBe(false);
    card.markSimpleTreasureForTest();
    expect(card.isSimpleTreasure()).toBe(true);
  });

  it('markAsSupplyCard updates supply card state', () => {
    const card = createCard();

    expect(card.isSupplyCard()).toBe(false);
    card.markAsSupplyCard();
    expect(card.isSupplyCard()).toBe(true);
  });

  it('setCoins updates coins value', () => {
    const card = createCard();

    card.setCoinsForTest(4);
    expect(card.getCoins()).toBe(4);

    card.setCoinsForTest(0);
    expect(card.getCoins()).toBe(0);
  });

  it('addEffect stores effect and registers trigger with SharedGameState', () => {
    const shared = createSharedGameStateMock();
    const card = createCard(undefined, shared);
    const effect = {
      getTrigger: vi.fn(() => EffectTriggerType.BUY_START),
      getSource: vi.fn(() => EffectSource.SELF),
    } as unknown as Effect;

    card.addEffect(effect);

    expect(card.getEffects()).toEqual([effect]);
    expect(shared.registerEffectTrigger.mock.calls).toContainEqual([EffectTriggerType.BUY_START, EffectSource.SELF]);
  });

  it('removeEffectsByType removes matching trigger type and keeps non-matching effects', () => {
    const card = createCard();
    const keepEffect = {
      getTrigger: vi.fn(() => EffectTriggerType.BUY_END),
      getSource: vi.fn(() => EffectSource.SELF),
    } as unknown as Effect;
    const removeEffect = {
      getTrigger: vi.fn(() => EffectTriggerType.BUY_START),
      getSource: vi.fn(() => EffectSource.SELF),
    } as unknown as Effect;

    card.addEffect(keepEffect);
    card.addEffect(removeEffect);
    card.removeEffectsByType(EffectTriggerType.BUY_START);

    expect(card.getEffects()).toEqual([keepEffect]);
  });

  it('removeEffectsByType does nothing when no effects match', () => {
    const card = createCard();
    const effect = {
      getTrigger: vi.fn(() => EffectTriggerType.BUY_END),
      getSource: vi.fn(() => EffectSource.SELF),
    } as unknown as Effect;

    card.addEffect(effect);
    card.removeEffectsByType(EffectTriggerType.BUY_START);

    expect(card.getEffects()).toEqual([effect]);
  });

  it('play resolves without throwing', async () => {
    const card = createCard();
    await expect(card.play(undefined as never)).resolves.toBeUndefined();
  });

  it('score returns 0 by default', () => {
    const card = createCard();
    expect(card.score([])).toBe(0);
  });

  it('markAsUnfinished and markAsFinished toggle cleanup discard eligibility', () => {
    const card = createCard();

    expect(card.canBeDiscardedInCleanup()).toBe(true);

    card.markAsUnfinished();
    expect(card.canBeDiscardedInCleanup()).toBe(false);

    card.markAsFinished();
    expect(card.canBeDiscardedInCleanup()).toBe(true);
  });

  it('matches delegates to CardEligibilityFunction', () => {
    const card = createCard();
    const eligibility = new CardEligibilityFunction((c: Card) => c.getName() === card.getName());

    expect(card.matches(eligibility)).toBe(true);
  });

  it('matches returns false when CardEligibilityFunction does not match', () => {
    const card = createCard();
    const eligibility = new CardEligibilityFunction(() => false);

    expect(card.matches(eligibility)).toBe(false);
  });

  it('getMetadata returns current delegated cost and other state fields', () => {
    const shared = createSharedGameStateMock(Cost.Debt(8, 3));
    const card = createCard(
      {
        name: 'Duchy',
        types: [CardType.VICTORY],
        cost: { coins: 5, potions: 0, debt: 1 },
      },
      shared,
    );
    card.setId('duchy-1');
    card.setLocation(CardLocation.DISCARD);

    const metadata = card.getMetadata();

    expect(metadata).toEqual({
      name: 'Duchy',
      id: 'duchy-1',
      location: CardLocation.DISCARD,
      types: [CardType.VICTORY],
      cost: {
        coins: 8,
        potions: 0,
        debt: 3,
      },
    });
    expect(metadata.cost.coins).not.toBe(card.getOriginalCost().coins);
    expect(shared.cost.mock.calls).toContainEqual([card]);
  });
});
