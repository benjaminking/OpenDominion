import {
  CardSelectionPurpose,
  EffectChoice,
  ExtraTurnChoice,
  NamedChoice,
  NoneChoice,
  SimpleTreasuresChoice,
} from '@dominion/common';
import { DecisionType } from './DecisionType';

export interface Decision {
  type: DecisionType;
  prompt: string;
}

export interface CardDecision extends Decision {
  selectionType: CardSelectionPurpose;
}

export interface ChooseCardDecision extends CardDecision {
  type: DecisionType.CHOOSE_CARD;
  eligibleCardIds: Set<string>;
  noneChoice?: NoneChoice;
}

export function isChooseCardDecision(decision: Decision | undefined): decision is ChooseCardDecision {
  return decision !== undefined && decision.type === DecisionType.CHOOSE_CARD;
}

export interface ChooseCardsDecision extends CardDecision {
  type: DecisionType.CHOOSE_CARDS;
  eligibleCardIds: Set<string>;
  numSelectedEligibility: number[];
}

export function isChooseCardsDecision(decision: Decision | undefined): decision is ChooseCardsDecision {
  return decision !== undefined && decision.type === DecisionType.CHOOSE_CARDS;
}

export interface ChooseOneOptionDecision extends Decision {
  type: DecisionType.CHOOSE_ONE_OPTION;
  namedChoices: NamedChoice[];
}

export function isChooseOneOptionDecision(decision: Decision | undefined): decision is ChooseOneOptionDecision {
  return decision !== undefined && decision.type === DecisionType.CHOOSE_ONE_OPTION;
}

export interface ChooseMultipleOptionsDecision extends Decision {
  type: DecisionType.CHOOSE_MULTIPLE_OPTIONS;
  namedChoices: NamedChoice[];
  numToSelect: number;
}

export function isChooseMultipleOptionsDecision(
  decision: Decision | undefined,
): decision is ChooseMultipleOptionsDecision {
  return decision !== undefined && decision.type === DecisionType.CHOOSE_MULTIPLE_OPTIONS;
}

export interface ChooseEffectDecision extends Decision {
  type: DecisionType.CHOOSE_EFFECT;
  extraMessage: string;
  optionalEffects: EffectChoice[];
  mandatoryEffects: EffectChoice[];
}

export function isChooseEffectDecision(decision: Decision | undefined): decision is ChooseEffectDecision {
  return decision !== undefined && decision.type === DecisionType.CHOOSE_EFFECT;
}

export interface ChooseExtraTurnDecision extends Decision {
  type: DecisionType.CHOOSE_EXTRA_TURN;
  choices: ExtraTurnChoice[];
}

export function isChooseExtraTurnDecision(decision: Decision | undefined): decision is ChooseExtraTurnDecision {
  return decision !== undefined && decision.type === DecisionType.CHOOSE_EXTRA_TURN;
}

export interface ActionPhaseDecision extends Decision {
  type: DecisionType.ACTION_PHASE_CHOICE;
  eligibleCardIds: Set<string>;
  selectionType: CardSelectionPurpose.PLAY;
}

export function isActionPhaseDecision(decision: Decision | undefined): decision is ActionPhaseDecision {
  return decision !== undefined && decision.type === DecisionType.ACTION_PHASE_CHOICE;
}

export interface TreasurePhaseDecision extends Decision {
  type: DecisionType.TREASURE_PHASE_CHOICE;
  eligibleCardIds: Set<string>;
  simpleTreasuresChoice?: SimpleTreasuresChoice;
  selectionType: CardSelectionPurpose.PLAY;
}

export function isTreasurePhaseDecision(decision: Decision | undefined): decision is TreasurePhaseDecision {
  return decision !== undefined && decision.type === DecisionType.TREASURE_PHASE_CHOICE;
}

export interface BuyPhaseDecision extends Decision {
  type: DecisionType.BUY_PHASE_CHOICE;
  eligibleCardIds: Set<string>;
  selectionType: CardSelectionPurpose.PLAY;
}

export function isBuyPhaseDecision(decision: Decision | undefined): decision is BuyPhaseDecision {
  return decision !== undefined && decision.type === DecisionType.BUY_PHASE_CHOICE;
}
