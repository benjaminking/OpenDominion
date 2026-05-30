import { Injector, runInInjectionContext, signal, type Signal, type WritableSignal } from '@angular/core';
import {
  CardLocation,
  CardSelectionPurpose,
  CardType,
  ChoiceType,
  type CardChoice,
  type CardMetadata,
} from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { DecisionManagerService } from '../src/app/decisions/decision-manager.service';
import { isActionPhaseDecision, isChooseCardsDecision, isTreasurePhaseDecision } from '../src/app/decisions/Decision';
import { DecisionType } from '../src/app/decisions/DecisionType';
import { MessageDecoderService } from '../src/app/message-decoder.service';
import { MessageWriterService } from '../src/app/message-writer.service';
import { ViewVisibilityService } from '../src/app/view-visibility.service';
import { ViewName } from '../src/app/view-names';

class FakeViewVisibilityService {
  private readonly visibilityByViewName: Record<ViewName, WritableSignal<boolean>> = {
    [ViewName.REVEALED_LIMBO]: signal(false),
    [ViewName.SET_ASIDE]: signal(false),
    [ViewName.TRASH]: signal(false),
    [ViewName.DISCARD]: signal(false),
  };

  getViewVisibilitySignal(viewName: ViewName): Signal<boolean> {
    return this.visibilityByViewName[viewName];
  }

  toggleViewByName(viewName: ViewName): void {
    this.visibilityByViewName[viewName].set(!this.visibilityByViewName[viewName]());
  }

  enableViewByName(viewName: ViewName): void {
    this.visibilityByViewName[viewName].set(true);
  }

  disableViewByName(viewName: ViewName): void {
    this.visibilityByViewName[viewName].set(false);
  }
}

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.HAND,
    types: [CardType.ACTION],
    cost: { coins: 3 },
  };
}

function createCardChoice(card: CardMetadata): CardChoice {
  return {
    type: ChoiceType.Card,
    card,
  };
}

class FakeMessageDecoderService {
  chooseCardCallback?: (content: {
    prompt: string;
    selectionType: CardSelectionPurpose;
    cardChoices: CardChoice[];
    noneChoice?: { type: ChoiceType.None };
  }) => void;
  chooseCardsCallback?: (content: {
    prompt: string;
    selectionType: CardSelectionPurpose;
    numSelectedEligibility: number[];
    cardChoices: CardChoice[];
  }) => void;
  chooseOneOptionCallback?: (content: {
    prompt: string;
    namedChoices: { type: ChoiceType.ChooseOne; name: string }[];
  }) => void;
  chooseMultipleOptionsCallback?: (content: {
    prompt: string;
    namedChoices: { type: ChoiceType.ChooseOne; name: string }[];
    numToSelect: number;
  }) => void;
  chooseEffectCallback?: (content: {
    extraMessage: string;
    optionalEffects: { type: ChoiceType.Effect; effectName: string; effectId: string }[];
    mandatoryEffects: { type: ChoiceType.Effect; effectName: string; effectId: string }[];
  }) => void;
  chooseExtraTurnCallback?: (content: {
    choices: { type: ChoiceType.ExtraTurn; card: CardMetadata; name: string }[];
  }) => void;
  actionPhaseCallback?: (content: { cardChoices: CardChoice[] }) => void;
  treasurePhaseCallback?: (content: {
    cardChoices: CardChoice[];
    simpleTreasuresChoice?: { type: ChoiceType.SimpleTreasures };
  }) => void;
  buyPhaseCallback?: (content: { cardChoices: CardChoice[] }) => void;

  subscribeToChooseCardMessage(callback: FakeMessageDecoderService['chooseCardCallback']): void {
    this.chooseCardCallback = callback;
  }

  subscribeToChooseCardsMessage(callback: FakeMessageDecoderService['chooseCardsCallback']): void {
    this.chooseCardsCallback = callback;
  }

  subscribeToChooseOneOptionMessage(callback: FakeMessageDecoderService['chooseOneOptionCallback']): void {
    this.chooseOneOptionCallback = callback;
  }

  subscribeToChooseMultipleOptionsMessage(callback: FakeMessageDecoderService['chooseMultipleOptionsCallback']): void {
    this.chooseMultipleOptionsCallback = callback;
  }

  subscribeToChooseEffectMessage(callback: FakeMessageDecoderService['chooseEffectCallback']): void {
    this.chooseEffectCallback = callback;
  }

  subscribeToChooseExtraTurnMessage(callback: FakeMessageDecoderService['chooseExtraTurnCallback']): void {
    this.chooseExtraTurnCallback = callback;
  }

