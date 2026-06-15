import { CardMetadata } from '../card/CardMetadata';

export enum ChoiceType {
  Action = 'Action',
  Card = 'card',
  ChooseOne = 'choose-one',
  ChooseMultiple = 'choose-multiple',
  EndActionPhase = 'End action phase',
  SimpleTreasures = '+$X',
  Effect = 'Effect',
  EndTreasurePhase = 'Buy a card',
  EndBuyPhase = 'End buy phase',
  EndTurn = 'End turn',
  ExtraTurn = 'extra-turn',
  Help = 'Help',
  Kingdom = 'View kingdom', // TODO: these ones should be defined in the client that uses them
  MultiCard = 'multi-card',
  Points = 'Points',
  None = 'None of the above',
  Impossible = 'Impossible',
}

export interface Choice {
  type: ChoiceType;
}

export interface NoneChoice extends Choice {
  type: ChoiceType.None;
}

export function isNoneChoice(choice: Choice): choice is NoneChoice {
  return choice.type === ChoiceType.None;
}

export interface CardChoice extends Choice {
  type: ChoiceType.Card;
  card: CardMetadata;
}

export function isCardChoice(choice: Choice): choice is CardChoice {
  return choice.type === ChoiceType.Card;
}

export interface EffectChoice extends Choice {
  type: ChoiceType.Effect;
  effectName: string;
  effectId: string;
}

export function isEffectChoice(choice: Choice): choice is EffectChoice {
  return choice.type === ChoiceType.Effect;
}

export interface MultiCardChoice extends Choice {
  type: ChoiceType.MultiCard;
  cards: CardMetadata[];
}

export function isMultiCardChoice(choice: Choice): choice is MultiCardChoice {
  return choice.type === ChoiceType.MultiCard;
}

// Used for "choose one" prompts
export interface NamedChoice extends Choice {
  type: ChoiceType.ChooseOne;
  name: string;
}

export function isNamedChoice(choice: Choice): choice is NamedChoice {
  return choice.type === ChoiceType.ChooseOne;
}

export interface MultiNamedChoice extends Choice {
  type: ChoiceType.ChooseMultiple;
  names: string[];
}

export function isMultiNamedChoice(choice: Choice): choice is MultiNamedChoice {
  return choice.type === ChoiceType.ChooseMultiple;
}

export interface SimpleTreasuresChoice extends Choice {
  type: ChoiceType.SimpleTreasures;
  coins: number;
  potions: number;
}

export function isSimpleTreasuresChoice(choice: Choice): choice is SimpleTreasuresChoice {
  return choice.type === ChoiceType.SimpleTreasures;
}

export interface EndActionPhaseChoice extends Choice {
  type: ChoiceType.EndActionPhase;
}

export function isEndActionPhaseChoice(choice: Choice): choice is EndActionPhaseChoice {
  return choice.type === ChoiceType.EndActionPhase;
}

export interface EndTreasurePhaseChoice extends Choice {
  type: ChoiceType.EndTreasurePhase;
}

export function isEndTreasurePhaseChoice(choice: Choice): choice is EndTreasurePhaseChoice {
  return choice.type === ChoiceType.EndTreasurePhase;
}

export interface EndBuyPhaseChoice extends Choice {
  type: ChoiceType.EndBuyPhase;
}

export function isEndBuyPhaseChoice(choice: Choice): choice is EndBuyPhaseChoice {
  return choice.type === ChoiceType.EndBuyPhase;
}

export interface EndTurnChoice extends Choice {
  type: ChoiceType.EndTurn;
}

export function isEndTurnChoice(choice: Choice): choice is EndTurnChoice {
  return choice.type === ChoiceType.EndTurn;
}

export interface ExtraTurnChoice extends Choice {
  type: ChoiceType.ExtraTurn;
  card: CardMetadata;
  name: string;
}

export function isExtraTurnChoice(choice: Choice): choice is ExtraTurnChoice {
  return choice.type === ChoiceType.ExtraTurn;
}

export interface ImpossibleChoice extends Choice {
  type: ChoiceType.Impossible;
}
