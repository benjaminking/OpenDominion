import '@angular/compiler';
import { runInInjectionContext, signal } from '@angular/core';
import { CardLocation, CardType, ChoiceType, type CardMetadata } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { DecisionDialogComponent } from '../src/app/decisions/decision-dialog.component';
import { DecisionManagerService } from '../src/app/decisions/decision-manager.service';
import { DecisionType } from '../src/app/decisions/DecisionType';
import { createAngularTestInjector } from './angular-test-utils';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.SET_ASIDE,
    types: [CardType.ACTION],
    cost: { coins: 4 },
  };
}

class FakeDecisionManagerService {
  readonly currentDecision = signal<any>(undefined);
  readonly resolveDecisionWithOption = vi.fn();
  readonly resolveDecisionWithOptions = vi.fn();
  readonly resolveDecisionWithEffect = vi.fn();
  readonly resolveDecisionWithExtraTurn = vi.fn();
}

function createComponent() {
  const decisionManager = new FakeDecisionManagerService();
  const { injector, effectScheduler } = createAngularTestInjector([
    { provide: DecisionManagerService, useValue: decisionManager },
  ]);
  const component = runInInjectionContext(injector, () => new DecisionDialogComponent());

  return { component, decisionManager, effectScheduler };
}

describe('DecisionDialogComponent', () => {
  it('handles choose-one and choose-multiple decision flows', () => {
    const { component, decisionManager, effectScheduler } = createComponent();

    decisionManager.currentDecision.set({
      type: DecisionType.CHOOSE_ONE_OPTION,
      prompt: 'Choose one',
      namedChoices: [{ type: ChoiceType.ChooseOne, name: 'Gold' }],
    });

    expect(component.isDialogChoiceActive()).toBe(true);
    expect(component.isChooseOne()).toBe(true);
    expect(component.prompt()).toBe('Choose one');
    expect(component.chooseOneOptions()).toEqual([{ type: ChoiceType.ChooseOne, name: 'Gold' }]);

    component.selectOption({ type: ChoiceType.ChooseOne, name: 'Gold' });
    expect(decisionManager.resolveDecisionWithOption).toHaveBeenCalledWith('Gold');

    decisionManager.currentDecision.set({
      type: DecisionType.CHOOSE_MULTIPLE_OPTIONS,
      prompt: 'Choose two',
      namedChoices: [
        { type: ChoiceType.ChooseOne, name: 'Silver' },
        { type: ChoiceType.ChooseOne, name: 'Gold' },
      ],
      numToSelect: 2,
    });
    effectScheduler.flush();

    expect(component.isChooseMultiple()).toBe(true);
    expect(component.areCorrectNumberOfBoxesChecked()).toBe(false);

    component.onCheckboxChange('Silver', { target: { checked: true } } as unknown as Event);
    component.onCheckboxChange('Gold', { target: { checked: true } } as unknown as Event);

    expect(component.areCorrectNumberOfBoxesChecked()).toBe(true);
    component.submitOptions();
    expect(decisionManager.resolveDecisionWithOptions).toHaveBeenCalledWith(['Silver', 'Gold']);
  });

  it('exposes effect and extra-turn choices and delegates their selections', () => {
    const { component, decisionManager } = createComponent();
    const mission = createCard('Mission', 'mission-1');

    decisionManager.currentDecision.set({
      type: DecisionType.CHOOSE_EFFECT,
      prompt: 'Choose effect',
      extraMessage: 'Resolve one effect',
      optionalEffects: [{ type: ChoiceType.Effect, effectName: 'Trash', effectId: 'effect-1' }],
      mandatoryEffects: [{ type: ChoiceType.Effect, effectName: 'Gain', effectId: 'effect-2' }],
    });

    expect(component.isChooseEffect()).toBe(true);
    expect(component.hasOptionalEffects()).toBe(true);
    expect(component.optionalEffects()).toEqual([
      { type: ChoiceType.Effect, effectName: 'Trash', effectId: 'effect-1' },
    ]);
    expect(component.mandatoryEffects()).toEqual([
      { type: ChoiceType.Effect, effectName: 'Gain', effectId: 'effect-2' },
    ]);

    component.selectEffect({ type: ChoiceType.Effect, effectName: 'Trash', effectId: 'effect-1' });
    expect(decisionManager.resolveDecisionWithEffect).toHaveBeenCalledWith('Trash', 'effect-1');

    decisionManager.currentDecision.set({
      type: DecisionType.CHOOSE_EXTRA_TURN,
      prompt: 'Choose extra turn',
      choices: [{ type: ChoiceType.ExtraTurn, card: mission, name: 'Mission' }],
    });

    expect(component.extraTurns()).toEqual([{ type: ChoiceType.ExtraTurn, card: mission, name: 'Mission' }]);
    component.selectExtraTurn({ type: ChoiceType.ExtraTurn, card: mission, name: 'Mission' });
    expect(decisionManager.resolveDecisionWithExtraTurn).toHaveBeenCalledWith(mission, 'Mission');
  });
});
