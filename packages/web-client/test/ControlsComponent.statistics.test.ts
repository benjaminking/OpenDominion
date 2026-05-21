import '@angular/compiler';
import { runInInjectionContext, signal } from '@angular/core';
import { NumberType, StatusAction } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { DecisionManagerService } from '../src/app/decisions/decision-manager.service';
import { MessageDecoderService } from '../src/app/message-decoder.service';
import { ControlsComponent } from '../src/app/players/controls.component';
import { createAngularTestInjector, setInputSignalValue } from './angular-test-utils';

class FakeMessageDecoderService {
  statusCallback?: (content: { status: string; action: StatusAction }) => void;
  private readonly statisticCallbacks = new Map<string, (content: { value: number }) => void>();

  subscribeToStatus(callback: (content: { status: string; action: StatusAction }) => void): void {
    this.statusCallback = callback;
  }

  subscribeToStatisticUpdate(
    key: { owner: string; type: NumberType },
    callback: (content: { value: number }) => void,
  ): void {
    this.statisticCallbacks.set(`${key.owner}:${key.type}`, callback);
  }

  emitStatistic(owner: string, type: NumberType, value: number): void {
    this.statisticCallbacks.get(`${owner}:${type}`)?.({ value });
  }
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
  const { injector, effectScheduler } = createAngularTestInjector([
    { provide: MessageDecoderService, useValue: decoder },
    { provide: DecisionManagerService, useValue: decisionManager },
  ]);

  const component = runInInjectionContext(injector, () => new ControlsComponent());

  return { component, decoder, effectScheduler };
}

describe('ControlsComponent statistics', () => {
  it('updates per-player stats from decoder messages and derives current-player counters', () => {
    const { component, decoder, effectScheduler } = createComponent();

    setInputSignalValue(component.playerNames as () => string[], ['Alice', 'Bob']);
    setInputSignalValue(component.mainPlayerName as () => string, 'Alice');
    setInputSignalValue(component.currentPlayerName as () => string, 'Alice');
    effectScheduler.flush();

    decoder.emitStatistic('Alice', NumberType.ACTIONS, 2);
    decoder.emitStatistic('Alice', NumberType.BUYS, 1);
    decoder.emitStatistic('Alice', NumberType.COINS, 5);
    decoder.emitStatistic('Bob', NumberType.ACTIONS, 4);
    decoder.emitStatistic('Bob', NumberType.BUYS, 2);
    decoder.emitStatistic('Bob', NumberType.COINS, 8);

    expect(component.playerActions().get('Alice')?.()).toBe(2);
    expect(component.playerBuys().get('Alice')?.()).toBe(1);
    expect(component.playerCoins().get('Alice')?.()).toBe(5);
    expect(component.playerActions().get('Bob')?.()).toBe(4);
    expect(component.playerBuys().get('Bob')?.()).toBe(2);
    expect(component.playerCoins().get('Bob')?.()).toBe(8);

    expect(component.currentPlayerActions()).toBe(2);
    expect(component.currentPlayerBuys()).toBe(1);
    expect(component.currentPlayerCoins()).toBe(5);

    setInputSignalValue(component.currentPlayerName as () => string, 'Bob');

    expect(component.currentPlayerActions()).toBe(4);
    expect(component.currentPlayerBuys()).toBe(2);
    expect(component.currentPlayerCoins()).toBe(8);
    expect(component.isMainPlayersTurn()).toBe(false);
  });
});
