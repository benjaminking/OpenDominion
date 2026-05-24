import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { MessageDecoderService } from '../message-decoder.service';

import {
  CardChoice,
  CardLocation,
  CardMetadata,
  CardSelectionPurpose,
  ChoiceType,
  EffectChoice,
  ExtraTurnChoice,
  MultiCardChoice,
  NamedChoice,
  NoneChoice,
  SimpleTreasuresChoice,
} from '@dominion/common';
import {
  ActionPhaseDecision,
  BuyPhaseDecision,
  ChooseCardDecision,
  ChooseCardsDecision,
  ChooseEffectDecision,
  ChooseExtraTurnDecision,
  ChooseMultipleOptionsDecision,
  ChooseOneOptionDecision,
  Decision,
  isChooseCardsDecision,
  TreasurePhaseDecision,
} from './Decision';
import { DecisionType } from './DecisionType';
import { MessageWriterService } from '../message-writer.service';
import { MultiNamedChoice } from '@dominion/common';
import { ViewName } from '../view-names';
import { ViewVisibilityService } from '../view-visibility.service';

@Injectable({ providedIn: 'root' })
export class DecisionManagerService {
  private readonly webSocketMessageDecoder = inject(MessageDecoderService);
  private readonly webSocketMessageWriter = inject(MessageWriterService);
  private readonly viewVisibilityService = inject(ViewVisibilityService);
  private selectedCards: CardMetadata[] = [];
  private resetSubscribers: Array<() => void> = [];

  private decisionStack: WritableSignal<Decision[]> = signal([]);
  currentDecision: Signal<Decision | undefined> = computed(() => {
    const decisionStack = this.decisionStack();
    return this.decisionStack().length > 0 ? this.decisionStack()[this.decisionStack().length - 1] : undefined;
  });

  constructor() {
    this.webSocketMessageDecoder.subscribeToChooseCardMessage(this.initiateChooseCardDecision.bind(this));
    this.webSocketMessageDecoder.subscribeToChooseCardsMessage(this.initiateChooseCardsDecision.bind(this));
    this.webSocketMessageDecoder.subscribeToChooseOneOptionMessage(this.initiateChooseOneOptionDecision.bind(this));
    this.webSocketMessageDecoder.subscribeToChooseMultipleOptionsMessage(
      this.initiateChooseMultipleOptionsDecision.bind(this),
    );
    this.webSocketMessageDecoder.subscribeToChooseEffectMessage(this.initiateChooseEffectDecision.bind(this));
    this.webSocketMessageDecoder.subscribeToChooseExtraTurnMessage(this.initiateChooseExtraTurnDecision.bind(this));
    this.webSocketMessageDecoder.subscribeToActionPhaseChoiceMessage(this.initiateActionPhaseDecision.bind(this));
    this.webSocketMessageDecoder.subscribeToTreasurePhaseChoiceMessage(this.initiateTreasurePhaseDecision.bind(this));
    this.webSocketMessageDecoder.subscribeToBuyPhaseChoiceMessage(this.initiateBuyPhaseDecision.bind(this));
  }

  private initiateChooseCardDecision(chooseCardContent: {
    prompt: string;
    selectionType: CardSelectionPurpose;
    cardChoices: CardChoice[];
    noneChoice?: NoneChoice;
  }): void {
    this.enableNecessaryViewsForCardChoices(chooseCardContent.cardChoices);
    this.addNewDecision({
      ...chooseCardContent,
      type: DecisionType.CHOOSE_CARD,
      eligibleCardIds: this.getEligibleCardIds(chooseCardContent.cardChoices),
    } as ChooseCardDecision);
  }

  private initiateChooseCardsDecision(chooseCardsContent: {
    prompt: string;
    selectionType: CardSelectionPurpose;
    numSelectedEligibility: number[];
    cardChoices: CardChoice[];
  }): void {
    this.resetSubscribers = [];
    this.addNewDecision({
      ...chooseCardsContent,
      type: DecisionType.CHOOSE_CARDS,
      eligibleCardIds: this.getEligibleCardIds(chooseCardsContent.cardChoices),
    } as ChooseCardsDecision);
  }

  private initiateChooseOneOptionDecision(chooseOneOptionContent: {
    prompt: string;
    namedChoices: NamedChoice[];
  }): void {
    this.addNewDecision({
      ...chooseOneOptionContent,
      type: DecisionType.CHOOSE_ONE_OPTION,
    } as ChooseOneOptionDecision);
  }

  private initiateChooseMultipleOptionsDecision(chooseMultipleOptionsContent: {
    prompt: string;
    namedChoices: NamedChoice[];
    numToSelect: number;
  }): void {
    this.addNewDecision({
      ...chooseMultipleOptionsContent,
      type: DecisionType.CHOOSE_MULTIPLE_OPTIONS,
    } as ChooseMultipleOptionsDecision);
  }

  private initiateChooseEffectDecision(chooseEffectContent: {
    extraMessage: string;
    optionalEffects: EffectChoice[];
    mandatoryEffects: EffectChoice[];
  }): void {
    this.addNewDecision({
      ...chooseEffectContent,
      type: DecisionType.CHOOSE_EFFECT,
      prompt: 'You may choose an effect to resolve',
    } as ChooseEffectDecision);
  }

