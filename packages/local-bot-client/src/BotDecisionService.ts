import { ClientGameState } from '@dominion/client-common';
import {
  CardChoice,
  CardMetadata,
  CardSelectionPurpose,
  ChoiceType,
  DecisionService,
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
} from '@dominion/common';

import { RuleBasedBot } from './RuleBasedBot';

export class BotDecisionService implements DecisionService {
  constructor(
    private readonly clientGameState: ClientGameState,
    private readonly bot: RuleBasedBot,
  ) {
    bot.useGameState(this.clientGameState);
  }

  chooseCards(
    _prompt: string,
    selectionType: CardSelectionPurpose,
    _decisionName: string,
    numSelectedEligibility: number[],
    cardChoices: CardChoice[],
  ): Promise<MultiCardChoice> {
    if (selectionType === CardSelectionPurpose.DISCARD) {
      const minNeeded = Math.min(...numSelectedEligibility);
      const cards: CardMetadata[] = cardChoices.map((cardChoice: CardChoice) => cardChoice.card);
      return Promise.resolve({
        type: ChoiceType.MultiCard,
        cards: cards.slice(0, minNeeded),
      } as MultiCardChoice);
    }
    throw new Error('Method not implemented.');
  }

  chooseCard(
    _prompt: string,
    _selectionType: CardSelectionPurpose,
    _decisionName: string,
    cardChoices: CardChoice[],
    noneChoice?: NoneChoice,
  ): Promise<CardChoice | NoneChoice> {
    const options = noneChoice === undefined ? cardChoices : [...cardChoices, noneChoice];
    return this.chooseRandomOption<CardChoice | NoneChoice>(options);
  }

  private async chooseRandomOption<T>(options: T[]): Promise<T> {
    return Promise.resolve(options[Math.floor(Math.random() * options.length)]);
  }

  chooseOneOption(_prompt: string, _decisionName: string, _namedChoices: NamedChoice[]): Promise<NamedChoice> {
    throw new Error('Method not implemented');
  }

  chooseMultipleOptions(
    _prompt: string,
    _decisionName: string,
    _choices: NamedChoice[],
    _numToSelect: number,
  ): Promise<MultiNamedChoice> {
    throw new Error('Method not implemented');
  }

  chooseFromMultipleEvents(
    _extraMessage: string,
    optionalEffects: EffectChoice[],
    mandatoryEffects: EffectChoice[],
  ): Promise<EffectChoice | NoneChoice> {
    return this.chooseRandomEvent(optionalEffects, mandatoryEffects);
  }

  private async chooseRandomEvent(
    mandatoryEvents: EffectChoice[],
    optionalEvents: EffectChoice[],
  ): Promise<EffectChoice | NoneChoice> {
    if (optionalEvents.length > 0) {
      return Promise.resolve(optionalEvents[Math.floor(Math.random() * optionalEvents.length)]); // pick a random event
    }

    return Promise.resolve(mandatoryEvents[Math.floor(Math.random() * mandatoryEvents.length)]); // pick a random event
  }

  chooseExtraTurns(_extraTurns: ExtraTurnChoice[]): Promise<ExtraTurnChoice> {
    throw new Error('Method not implemented');
  }

  makeActionPhaseChoice(options: CardChoice[]): Promise<CardChoice | EndActionPhaseChoice | EndTurnChoice> {
    return Promise.resolve(this.bot.chooseActionCardToPlay(options));
  }

  makeTreasurePhaseChoice(
    options: CardChoice[],
    simpleTreasuresOption: SimpleTreasuresChoice | undefined,
  ): Promise<CardChoice | SimpleTreasuresChoice | EndTreasurePhaseChoice | EndBuyPhaseChoice | EndTurnChoice> {
    return Promise.resolve(this.bot.chooseTreasureCardToPlay(options, simpleTreasuresOption));
  }

  makeBuyPhaseChoice(
    options: CardChoice[],
    numBuys: number,
    numCoins: number,
  ): Promise<CardChoice | EndBuyPhaseChoice | EndTurnChoice> {
    return Promise.resolve(this.bot.makeBuyPhaseChoice(options, numBuys, numCoins));
  }
}
