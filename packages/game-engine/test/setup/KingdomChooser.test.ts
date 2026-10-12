import { CardInfoLookup } from '@dominion/card-info';
import { CardLocation, CardType, Expansion } from '@dominion/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardFactory } from '../../src/card/CardFactory';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { convertToClassName } from '../../src/NameUtils';
import { KingdomChooser } from '../../src/setup/KingdomChooser';
import { PileSpecification } from '../../src/setup/PileSpecification';
import { GameStateSetupRule, SetupRuleType } from '../../src/setup/SetupRule';
import { SetupRules } from '../../src/setup/SetupRules';
import { createTestClock } from '../testClock';

const createFakeCardFactory = (setupRulesByName: Record<string, SetupRules> = {}) => {
  const createCard = vi.fn((name: string, id: string, _location: CardLocation) => {
    const setupRules = setupRulesByName[name] ?? new SetupRules();
    return {
      getPileName: () => name,
      getId: () => id,
      getSetupRules: () => setupRules,
    };
  });
  return { cardFactory: { createCard } as unknown as CardFactory, createCard };
};

const createGameStateRule = (): GameStateSetupRule => ({
  setupRuleType: SetupRuleType.GAME_STATE,
  applySetupRule: vi.fn(),
});

const setupRulesWith = (...rules: GameStateSetupRule[]): SetupRules => {
  const setupRules = new SetupRules();
  for (const rule of rules) {
    setupRules.add(rule);
  }
  return setupRules;
};

const anyKingdomPile = () => new PileSpecification({}, true, true);

const sharedGameState = {} as SharedGameState;

