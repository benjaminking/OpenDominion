import { describe, expect, it } from 'vitest';

import { CardLocation, CardType } from '../../src/card';
import {
  CardChoice,
  ChoiceType,
  EffectChoice,
  EndTurnChoice,
  ExtraTurnChoice,
  isCardChoice,
  isEffectChoice,
  isEndActionPhaseChoice,
  isEndBuyPhaseChoice,
  isEndTreasurePhaseChoice,
  isEndTurnChoice,
  isExtraTurnChoice,
  isMultiCardChoice,
  isMultiNamedChoice,
  isNamedChoice,
  isNoneChoice,
  isSimpleTreasuresChoice,
  MultiCardChoice,
  MultiNamedChoice,
  NamedChoice,
  NoneChoice,
  SimpleTreasuresChoice,
} from '../../src/decisions/Choice';

const sampleCard = {
  id: 'village-id',
  name: 'Village',
  types: [CardType.ACTION],
  location: CardLocation.HAND,
  cost: {
    coins: 3,
    debt: 0,
    potions: 0,
  },
};

describe('Choice type guards', () => {
  it('returns true for matching typed choices', () => {
    const noneChoice: NoneChoice = { type: ChoiceType.None };
    const cardChoice: CardChoice = { type: ChoiceType.Card, card: sampleCard };
    const effectChoice: EffectChoice = { type: ChoiceType.Effect, effectName: 'Gain', effectId: 'gain-1' };
    const multiCardChoice: MultiCardChoice = { type: ChoiceType.MultiCard, cards: [sampleCard] };
    const namedChoice: NamedChoice = { type: ChoiceType.ChooseOne, name: 'Option A' };
    const multiNamedChoice: MultiNamedChoice = { type: ChoiceType.ChooseMultiple, names: ['A', 'B'] };
    const simpleTreasuresChoice: SimpleTreasuresChoice = { type: ChoiceType.SimpleTreasures, coins: 4 };
    const extraTurnChoice: ExtraTurnChoice = { type: ChoiceType.ExtraTurn, card: sampleCard, name: 'Outpost' };

    expect(isNoneChoice(noneChoice)).toBe(true);
    expect(isCardChoice(cardChoice)).toBe(true);
    expect(isEffectChoice(effectChoice)).toBe(true);
    expect(isMultiCardChoice(multiCardChoice)).toBe(true);
    expect(isNamedChoice(namedChoice)).toBe(true);
    expect(isMultiNamedChoice(multiNamedChoice)).toBe(true);
    expect(isSimpleTreasuresChoice(simpleTreasuresChoice)).toBe(true);
    expect(isEndActionPhaseChoice({ type: ChoiceType.EndActionPhase })).toBe(true);
    expect(isEndTreasurePhaseChoice({ type: ChoiceType.EndTreasurePhase })).toBe(true);
    expect(isEndBuyPhaseChoice({ type: ChoiceType.EndBuyPhase })).toBe(true);
    expect(isEndTurnChoice({ type: ChoiceType.EndTurn })).toBe(true);
    expect(isExtraTurnChoice(extraTurnChoice)).toBe(true);
  });

  it('returns false for non-matching choice types', () => {
    const endTurnChoice: EndTurnChoice = { type: ChoiceType.EndTurn };

    expect(isNoneChoice(endTurnChoice)).toBe(false);
    expect(isCardChoice(endTurnChoice)).toBe(false);
    expect(isEffectChoice(endTurnChoice)).toBe(false);
    expect(isMultiCardChoice(endTurnChoice)).toBe(false);
    expect(isNamedChoice(endTurnChoice)).toBe(false);
    expect(isMultiNamedChoice(endTurnChoice)).toBe(false);
    expect(isSimpleTreasuresChoice(endTurnChoice)).toBe(false);
    expect(isEndActionPhaseChoice(endTurnChoice)).toBe(false);
    expect(isEndTreasurePhaseChoice(endTurnChoice)).toBe(false);
    expect(isEndBuyPhaseChoice(endTurnChoice)).toBe(false);
    expect(isExtraTurnChoice(endTurnChoice)).toBe(false);
  });
});
