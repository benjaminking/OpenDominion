import {
  CardChoice,
  CardSelectionPurpose,
  Choice,
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
import { ChooseMultipleOptionsMessage } from '@dominion/web-client-common';
import { ChooseExtraTurnMessage } from '@dominion/web-client-common';
import { TreasurePhaseChoiceMessage } from '@dominion/web-client-common';
import { BuyPhaseChoiceMessage } from '@dominion/web-client-common';
import { ActionPhaseChoiceMessage } from '@dominion/web-client-common';
import { ChooseEffectMessage } from '@dominion/web-client-common';
import { ChooseOneOptionMessage } from '@dominion/web-client-common';
import { ChooseCardMessage, ChooseCardsMessage, MessageType } from '@dominion/web-client-common';

import { WebSocketMessageDecoder } from './WebSocketMessageDecoder';
import { WebSocketMessageWriter } from './WebSocketMessageWriter';

export class WebSocketDecisionService implements DecisionService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resolutionFunctionStack = new Array<(value: any) => void>();

  constructor(
    private readonly webSocketMessageDecoder: WebSocketMessageDecoder,
    private readonly webSocketMessageWriter: WebSocketMessageWriter,
  ) {
    this.webSocketMessageDecoder.subscribeToChoiceMessage(this.resolveChoice.bind(this));
  }

  chooseCards(
    prompt: string,
    selectionType: CardSelectionPurpose,
    decisionName: string,
    numSelectedEligibility: number[],
    cardChoices: CardChoice[],
  ): Promise<MultiCardChoice> {
    this.webSocketMessageWriter.sendMessage({
      type: MessageType.CHOOSE_CARDS,
      content: {
        prompt: prompt,
        selectionType: selectionType,
        decisionName: decisionName,
        numSelectedEligibility: numSelectedEligibility,
        cardChoices: cardChoices,
      },
    } as ChooseCardsMessage);

    return new Promise<MultiCardChoice>((resolve: (value: MultiCardChoice) => void) => {
      this.resolutionFunctionStack.push(resolve);
    });
  }
  chooseCard(
    prompt: string,
    selectionType: CardSelectionPurpose,
    decisionName: string,
    cardChoices: CardChoice[],
    noneChoice?: NoneChoice,
  ): Promise<CardChoice | NoneChoice> {
    this.webSocketMessageWriter.sendMessage({
      type: MessageType.CHOOSE_CARD,
      content: {
        prompt: prompt,
        selectionType: selectionType,
        decisionName: decisionName,
        cardChoices: cardChoices,
        noneChoice: noneChoice,
      },
    } as ChooseCardMessage);

    return new Promise<CardChoice | NoneChoice>((resolve: (value: CardChoice | NoneChoice) => void) => {
      this.resolutionFunctionStack.push(resolve);
    });
  }
  chooseOneOption(prompt: string, decisionName: string, namedChoices: NamedChoice[]): Promise<NamedChoice> {
    this.webSocketMessageWriter.sendMessage({
      type: MessageType.CHOOSE_ONE_OPTION,
      content: {
        prompt: prompt,
        decisionName: decisionName,
        namedChoices: namedChoices,
      },
    } as ChooseOneOptionMessage);

    return new Promise<NamedChoice>((resolve: (value: NamedChoice) => void) => {
      this.resolutionFunctionStack.push(resolve);
    });
  }
  chooseMultipleOptions(
    prompt: string,
    decisionName: string,
    choices: NamedChoice[],
    numToSelect: number,
  ): Promise<MultiNamedChoice> {
    this.webSocketMessageWriter.sendMessage({
      type: MessageType.CHOOSE_MULTIPLE_OPTIONS,
      content: {
        prompt: prompt,
        decisionName: decisionName,
        namedChoices: choices,
        numToSelect: numToSelect,
      },
    } as ChooseMultipleOptionsMessage);

    return new Promise<MultiNamedChoice>((resolve: (value: MultiNamedChoice) => void) => {
      this.resolutionFunctionStack.push(resolve);
    });
  }
  chooseFromMultipleEvents(
    extraMessage: string,
    optionalEffects: EffectChoice[],
    mandatoryEffects: EffectChoice[],
  ): Promise<EffectChoice | NoneChoice> {
    this.webSocketMessageWriter.sendMessage({
      type: MessageType.CHOOSE_EFFECT,
      content: {
        extraMessage: extraMessage,
        optionalEffects: optionalEffects,
        mandatoryEffects: mandatoryEffects,
      },
    } as ChooseEffectMessage);

    return new Promise<EffectChoice | NoneChoice>((resolve: (value: EffectChoice | NoneChoice) => void) => {
      this.resolutionFunctionStack.push(resolve);
    });
  }
  chooseExtraTurns(extraTurns: ExtraTurnChoice[]): Promise<ExtraTurnChoice> {
    this.webSocketMessageWriter.sendMessage({
      type: MessageType.CHOOSE_EXTRA_TURN,
      content: {
        choices: extraTurns,
      },
    } as ChooseExtraTurnMessage);

    return new Promise<ExtraTurnChoice>((resolve: (value: ExtraTurnChoice) => void) => {
      this.resolutionFunctionStack.push(resolve);
    });
  }
  makeActionPhaseChoice(cardChoices: CardChoice[]): Promise<CardChoice | EndActionPhaseChoice | EndTurnChoice> {
    this.webSocketMessageWriter.sendMessage({
      type: MessageType.ACTION_PHASE_CHOICE,
      content: {
        cardChoices: cardChoices,
      },
    } as ActionPhaseChoiceMessage);

    return new Promise<CardChoice | EndActionPhaseChoice | EndTurnChoice>(
      (resolve: (value: CardChoice | EndActionPhaseChoice | EndTurnChoice) => void) => {
        this.resolutionFunctionStack.push(resolve);
      },
    );
  }
  makeTreasurePhaseChoice(
    cardChoices: CardChoice[],
    simpleTreasuresChoice: SimpleTreasuresChoice | undefined,
  ): Promise<CardChoice | SimpleTreasuresChoice | EndTreasurePhaseChoice | EndBuyPhaseChoice | EndTurnChoice> {
    this.webSocketMessageWriter.sendMessage({
      type: MessageType.TREASURE_PHASE_CHOICE,
      content: {
        cardChoices: cardChoices,
        simpleTreasuresChoice: simpleTreasuresChoice,
      },
    } as TreasurePhaseChoiceMessage);

    return new Promise<CardChoice | SimpleTreasuresChoice | EndTreasurePhaseChoice | EndBuyPhaseChoice | EndTurnChoice>(
      (
        resolve: (
          value: CardChoice | SimpleTreasuresChoice | EndTreasurePhaseChoice | EndBuyPhaseChoice | EndTurnChoice,
        ) => void,
      ) => {
        this.resolutionFunctionStack.push(resolve);
      },
    );
  }
  makeBuyPhaseChoice(
    cardChoices: CardChoice[],
    _numBuys: number,
    _numCoins: number,
    _numPotions: number,
  ): Promise<CardChoice | EndBuyPhaseChoice | EndTurnChoice> {
    this.webSocketMessageWriter.sendMessage({
      type: MessageType.BUY_PHASE_CHOICE,
      content: {
        cardChoices: cardChoices,
      },
    } as BuyPhaseChoiceMessage);

    return new Promise<CardChoice | EndBuyPhaseChoice | EndTurnChoice>(
      (resolve: (value: CardChoice | EndBuyPhaseChoice | EndTurnChoice) => void) => {
        this.resolutionFunctionStack.push(resolve);
      },
    );
  }

  resolveChoice(choice: Choice): void {
    if (this.resolutionFunctionStack.length === 0) {
      throw new Error('Got a web socket response when no decision was pending');
    }
    const resolutionFunction = this.resolutionFunctionStack.pop();
    // TODO: cast this to the expected type
    resolutionFunction!(choice);
  }
}
