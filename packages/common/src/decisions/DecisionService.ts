import { CardSelectionPurpose } from './CardSelectionPurpose';
import {
  CardChoice,
  EffectChoice,
  EndActionPhaseChoice,
  EndBuyPhaseChoice,
  EndTreasurePhaseChoice,
  EndTurnChoice,
  ExtraTurnChoice,
  MultiCardChoice,
  MultiNamedChoice,
  NamedChoice,
  NoneChoice,
  SimpleTreasuresChoice,
} from './Choice';

export interface DecisionService {
  chooseCards(
    prompt: string,
    selectionType: CardSelectionPurpose,
    decisionName: string,
    numSelectedEligibility: number[],
    cardChoices: CardChoice[],
  ): Promise<MultiCardChoice>;

  chooseCard(
    prompt: string,
    selectionType: CardSelectionPurpose,
    decisionName: string,
    cardChoices: CardChoice[],
    noneChoice?: NoneChoice,
  ): Promise<CardChoice | NoneChoice>;

  chooseOneOption(prompt: string, decisionName: string, namedChoices: NamedChoice[]): Promise<NamedChoice>;

  chooseMultipleOptions(
    prompt: string,
    decisionName: string,
    choices: NamedChoice[],
    numToSelect: number,
  ): Promise<MultiNamedChoice>;

  chooseFromMultipleEvents(
    extraMessage: string,
    optionalEffects: EffectChoice[],
    mandatoryEffects: EffectChoice[],
  ): Promise<EffectChoice | NoneChoice>;

  chooseExtraTurns(extraTurns: ExtraTurnChoice[]): Promise<ExtraTurnChoice>;

  makeActionPhaseChoice(cardChoices: CardChoice[]): Promise<CardChoice | EndActionPhaseChoice | EndTurnChoice>;

  makeTreasurePhaseChoice(
    cardChoices: CardChoice[],
    simpleTreasuresOption: SimpleTreasuresChoice | undefined,
  ): Promise<CardChoice | SimpleTreasuresChoice | EndTreasurePhaseChoice | EndBuyPhaseChoice | EndTurnChoice>;

  makeBuyPhaseChoice(
    cardChoices: CardChoice[],
    numBuys: number,
    numCoins: number,
  ): Promise<CardChoice | EndBuyPhaseChoice | EndTurnChoice>;
}
