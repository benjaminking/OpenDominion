import '@angular/compiler';
import {
  Injector,
  runInInjectionContext,
  signal,
  ɵChangeDetectionScheduler as ChangeDetectionScheduler,
  ɵEffectScheduler as EffectScheduler,
} from '@angular/core';
import { ChoiceType, StatusAction } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { DecisionType } from '../src/app/decisions/DecisionType';
import { DecisionManagerService } from '../src/app/decisions/decision-manager.service';
import { MessageDecoderService } from '../src/app/message-decoder.service';
import { ControlsComponent } from '../src/app/players/controls.component';

class FakeMessageDecoderService {
  statusCallback?: (content: { status: string; action: StatusAction }) => void;

  subscribeToStatus(callback: (content: { status: string; action: StatusAction }) => void): void {
    this.statusCallback = callback;
  }

  subscribeToStatisticUpdate(): void {}
}

class FakeDecisionManagerService {
  readonly currentDecision = signal<any>(undefined);
  readonly resolveDecisionWithEndTurn = vi.fn();
  readonly resolveDecisionWithSimpleTreasures = vi.fn();
  readonly resolveDecisionWithEndActionPhase = vi.fn();
  readonly resolveDecisionWithEndBuyPhase = vi.fn();
  readonly resolveDecisionWithCards = vi.fn();
  readonly resetSelectedCards = vi.fn();
  readonly isCorrectNumberOfCardsSelected = vi.fn(() => false);
}

function createComponent() {
  const decoder = new FakeMessageDecoderService();
  const decisionManager = new FakeDecisionManagerService();
  const injector = Injector.create({
    providers: [
      {
        provide: ChangeDetectionScheduler,
        useValue: {
          notify: () => {},
          runningTick: false,
        },
      },
      {
        provide: EffectScheduler,
        useValue: {
          add: () => {},
          schedule: () => {},
          flush: () => {},
          remove: () => {},
        },
      },
      { provide: MessageDecoderService, useValue: decoder },
      { provide: DecisionManagerService, useValue: decisionManager },
    ],
  });

  const component = runInInjectionContext(injector, () => new ControlsComponent());

  return { component, decoder, decisionManager };
}

describe('ControlsComponent', () => {
  it('maintains the status stack and lets the current decision prompt override it', () => {
    const { component, decoder, decisionManager } = createComponent();

    expect(component.status()).toBe('');

    decoder.statusCallback?.({ status: 'Waiting for players', action: StatusAction.PUSH });
    expect(component.status()).toBe('Waiting for players');

    decoder.statusCallback?.({ status: 'Choose a card', action: StatusAction.PUSH });
    expect(component.status()).toBe('Choose a card');

    decoder.statusCallback?.({ status: 'Choose a treasure', action: StatusAction.REPLACE });
    expect(component.status()).toBe('Choose a treasure');

    decoder.statusCallback?.({ status: '', action: StatusAction.POP });
    expect(component.status()).toBe('Waiting for players');

    decisionManager.currentDecision.set({
      type: DecisionType.CHOOSE_ONE_OPTION,
      prompt: 'Resolve the effect',
      namedChoices: [],
    });

    expect(component.status()).toBe('Resolve the effect');
  });

  it('derives phase state from the current decision and delegates control actions', () => {
    const { component, decisionManager } = createComponent();

    decisionManager.currentDecision.set({
      type: DecisionType.ACTION_PHASE_CHOICE,
      prompt: 'Play an action',
      selectionType: 'play',
      eligibleCardIds: new Set(['village-1']),
    });
    expect(component.canEndTurn()).toBe(true);
    expect(component.isActionPhase()).toBe(true);
    expect(component.isTreasurePhase()).toBe(false);
    expect(component.isBuyPhase()).toBe(false);
    component.endTurn();
    component.endActionPhase();
    expect(decisionManager.resolveDecisionWithEndTurn).toHaveBeenCalledTimes(1);
    expect(decisionManager.resolveDecisionWithEndActionPhase).toHaveBeenCalledTimes(1);

    decisionManager.currentDecision.set({
      type: DecisionType.TREASURE_PHASE_CHOICE,
      prompt: 'Play treasures',
      selectionType: 'play',
      eligibleCardIds: new Set(['silver-1']),
      simpleTreasuresChoice: { type: ChoiceType.SimpleTreasures, coins: 4 },
    });
    expect(component.isTreasurePhase()).toBe(true);
    expect(component.canPlaySimpleTreasures()).toBe(true);
    expect(component.simpleTreasureCoins()).toBe(4);
    component.makeSimpleTreasureChoice();
    expect(decisionManager.resolveDecisionWithSimpleTreasures).toHaveBeenCalledTimes(1);

    decisionManager.currentDecision.set({
      type: DecisionType.BUY_PHASE_CHOICE,
      prompt: 'Buy a card',
      selectionType: 'play',
      eligibleCardIds: new Set(['gold-1']),
    });
    expect(component.isBuyPhase()).toBe(true);
    component.endBuyPhase();
    expect(decisionManager.resolveDecisionWithEndBuyPhase).toHaveBeenCalledTimes(1);

    decisionManager.isCorrectNumberOfCardsSelected.mockReturnValue(true);
    decisionManager.currentDecision.set({
      type: DecisionType.CHOOSE_CARDS,
      prompt: 'Choose cards',
      selectionType: 'gain',
      eligibleCardIds: new Set(['estate-1']),
      numSelectedEligibility: [1],
    });
    expect(component.isInMultiSelection()).toBe(true);
    expect(component.isCorrectNumberOfCardsSelected()).toBe(true);
    component.completeSelection();
    component.undoSelection();
    expect(decisionManager.resolveDecisionWithCards).toHaveBeenCalledTimes(1);
    expect(decisionManager.resetSelectedCards).toHaveBeenCalledTimes(1);
  });
});