  subscribeToActionPhaseChoiceMessage(callback: FakeMessageDecoderService['actionPhaseCallback']): void {
    this.actionPhaseCallback = callback;
  }

  subscribeToTreasurePhaseChoiceMessage(callback: FakeMessageDecoderService['treasurePhaseCallback']): void {
    this.treasurePhaseCallback = callback;
  }

  subscribeToBuyPhaseChoiceMessage(callback: FakeMessageDecoderService['buyPhaseCallback']): void {
    this.buyPhaseCallback = callback;
  }
}

function createService() {
  const decoder = new FakeMessageDecoderService();
  const writer = {
    sendChoice: vi.fn(),
  };
  const viewVisibilityService = new FakeViewVisibilityService();
  const injector = Injector.create({
    providers: [
      { provide: MessageDecoderService, useValue: decoder },
      { provide: MessageWriterService, useValue: writer },
      { provide: ViewVisibilityService, useValue: viewVisibilityService },
    ],
  });

  const service = runInInjectionContext(injector, () => new DecisionManagerService());

  return { service, decoder, writer, viewVisibilityService };
}

describe('DecisionManagerService', () => {
  it('builds choose-cards decisions from decoder messages and tracks selection eligibility', () => {
    const { service, decoder } = createService();
    const silver = createCard('Silver', 'silver-1');
    const gold = createCard('Gold', 'gold-1');

    decoder.chooseCardsCallback?.({
      prompt: 'Choose cards to gain',
      selectionType: CardSelectionPurpose.GAIN,
      numSelectedEligibility: [1, 2],
      cardChoices: [createCardChoice(silver), createCardChoice(gold)],
    });

    const decision = service.currentDecision();

    expect(isChooseCardsDecision(decision)).toBe(true);
    if (decision !== undefined && isChooseCardsDecision(decision)) {
      expect(decision.prompt).toBe('Choose cards to gain');
      expect(decision.type).toBe(DecisionType.CHOOSE_CARDS);
      expect(decision.selectionType).toBe(CardSelectionPurpose.GAIN);
      expect([...decision.eligibleCardIds]).toEqual(['silver-1', 'gold-1']);
      expect(decision.numSelectedEligibility).toEqual([1, 2]);
    }

    expect(service.isCorrectNumberOfCardsSelected()).toBe(false);

    service.addSelectedCard(silver, vi.fn());
    expect(service.isCorrectNumberOfCardsSelected()).toBe(true);

    service.addSelectedCard(gold, vi.fn());
    expect(service.isCorrectNumberOfCardsSelected()).toBe(true);
  });

  it('sends selected cards and runs reset callbacks when resolving a multi-card decision', () => {
    const { service, decoder, writer } = createService();
    const silver = createCard('Silver', 'silver-1');
    const gold = createCard('Gold', 'gold-1');
    const resetSilver = vi.fn();
    const resetGold = vi.fn();

    decoder.chooseCardsCallback?.({
      prompt: 'Choose cards',
      selectionType: CardSelectionPurpose.GAIN,
      numSelectedEligibility: [2],
      cardChoices: [createCardChoice(silver), createCardChoice(gold)],
    });
    service.addSelectedCard(silver, resetSilver);
    service.addSelectedCard(gold, resetGold);

    service.resolveDecisionWithCards();

    expect(writer.sendChoice).toHaveBeenCalledWith({
      type: ChoiceType.MultiCard,
      cards: [silver, gold],
    });
    expect(resetSilver).toHaveBeenCalledTimes(1);
    expect(resetGold).toHaveBeenCalledTimes(1);
    expect(service.isCorrectNumberOfCardsSelected()).toBe(false);
  });

  it('maps public resolution helpers to the correct outbound choice payloads', () => {
    const { service, writer } = createService();
    const village = createCard('Village', 'village-1');

    service.resolveDecisionWithCard(village);
    service.resolveDecisionWithNone();
    service.resolveDecisionWithEffect('Trash a card', 'effect-1');
    service.resolveDecisionWithOption('Gold');
    service.resolveDecisionWithOptions(['Silver', 'Gold']);
    service.resolveDecisionWithSimpleTreasures();
    service.resolveDecisionWithEndActionPhase();
    service.resolveDecisionWithEndTreasurePhase();
    service.resolveDecisionWithEndBuyPhase();
    service.resolveDecisionWithEndTurn();
    service.resolveDecisionWithExtraTurn(village, 'Outpost');

    expect(writer.sendChoice.mock.calls).toEqual([
      [{ type: ChoiceType.Card, card: village }],
      [{ type: ChoiceType.None }],
      [{ type: ChoiceType.Effect, effectName: 'Trash a card', effectId: 'effect-1' }],
      [{ type: ChoiceType.ChooseOne, name: 'Gold' }],
      [{ type: ChoiceType.ChooseMultiple, names: ['Silver', 'Gold'] }],
      [{ type: ChoiceType.SimpleTreasures }],
      [{ type: ChoiceType.EndActionPhase }],
      [{ type: ChoiceType.EndTreasurePhase }],
      [{ type: ChoiceType.EndBuyPhase }],
      [{ type: ChoiceType.EndTurn }],
      [{ type: ChoiceType.ExtraTurn, name: 'Outpost', card: village }],
    ]);
  });

  it('resets selected cards explicitly and clears selection-dependent validity', () => {
    const { service, decoder } = createService();
    const silver = createCard('Silver', 'silver-1');
    const resetSelection = vi.fn();

    decoder.chooseCardsCallback?.({
      prompt: 'Choose cards',
      selectionType: CardSelectionPurpose.GAIN,
      numSelectedEligibility: [1],
      cardChoices: [createCardChoice(silver)],
    });
    service.addSelectedCard(silver, resetSelection);
    expect(service.isCorrectNumberOfCardsSelected()).toBe(true);

    service.resetSelectedCards();

    expect(resetSelection).toHaveBeenCalledTimes(1);
    expect(service.isCorrectNumberOfCardsSelected()).toBe(false);
  });

  it('builds action and treasure phase decisions with their default prompts and eligible cards', () => {
    const { service, decoder } = createService();
    const silver = createCard('Silver', 'silver-1');
    const gold = createCard('Gold', 'gold-1');

    decoder.actionPhaseCallback?.({ cardChoices: [createCardChoice(silver)] });
    let decision = service.currentDecision();
    expect(isActionPhaseDecision(decision)).toBe(true);
    if (decision !== undefined && isActionPhaseDecision(decision)) {
      expect(decision.prompt).toBe('You may play a card');
      expect(decision.selectionType).toBe(CardSelectionPurpose.PLAY);
      expect([...decision.eligibleCardIds]).toEqual(['silver-1']);
    }

    decoder.treasurePhaseCallback?.({
      cardChoices: [createCardChoice(silver), createCardChoice(gold)],
      simpleTreasuresChoice: { type: ChoiceType.SimpleTreasures },
    });
    decision = service.currentDecision();
    expect(isTreasurePhaseDecision(decision)).toBe(true);
    if (decision !== undefined && isTreasurePhaseDecision(decision)) {
      expect(decision.prompt).toBe('You may play any number of Treasure cards');
      expect(decision.selectionType).toBe(CardSelectionPurpose.PLAY);
      expect([...decision.eligibleCardIds]).toEqual(['silver-1', 'gold-1']);
      expect(decision.simpleTreasuresChoice).toEqual({ type: ChoiceType.SimpleTreasures });
    }
  });

  it('opens special location views when choose-card decisions target those locations', () => {
    const { decoder, service, viewVisibilityService } = createService();

    decoder.chooseCardCallback?.({
      prompt: 'Choose a revealed card',
      selectionType: CardSelectionPurpose.GAIN,
      cardChoices: [createCardChoice({ ...createCard('Imp', 'imp-1'), location: CardLocation.REVEAL_LIMBO })],
    });
    expect(viewVisibilityService.getViewVisibilitySignal(ViewName.REVEALED_LIMBO)()).toBe(true);
    expect(service.currentDecision()?.type).toBe(DecisionType.CHOOSE_CARD);

    decoder.chooseCardCallback?.({
      prompt: 'Choose from set aside',
      selectionType: CardSelectionPurpose.GAIN,
      cardChoices: [createCardChoice({ ...createCard('Horse', 'horse-1'), location: CardLocation.SET_ASIDE })],
    });
    expect(viewVisibilityService.getViewVisibilitySignal(ViewName.SET_ASIDE)()).toBe(true);

    decoder.chooseCardCallback?.({
      prompt: 'Choose from trash',
      selectionType: CardSelectionPurpose.GAIN,
      cardChoices: [createCardChoice({ ...createCard('Copper', 'copper-1'), location: CardLocation.TRASH })],
    });
    expect(viewVisibilityService.getViewVisibilitySignal(ViewName.TRASH)()).toBe(true);

    decoder.chooseCardCallback?.({
      prompt: 'Choose from discard',
      selectionType: CardSelectionPurpose.GAIN,
      cardChoices: [createCardChoice({ ...createCard('Silver', 'silver-1'), location: CardLocation.DISCARD })],
    });
    expect(viewVisibilityService.getViewVisibilitySignal(ViewName.DISCARD)()).toBe(true);
  });
});
