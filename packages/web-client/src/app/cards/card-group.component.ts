import { Component, computed, inject, input, signal } from '@angular/core';
import { DecisionManagerService } from '../decisions/decision-manager.service';
import { convertToFileName } from '../util/NamingUtils';
import { DecisionType } from '../decisions/DecisionType';
import { CardMetadata } from '@dominion/common';
import {
  Decision,
  isActionPhaseDecision,
  isBuyPhaseDecision,
  isChooseCardDecision,
  isChooseCardsDecision,
  isTreasurePhaseDecision,
} from '../decisions/Decision';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card.component';
import { CardSelectionPurpose } from '@dominion/common';

@Component({
  selector: 'card-group',
  templateUrl: './card-group.component.html',
  styleUrls: ['./card-group.component.css'],
  host: { class: 'card-group' },
  imports: [CardComponent, CommonModule],
})
export class CardGroupComponent {
  protected readonly CardSelectionPurpose = CardSelectionPurpose;
  cards = input.required<CardMetadata[]>();
  count = input.required<number>();
  selectedcount = signal<number>(0);

  cardname = computed<string>(() => this.cards()[0].name);
  fileName = computed(() => convertToFileName(this.cardname()));

  decisionManager = inject(DecisionManagerService);

  isSelectable = computed<boolean>(() => {
    const decision: Decision | undefined = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return false;
    }

    if (
      isActionPhaseDecision(decision) ||
      isTreasurePhaseDecision(decision) ||
      isBuyPhaseDecision(decision) ||
      isChooseCardDecision(decision) ||
      isChooseCardsDecision(decision)
    ) {
      return this.areAnyCardsEligible(decision.eligibleCardIds);
    }

    return false;
  });

  isSelectionType(selectionType: CardSelectionPurpose): boolean {
    const decision: Decision | undefined = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return false;
    }

    if (
      isActionPhaseDecision(decision) ||
      isTreasurePhaseDecision(decision) ||
      isBuyPhaseDecision(decision) ||
      isChooseCardDecision(decision) ||
      isChooseCardsDecision(decision)
    ) {
      return decision.selectionType === selectionType;
    }
    return false;
  }

  private areAnyCardsEligible(eligibleCardIds: Set<string>): boolean {
    return this.cards().some((card: CardMetadata) => eligibleCardIds.has(card.id));
  }

  isMultiSelection(): boolean {
    const decision: Decision | undefined = this.decisionManager.currentDecision();
    return decision !== undefined && isChooseCardsDecision(decision);
  }

  processClick(): void {
    const decision: Decision | undefined = this.decisionManager.currentDecision();
    if (this.isSelectable() && decision !== undefined) {
      if (
        isActionPhaseDecision(decision) ||
        isTreasurePhaseDecision(decision) ||
        isBuyPhaseDecision(decision) ||
        isChooseCardDecision(decision)
      ) {
        this.decisionManager.resolveDecisionWithCard(this.cards()[0]);
      } else if (isChooseCardsDecision(decision)) {
        this.decisionManager.addSelectedCard(this.cards()[this.selectedcount()], () => {
          this.selectedcount.set(0);
        });
        this.selectedcount.update((currentValue: number) =>
          currentValue < this.count() ? currentValue + 1 : currentValue,
        );
      }
    }
  }
}
