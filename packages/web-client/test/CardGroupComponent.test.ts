import '@angular/compiler';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { CardLocation, CardSelectionPurpose, CardType, type CardMetadata } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { CardGroupComponent } from '../src/app/cards/card-group.component';
import { DecisionType } from '../src/app/decisions/DecisionType';
import { DecisionManagerService } from '../src/app/decisions/decision-manager.service';
import { setInputSignalValue } from './angular-test-utils';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.HAND,
    types: [CardType.ACTION],
    cost: { coins: 3 },
  };
}

class FakeDecisionManagerService {
  readonly currentDecision = signal<any>(undefined);
  readonly resolveDecisionWithCard = vi.fn();
  readonly addSelectedCard = vi.fn();
}

function createComponent() {
  const decisionManager = new FakeDecisionManagerService();
  const injector = Injector.create({
    providers: [{ provide: DecisionManagerService, useValue: decisionManager }],
  });
  const component = runInInjectionContext(injector, () => new CardGroupComponent());
  const village = createCard('Village', 'village-1');
  const smithy = createCard('Smithy', 'smithy-1');

  setInputSignalValue(component.cards as () => CardMetadata[], [village, smithy]);
  setInputSignalValue(component.count as () => number, 2);

  return { component, decisionManager, village, smithy };
}

describe('CardGroupComponent', () => {
  it('computes name and selection state from the current decision', () => {
    const { component, decisionManager } = createComponent();

    expect(component.cardname()).toBe('Village');
    expect(component.fileName()).toBe('village');
    expect(component.isSelectable()).toBe(false);

    decisionManager.currentDecision.set({
      type: DecisionType.CHOOSE_CARD,
      prompt: 'Choose a card',
      selectionType: CardSelectionPurpose.GAIN,
      eligibleCardIds: new Set(['village-1']),
    });

    expect(component.isSelectable()).toBe(true);
    expect(component.isSelectionType(CardSelectionPurpose.GAIN)).toBe(true);
    expect(component.isMultiSelection()).toBe(false);
  });

  it('resolves the first card immediately for single-card decisions', () => {
    const { component, decisionManager, village } = createComponent();

    decisionManager.currentDecision.set({
      type: DecisionType.ACTION_PHASE_CHOICE,
      prompt: 'Play an action',
      selectionType: CardSelectionPurpose.PLAY,
      eligibleCardIds: new Set(['village-1']),
    });

    component.processClick();

    expect(decisionManager.resolveDecisionWithCard).toHaveBeenCalledTimes(1);
    expect(decisionManager.resolveDecisionWithCard).toHaveBeenCalledWith(village);
  });

  it('tracks multi-selection progress and resets the visual count when the reset callback runs', () => {
    const { component, decisionManager, village, smithy } = createComponent();

    decisionManager.currentDecision.set({
      type: DecisionType.CHOOSE_CARDS,
      prompt: 'Choose cards',
      selectionType: CardSelectionPurpose.GAIN,
      eligibleCardIds: new Set(['village-1', 'smithy-1']),
      numSelectedEligibility: [1, 2],
    });

    component.processClick();
    component.processClick();

    expect(component.isMultiSelection()).toBe(true);
    expect(component.selectedcount()).toBe(2);
    expect(decisionManager.addSelectedCard.mock.calls[0][0]).toBe(village);
    expect(decisionManager.addSelectedCard.mock.calls[1][0]).toBe(smithy);

    const resetSelectedCount = decisionManager.addSelectedCard.mock.calls[1][1] as () => void;
    resetSelectedCount();

    expect(component.selectedcount()).toBe(0);
  });
});
