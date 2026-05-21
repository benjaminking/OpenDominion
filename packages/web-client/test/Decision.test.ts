import { CardSelectionPurpose, ChoiceType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import {
  isActionPhaseDecision,
  isBuyPhaseDecision,
  isChooseCardDecision,
  isChooseCardsDecision,
  isChooseEffectDecision,
  isChooseExtraTurnDecision,
  isChooseMultipleOptionsDecision,
  isChooseOneOptionDecision,
  isTreasurePhaseDecision,
} from '../src/app/decisions/Decision';
import { DecisionType } from '../src/app/decisions/DecisionType';

describe('Decision type guards', () => {
  it('identify their matching decision types and reject undefined or different decisions', () => {
    const chooseCardDecision = {
      type: DecisionType.CHOOSE_CARD,
      prompt: 'Choose a card',
      selectionType: CardSelectionPurpose.GAIN,
      eligibleCardIds: new Set(['c1']),
      noneChoice: { type: ChoiceType.None },
    };
    const chooseCardsDecision = {
      type: DecisionType.CHOOSE_CARDS,
      prompt: 'Choose cards',
      selectionType: CardSelectionPurpose.GAIN,
      eligibleCardIds: new Set(['c1']),
      numSelectedEligibility: [1, 2],
    };
    const chooseOneDecision = {
      type: DecisionType.CHOOSE_ONE_OPTION,
      prompt: 'Choose one',
      namedChoices: [{ type: ChoiceType.ChooseOne, name: 'Gold' }],
    };
    const chooseMultipleDecision = {
      type: DecisionType.CHOOSE_MULTIPLE_OPTIONS,
      prompt: 'Choose multiple',
      namedChoices: [{ type: ChoiceType.ChooseOne, name: 'Gold' }],
      numToSelect: 2,
    };
    const chooseEffectDecision = {
      type: DecisionType.CHOOSE_EFFECT,
      prompt: 'Choose effect',
      extraMessage: 'Extra',
      optionalEffects: [],
      mandatoryEffects: [],
    };
    const chooseExtraTurnDecision = {
      type: DecisionType.CHOOSE_EXTRA_TURN,
      prompt: 'Choose extra turn',
      choices: [],
    };
    const actionPhaseDecision = {
      type: DecisionType.ACTION_PHASE_CHOICE,
      prompt: 'Play a card',
      selectionType: CardSelectionPurpose.PLAY,
      eligibleCardIds: new Set(['c1']),
    };
    const treasurePhaseDecision = {
      type: DecisionType.TREASURE_PHASE_CHOICE,
      prompt: 'Play treasures',
      selectionType: CardSelectionPurpose.PLAY,
      eligibleCardIds: new Set(['c1']),
      simpleTreasuresChoice: { type: ChoiceType.SimpleTreasures, coins: 3 },
    };
    const buyPhaseDecision = {
      type: DecisionType.BUY_PHASE_CHOICE,
      prompt: 'Buy a card',
      selectionType: CardSelectionPurpose.PLAY,
      eligibleCardIds: new Set(['c1']),
    };

    expect(isChooseCardDecision(chooseCardDecision)).toBe(true);
    expect(isChooseCardsDecision(chooseCardsDecision)).toBe(true);
    expect(isChooseOneOptionDecision(chooseOneDecision)).toBe(true);
    expect(isChooseMultipleOptionsDecision(chooseMultipleDecision)).toBe(true);
    expect(isChooseEffectDecision(chooseEffectDecision)).toBe(true);
    expect(isChooseExtraTurnDecision(chooseExtraTurnDecision)).toBe(true);
    expect(isActionPhaseDecision(actionPhaseDecision)).toBe(true);
    expect(isTreasurePhaseDecision(treasurePhaseDecision)).toBe(true);
    expect(isBuyPhaseDecision(buyPhaseDecision)).toBe(true);

    expect(isChooseCardDecision(undefined)).toBe(false);
    expect(isChooseCardsDecision(chooseCardDecision)).toBe(false);
    expect(isChooseOneOptionDecision(chooseEffectDecision)).toBe(false);
    expect(isChooseMultipleOptionsDecision(chooseOneDecision)).toBe(false);
    expect(isChooseEffectDecision(actionPhaseDecision)).toBe(false);
    expect(isChooseExtraTurnDecision(buyPhaseDecision)).toBe(false);
    expect(isActionPhaseDecision(treasurePhaseDecision)).toBe(false);
    expect(isTreasurePhaseDecision(actionPhaseDecision)).toBe(false);
    expect(isBuyPhaseDecision(chooseCardsDecision)).toBe(false);
  });
});
