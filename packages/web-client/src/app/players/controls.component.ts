import { Component, computed, effect, inject, input, Signal, signal, WritableSignal } from '@angular/core';
import { MessageDecoderService } from '../message-decoder.service';
import { NumberType, StatusAction } from '@dominion/common';
import { DecisionManagerService } from '../decisions/decision-manager.service';
import {
  isActionPhaseDecision,
  isBuyPhaseDecision,
  isChooseCardsDecision,
  isTreasurePhaseDecision,
} from '../decisions/Decision';

@Component({
  selector: 'controls',
  templateUrl: './controls.component.html',
  styleUrls: ['./controls.component.css'],
})
export class ControlsComponent {
  mainPlayerName = input<string>('');
  playerNames = input<string[]>([]);
  currentPlayerName = input<string>('');

  isMainPlayersTurn = computed<boolean>(() => {
    return this.mainPlayerName() === this.currentPlayerName();
  });

  playerActions: Signal<Map<string, WritableSignal<number>>> = computed(() => {
    const actionsByName: Map<string, WritableSignal<number>> = new Map();
    this.playerNames().forEach((name) => {
      actionsByName.set(name, signal<number>(0));
    });
    return actionsByName;
  });
  playerBuys: Signal<Map<string, WritableSignal<number>>> = computed(() => {
    const buysByName: Map<string, WritableSignal<number>> = new Map();
    this.playerNames().forEach((name) => {
      buysByName.set(name, signal<number>(0));
    });
    return buysByName;
  });
  playerCoins: Signal<Map<string, WritableSignal<number>>> = computed(() => {
    const coinsByName: Map<string, WritableSignal<number>> = new Map();
    this.playerNames().forEach((name) => {
      coinsByName.set(name, signal<number>(0));
    });
    return coinsByName;
  });
  playerScores: Signal<Map<string, WritableSignal<number>>> = computed(() => {
    const scoresByName: Map<string, WritableSignal<number>> = new Map();
    this.playerNames().forEach((name) => {
      scoresByName.set(name, signal<number>(0));
    });
    return scoresByName;
  });

  currentPlayerCoins = computed<number>(() => {
    if (!this.playerCoins().has(this.currentPlayerName())) {
      return 0;
    }
    return this.playerCoins().get(this.currentPlayerName())();
  });

  currentPlayerActions = computed<number>(() => {
    if (!this.playerCoins().has(this.currentPlayerName())) {
      return 0;
    }
    return this.playerActions().get(this.currentPlayerName())();
  });

  currentPlayerBuys = computed<number>(() => {
    if (!this.playerCoins().has(this.currentPlayerName())) {
      return 0;
    }
    return this.playerBuys().get(this.currentPlayerName())();
  });

  statusStack = signal<string[]>([]);
  status = computed<string>(() => {
    if (this.decisionManager.currentDecision() !== undefined) {
      return this.decisionManager.currentDecision().prompt;
    }
    if (this.statusStack().length > 0) {
      return this.statusStack()[this.statusStack().length - 1];
    }
    return '';
  });

  private readonly webSocketMessageDecoder = inject(MessageDecoderService);
  private readonly decisionManager = inject(DecisionManagerService);

  constructor() {
    this.webSocketMessageDecoder.subscribeToStatus((statusContent: { status: string; action: StatusAction }) => {
      switch (statusContent.action) {
        case StatusAction.REPLACE: {
          if (this.statusStack().length > 0) {
            this.statusStack.update((currentStack: string[]) => [
              ...currentStack.slice(0, currentStack.length - 1),
              statusContent.status,
            ]);
          } else {
            this.statusStack.set([statusContent.status]);
          }
          break;
        }
        case StatusAction.PUSH: {
          this.statusStack.update((currentStack: string[]) => [...currentStack, statusContent.status]);
          break;
        }
        case StatusAction.POP: {
          if (this.statusStack().length > 0) {
            this.statusStack.update((currentStack: string[]) => [...currentStack.slice(0, currentStack.length - 1)]);
          }
          break;
        }
      }
    });

    effect(() => {
      for (const name of this.playerNames()) {
        this.webSocketMessageDecoder.subscribeToStatisticUpdate(
          { owner: name, type: NumberType.ACTIONS },
          (statisticContent: { value: number }) => {
            const actionsSignal = this.playerActions().get(name);
            if (actionsSignal) {
              actionsSignal.set(statisticContent.value);
            }
          },
        );
        this.webSocketMessageDecoder.subscribeToStatisticUpdate(
          { owner: name, type: NumberType.BUYS },
          (statisticContent: { value: number }) => {
            const buysSignal = this.playerBuys().get(name);
            if (buysSignal) {
              buysSignal.set(statisticContent.value);
            }
          },
        );
        this.webSocketMessageDecoder.subscribeToStatisticUpdate(
          { owner: name, type: NumberType.COINS },
          (statisticContent: { value: number }) => {
            const coinsSignal = this.playerCoins().get(name);
            if (coinsSignal) {
              coinsSignal.set(statisticContent.value);
            }
          },
        );
        this.webSocketMessageDecoder.subscribeToStatisticUpdate(
          { owner: name, type: NumberType.SCORE },
          (statisticContent: { value: number }) => {
            const scoreSignal = this.playerScores().get(name);
            if (scoreSignal) {
              scoreSignal.set(statisticContent.value);
            }
          },
        );
      }
    });
  }

  canEndTurn = computed<boolean>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return false;
    }

    return isActionPhaseDecision(decision) || isTreasurePhaseDecision(decision) || isBuyPhaseDecision(decision);
  });

  endTurn(): void {
    this.decisionManager.resolveDecisionWithEndTurn();
  }

  canPlaySimpleTreasures = computed<boolean>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return false;
    }

    if (isTreasurePhaseDecision(decision)) {
      if (decision.simpleTreasuresChoice !== undefined && decision.simpleTreasuresChoice.coins > 0) {
        return true;
      }
    }
    return false;
  });

  simpleTreasureCoins = computed<number>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return 0;
    }

    if (isTreasurePhaseDecision(decision)) {
      if (decision.simpleTreasuresChoice !== undefined) {
        return decision.simpleTreasuresChoice.coins;
      }
    }
    return 0;
  });

  makeSimpleTreasureChoice(): void {
    this.decisionManager.resolveDecisionWithSimpleTreasures();
  }

  isActionPhase = computed<boolean>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return false;
    }

    return isActionPhaseDecision(decision);
  });

  endActionPhase(): void {
    this.decisionManager.resolveDecisionWithEndActionPhase();
  }

  isTreasurePhase = computed<boolean>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return false;
    }

    return isTreasurePhaseDecision(decision);
  });

  isBuyPhase = computed<boolean>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return false;
    }

    return isBuyPhaseDecision(decision);
  });

  endBuyPhase(): void {
    this.decisionManager.resolveDecisionWithEndBuyPhase();
  }

  isInMultiSelection = computed<boolean>(() => {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined) {
      return false;
    }

    return isChooseCardsDecision(decision);
  });

  isCorrectNumberOfCardsSelected() {
    const decision = this.decisionManager.currentDecision();
    if (decision === undefined || !isChooseCardsDecision(decision)) {
      return false;
    }

    return this.decisionManager.isCorrectNumberOfCardsSelected();
  }

  completeSelection(): void {
    this.decisionManager.resolveDecisionWithCards();
  }

  undoSelection(): void {
    this.decisionManager.resetSelectedCards();
  }
}
