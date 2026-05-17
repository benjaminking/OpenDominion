import { Component, computed, effect, inject, input, model, OnInit, signal } from '@angular/core';

import { EffectChoice, ExtraTurnChoice, NamedChoice } from '@dominion/common';
import { DecisionManagerService } from './decision-manager.service';
import {
  isChooseEffectDecision,
  isChooseExtraTurnDecision,
  isChooseMultipleOptionsDecision,
  isChooseOneOptionDecision,
} from './Decision';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ChoiceType } from '@dominion/common';

interface SelectableNamedChoice extends NamedChoice {
  type: ChoiceType.ChooseOne;
  name: string;
  selected: boolean;
}

@Component({
  selector: 'decision-dialog',
  templateUrl: './decision-dialog.component.html',
  styleUrls: ['./decision-dialog.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class DecisionDialogComponent {
  private readonly decisionManager = inject(DecisionManagerService);

  constructor() {
    effect(() => {
      let options: SelectableNamedChoice[] = [];
      const decision = this.decisionManager.currentDecision();
      if (decision === undefined || !isChooseMultipleOptionsDecision(decision)) {
        options = [];
      } else {
        options = decision.namedChoices.map((namedChoice: NamedChoice) => {
          return { ...namedChoice, selected: false } as SelectableNamedChoice;
        });
      }
      this.chooseMultipleOptions = signal<SelectableNamedChoice[]>(options);
    });
  }

  isDialogChoiceActive = computed<boolean>(() => {
    const decision = this.decisionManager.currentDecision();
    return (
      decision !== undefined &&
      (isChooseOneOptionDecision(decision) ||
        isChooseMultipleOptionsDecision(decision) ||
        isChooseEffectDecision(decision) ||
        isChooseExtraTurnDecision(decision))
    );
  });

  prompt = computed<string>(() => {
    return this.decisionManager.currentDecision()?.prompt ?? '';
  });

  isChooseOne = computed<boolean>(() => {
    return isChooseOneOptionDecision(this.decisionManager.currentDecision());
  });

  chooseOneOptions = computed<NamedChoice[]>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return [];
    }
    if (isChooseOneOptionDecision(decision)) {
      return decision.namedChoices;
    }
    return [];
  });

  selectOption(namedChoice: NamedChoice): void {
    this.decisionManager.resolveDecisionWithOption(namedChoice.name);
  }

  isChooseMultiple = computed<boolean>(() => {
    return isChooseMultipleOptionsDecision(this.decisionManager.currentDecision());
  });

  chooseMultipleOptions = signal<SelectableNamedChoice[]>([]);

  onCheckboxChange(optionName: string, event: Event): void {
    const isSelected = (event.target as HTMLInputElement).checked;
    this.chooseMultipleOptions.update((currentOptions: SelectableNamedChoice[]) =>
      currentOptions.map((option: SelectableNamedChoice) =>
        option.name === optionName ? { ...option, selected: isSelected } : option,
      ),
    );
  }

  private selectedOptions = computed<string[]>(() => {
    return this.chooseMultipleOptions()
      .filter((option: SelectableNamedChoice) => option.selected)
      .map((option: SelectableNamedChoice) => option.name);
  });

  areCorrectNumberOfBoxesChecked = computed<boolean>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined || !isChooseMultipleOptionsDecision(decision)) {
      return false;
    }
    return this.selectedOptions().length === decision.numToSelect;
  });

  submitOptions(): void {
    this.decisionManager.resolveDecisionWithOptions(this.selectedOptions());
  }

  isChooseEffect = computed<boolean>(() => {
    return isChooseEffectDecision(this.decisionManager.currentDecision());
  });

  mandatoryEffects = computed<EffectChoice[]>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined || !isChooseEffectDecision(decision)) {
      return [];
    }
    return decision.mandatoryEffects;
  });

  hasOptionalEffects = computed<boolean>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined || !isChooseEffectDecision(decision)) {
      return false;
    }
    return decision.optionalEffects.length > 0;
  });

  optionalEffects = computed<EffectChoice[]>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined || !isChooseEffectDecision(decision)) {
      return [];
    }
    return decision.optionalEffects;
  });

  selectEffect(effectChoice: EffectChoice): void {
    return this.decisionManager.resolveDecisionWithEffect(effectChoice.effectName, effectChoice.effectId);
  }

  extraTurns = computed<ExtraTurnChoice[]>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined || !isChooseExtraTurnDecision(decision)) {
      return [];
    }
    return decision.choices;
  });

  selectExtraTurn(extraTurnChoice: ExtraTurnChoice): void {
    return this.decisionManager.resolveDecisionWithExtraTurn(extraTurnChoice.card, extraTurnChoice.name);
  }
}