  private initiateChooseExtraTurnDecision(chooseExtraTurnContent: { choices: ExtraTurnChoice[] }): void {
    this.addNewDecision({
      ...chooseExtraTurnContent,
      type: DecisionType.CHOOSE_EXTRA_TURN,
      prompt: 'Choose an extra turn to happen next',
    } as ChooseExtraTurnDecision);
  }

  private initiateActionPhaseDecision(actionPhaseContent: { cardChoices: CardChoice[] }): void {
    this.addNewDecision({
      ...actionPhaseContent,
      type: DecisionType.ACTION_PHASE_CHOICE,
      selectionType: CardSelectionPurpose.PLAY,
      prompt: 'You may play a card',
      eligibleCardIds: this.getEligibleCardIds(actionPhaseContent.cardChoices),
    } as ActionPhaseDecision);
  }

  private initiateTreasurePhaseDecision(treasurePhaseContent: {
    cardChoices: CardChoice[];
    simpleTreasuresChoice?: SimpleTreasuresChoice;
  }): void {
    this.addNewDecision({
      ...treasurePhaseContent,
      type: DecisionType.TREASURE_PHASE_CHOICE,
      selectionType: CardSelectionPurpose.PLAY,
      prompt: 'You may play any number of Treasure cards',
      eligibleCardIds: this.getEligibleCardIds(treasurePhaseContent.cardChoices),
    } as TreasurePhaseDecision);
  }

  private initiateBuyPhaseDecision(buyPhaseContent: { cardChoices: CardChoice[] }): void {
    this.addNewDecision({
      ...buyPhaseContent,
      type: DecisionType.BUY_PHASE_CHOICE,
      selectionType: CardSelectionPurpose.PLAY,
      prompt: 'You may play or buy a card',
      eligibleCardIds: this.getEligibleCardIds(buyPhaseContent.cardChoices),
    } as BuyPhaseDecision);
  }

  private addNewDecision(decision: Decision): void {
    this.decisionStack.update((previousValue: Decision[]) => [...previousValue, decision]);
  }

  private getEligibleCardIds(cardChoices: CardChoice[]): Set<string> {
    const eligibleCardIds: Set<string> = new Set();
    for (const cardChoice of cardChoices) {
      eligibleCardIds.add(cardChoice.card.id);
    }
    return eligibleCardIds;
  }

  private enableNecessaryViewsForCardChoices(cardChoices: CardChoice[]): void {
    for (const cardChoice of cardChoices) {
      if (cardChoice.card.location === CardLocation.REVEAL_LIMBO) {
        this.viewVisibilityService.toggleViewByName(ViewName.REVEALED_LIMBO);
      } else if (cardChoice.card.location === CardLocation.SET_ASIDE) {
        this.viewVisibilityService.toggleViewByName(ViewName.SET_ASIDE);
      } else if (cardChoice.card.location === CardLocation.TRASH) {
        this.viewVisibilityService.toggleViewByName(ViewName.TRASH);
      } else if (cardChoice.card.location === CardLocation.DISCARD) {
        this.viewVisibilityService.toggleViewByName(ViewName.DISCARD);
      }
    }
  }

  public resolveDecisionWithCard(card: CardMetadata): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.Card,
      card: card,
    } as CardChoice);
  }

  public resolveDecisionWithCards(): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.MultiCard,
      cards: this.selectedCards,
    } as MultiCardChoice);
    this.resetSelectedCards();
  }

  public resolveDecisionWithNone(): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.None,
    });
  }

  public resolveDecisionWithEffect(name: string, id: string): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.Effect,
      effectName: name,
      effectId: id,
    } as EffectChoice);
  }

  public resolveDecisionWithOption(name: string): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.ChooseOne,
      name: name,
    } as NamedChoice);
  }

  public resolveDecisionWithOptions(names: string[]): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.ChooseMultiple,
      names: names,
    } as MultiNamedChoice);
  }

  public resolveDecisionWithSimpleTreasures(): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.SimpleTreasures,
    });
  }

  public resolveDecisionWithEndActionPhase(): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.EndActionPhase,
    });
  }

  public resolveDecisionWithEndTreasurePhase(): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.EndTreasurePhase,
    });
  }

  public resolveDecisionWithEndBuyPhase(): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.EndBuyPhase,
    });
  }

  public resolveDecisionWithEndTurn(): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.EndTurn,
    });
  }

  public resolveDecisionWithExtraTurn(card: CardMetadata, name: string): void {
    this.webSocketMessageWriter.sendChoice({
      type: ChoiceType.ExtraTurn,
      name: name,
      card: card,
    } as ExtraTurnChoice);
  }

  public addSelectedCard(card: CardMetadata, resetCallback: () => void): void {
    this.selectedCards.push(card);
    this.resetSubscribers.push(resetCallback);
  }

  public isCorrectNumberOfCardsSelected(): boolean {
    const decision = this.currentDecision();
    if (decision !== undefined && isChooseCardsDecision(decision)) {
      return decision.numSelectedEligibility.includes(this.selectedCards.length);
    }
    return false;
  }

  public resetSelectedCards(): void {
    this.selectedCards = [];
    for (const callback of this.resetSubscribers) {
      callback();
    }
  }
}