describe('KingdomChooser', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sanitizes required card names and returns them first', () => {
    const { cardFactory, createCard } = createFakeCardFactory();
    const chooser = new KingdomChooser(cardFactory, ['Village!', 'Smithy']);

    const first = chooser.getNextKingdomRandomizer();
    const second = chooser.getNextKingdomRandomizer();

    expect(first?.getPileName()).toBe('Smithy');
    expect(second?.getPileName()).toBe('Village');
    expect(createCard).toHaveBeenCalledWith('Village', 'Village-randomizer', CardLocation.PILE);
    expect(createCard).toHaveBeenCalledWith('Smithy', 'Smithy-randomizer', CardLocation.PILE);
  });

  it('converts required card names with spaces and apostrophes to card class names', () => {
    const { cardFactory, createCard } = createFakeCardFactory();

    new KingdomChooser(cardFactory, ["King's Court", 'Bandit Camp']);

    expect(createCard).toHaveBeenCalledWith('KingsCourt', 'KingsCourt-randomizer', CardLocation.PILE);
    expect(createCard).toHaveBeenCalledWith('BanditCamp', 'BanditCamp-randomizer', CardLocation.PILE);
  });

  it('returns undefined when no randomizer matches the pile specification', () => {
    const { cardFactory, createCard } = createFakeCardFactory();
    const chooser = new KingdomChooser(cardFactory, []);

    const result = chooser.selectMatchingRandomizer(
      new PileSpecification({ requiredExpansions: [Expansion.BASE], requiredTypes: [CardType.RUINS] }),
    );

    expect(result).toBeUndefined();
    expect(createCard).not.toHaveBeenCalled();
  });

  it('creates a randomizer for a card matching the pile specification', () => {
    const { cardFactory } = createFakeCardFactory();
    const matchingClassNames = new Map(
      CardInfoLookup.getKingdomCardNames().map((name) => [convertToClassName(name), name] as const),
    );

    // a chooser never selects the same card twice, so each attempt uses a fresh one
    for (let attempt = 0; attempt < 10; attempt++) {
      const chooser = new KingdomChooser(cardFactory, []);
      const randomizer = chooser.selectMatchingRandomizer(
        new PileSpecification({
          requiredExpansions: [Expansion.BASE],
          requiredCoinCosts: [5],
          requiredTypes: [CardType.ATTACK],
        }),
      );

      const cardInfo = CardInfoLookup.lookUpCardInfo(matchingClassNames.get(randomizer!.getPileName())!);
      expect(cardInfo.expansion).toBe(Expansion.BASE);
      expect(cardInfo.cost.coins).toBe(5);
      expect(cardInfo.types).toContain(CardType.ATTACK);
    }
  });

  it('chooses random kingdom randomizers once the required cards are used up', () => {
    const { cardFactory } = createFakeCardFactory();
    const chooser = new KingdomChooser(cardFactory, ['Village']);
    const kingdomClassNames = new Set(CardInfoLookup.getKingdomCardNames().map(convertToClassName));

    expect(chooser.getNextKingdomRandomizer()?.getPileName()).toBe('Village');
    const randomRandomizer = chooser.getNextKingdomRandomizer();

    expect(randomRandomizer).toBeDefined();
    expect(kingdomClassNames.has(randomRandomizer!.getPileName())).toBe(true);
  });

  it('has more kingdom cards until ten kingdom randomizers have been generated', () => {
    const { cardFactory } = createFakeCardFactory();
    const chooser = new KingdomChooser(cardFactory, ['Village', 'Smithy']);

    for (let index = 0; index < 10; index++) {
      expect(chooser.hasMoreKingdomCards()).toBe(true);
      expect(chooser.getNextKingdomRandomizer()).toBeDefined();
    }

    expect(chooser.hasMoreKingdomCards()).toBe(false);
  });

  it('does not count extra piles chosen by pile specification as kingdom cards', () => {
    const { cardFactory } = createFakeCardFactory();
    const chooser = new KingdomChooser(cardFactory, []);

    for (let index = 0; index < 9; index++) {
      chooser.getNextKingdomRandomizer();
    }
    chooser.selectMatchingRandomizer(anyKingdomPile());
    chooser.selectMatchingRandomizer(anyKingdomPile());

    expect(chooser.hasMoreKingdomCards()).toBe(true);
    chooser.getNextKingdomRandomizer();
    expect(chooser.hasMoreKingdomCards()).toBe(false);
  });

  it('computes the proportion of kingdom randomizers from an expansion', () => {
    const cardFactory = new CardFactory({ registerEffectTrigger: vi.fn(), ...createTestClock() } as unknown as SharedGameState);
    const chooser = new KingdomChooser(cardFactory, ['Village', 'Hermit', 'Urchin', 'Smithy']);

    for (let index = 0; index < 4; index++) {
      chooser.getNextKingdomRandomizer();
    }

    expect(chooser.getProportionFromExpansion(Expansion.DARK_AGES)).toBe(0.5);
    expect(chooser.getProportionFromExpansion(Expansion.BASE)).toBe(0.5);
    expect(chooser.getProportionFromExpansion(Expansion.PROSPERITY)).toBe(0);
  });

  it('never chooses a card that is already in the kingdom', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const firstCandidate = CardInfoLookup.findMatchingRandomizerName()!;
    const { cardFactory } = createFakeCardFactory();
    const chooser = new KingdomChooser(cardFactory, [firstCandidate]);

    const pileNames: string[] = [];
    while (chooser.hasMoreKingdomCards()) {
      const randomizer = chooser.getNextKingdomRandomizer();
      if (randomizer === undefined) {
        break;
      }
      pileNames.push(randomizer.getPileName());
    }

    expect(pileNames).toHaveLength(10);
    expect(new Set(pileNames).size).toBe(10);
  });

  it('does not choose an extra pile that is already in the kingdom', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const firstCandidate = CardInfoLookup.findMatchingRandomizerName()!;
    const { cardFactory } = createFakeCardFactory();
    const chooser = new KingdomChooser(cardFactory, [firstCandidate]);
    chooser.getNextKingdomRandomizer();

    const extraPileRandomizer = chooser.selectMatchingRandomizer(anyKingdomPile());

    expect(extraPileRandomizer?.getPileName()).not.toBe(convertToClassName(firstCandidate));
  });

  it('applies the game-state setup rules of every generated randomizer, including extra piles', () => {
    const villageRule = createGameStateRule();
    const smithyRule = createGameStateRule();
    const createdRandomizers: Card[] = [];
    const createdRules: GameStateSetupRule[] = [];
    const createCard = vi.fn((name: string) => {
      let setupRules: SetupRules;
      if (name === 'Village') {
        setupRules = setupRulesWith(villageRule);
      } else if (name === 'Smithy') {
        setupRules = setupRulesWith(smithyRule);
      } else {
        const rule = createGameStateRule();
        createdRules.push(rule);
        setupRules = setupRulesWith(rule);
      }
      const randomizer = { getPileName: () => name, getSetupRules: () => setupRules } as unknown as Card;
      createdRandomizers.push(randomizer);
      return randomizer;
    });
    const chooser = new KingdomChooser({ createCard } as unknown as CardFactory, ['Village', 'Smithy']);
    chooser.getNextKingdomRandomizer();
    chooser.getNextKingdomRandomizer();
    chooser.selectMatchingRandomizer(anyKingdomPile());

    chooser.applyGameStateSetupRules(sharedGameState);

    expect(createdRules).toHaveLength(1);
    expect(villageRule.applySetupRule).toHaveBeenCalledWith(sharedGameState);
    expect(smithyRule.applySetupRule).toHaveBeenCalledWith(sharedGameState);
    expect(createdRules[0].applySetupRule).toHaveBeenCalledWith(sharedGameState);
  });

  it('keeps applying game-state setup rules after a randomizer that has none', () => {
    const smithyRule = createGameStateRule();
    const { cardFactory } = createFakeCardFactory({ Smithy: setupRulesWith(smithyRule) });
    const chooser = new KingdomChooser(cardFactory, ['Smithy', 'Village']);
    const firstRandomizer = chooser.getNextKingdomRandomizer();
    chooser.getNextKingdomRandomizer();

    chooser.applyGameStateSetupRules(sharedGameState);

    expect(firstRandomizer?.getSetupRules().hasAnyGameStateSetupRules()).toBe(false);
    expect(smithyRule.applySetupRule).toHaveBeenCalledWith(sharedGameState);
  });
});
