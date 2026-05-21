import { describe, expect, it, vi } from 'vitest';

import { Card } from '../src/card/Card';
import { CardEligibilityFunction } from '../src/CardEligibilityFunction';
import { Effect } from '../src/effects/Effect';
import { EffectAction } from '../src/effects/EffectAction';
import { EffectCondition } from '../src/effects/EffectCondition';
import { EffectExpiration } from '../src/effects/EffectExpiration';
import { EffectSource } from '../src/effects/EffectSource';
import { EffectTriggerType } from '../src/effects/EffectTriggerType';
import { TurnEligibility } from '../src/effects/TurnEligibility';
import { InstructionExecutor } from '../src/players/InstructionExecutor';
import { Player } from '../src/players/Player';
import { Turn } from '../src/turns/Turn';

class TrackingExpiration extends EffectExpiration {
  public expired = false;
  public numUses = 0;
  public startRegistrations: { player: Player; turn: Turn }[] = [];
  public endRegistrations: { player: Player; turn: Turn }[] = [];

  public hasExpired(): boolean {
    return this.expired;
  }

  public registerUse(): void {
    this.numUses++;
  }

  public registerStartOfPlayersTurn(player: Player, currentTurn: Turn): void {
    this.startRegistrations.push({ player, turn: currentTurn });
  }

  public registerEndOfPlayersTurn(player: Player, currentTurn: Turn): void {
    this.endRegistrations.push({ player, turn: currentTurn });
  }
}

const createPlayer = (name: string): Player => {
  return {
    getName: vi.fn(() => name),
  } as unknown as Player;
};

describe('Effect', () => {
  it('should require an owner before building an effect', () => {
    expect(() => new Effect.Builder().build()).toThrow('Effect must have a source');
  });

  it('should build an effect with the configured public properties and expiration delegation', () => {
    const owner = {
      getId: vi.fn(() => 'source-card'),
    } as unknown as Card;
    const expiration = new TrackingExpiration();
    expiration.expired = true;
    const turnEligibility: TurnEligibility = {
      matches: vi.fn(() => true),
    };
    const cardEligibility = new CardEligibilityFunction(() => true);
    const effect = new Effect.Builder()
      .from(owner)
      .withExpiration(expiration)
      .onTurn(turnEligibility)
      .triggerOn(EffectTriggerType.BUY, EffectSource.ANYONE)
      .makeMandatory()
      .self()
      .whereCardIs(cardEligibility)
      .build();
    const player = createPlayer('Alice');
    const turn = new Turn(player, 3, 5);

    effect.registerStartOfPlayersTurn(player, turn);
    effect.registerEndOfPlayersTurn(player, turn);

    expect(effect.getId()).toBe('source-card_buy');
    expect(effect.getOwner()).toBe(owner);
    expect(effect.getTrigger()).toBe(EffectTriggerType.BUY);
    expect(effect.getSource()).toBe(EffectSource.ANYONE);
    expect(effect.getExpiration()).toBe(expiration);
    expect(effect.hasExpired()).toBe(true);
    expect(effect.getTurnEligibility()).toBe(turnEligibility);
    expect(effect.isMandatory()).toBe(true);
    expect(effect.isSelf()).toBe(true);
    expect(effect.getCardEligibility()).toBe(cardEligibility);
    expect(expiration.startRegistrations).toEqual([{ player, turn }]);
    expect(expiration.endRegistrations).toEqual([{ player, turn }]);
  });

  it('should require every configured condition to pass', () => {
    const owner = {
      getId: vi.fn(() => 'source-card'),
    } as unknown as Card;
    const instructionExecutor = {} as InstructionExecutor;
    const effect = new Effect.Builder()
      .from(owner)
      .addCondition(new EffectCondition(() => true))
      .addCondition(new EffectCondition(() => false))
      .build();

    expect(effect.areOtherConditionsSatisfied(instructionExecutor)).toBe(false);
  });

  it('should run the action, increment the usage count, and register the use with the expiration', async () => {
    const owner = {
      getId: vi.fn(() => 'source-card'),
    } as unknown as Card;
    const expiration = new TrackingExpiration();
    const action = vi.fn(async (_instructionExecutor: InstructionExecutor) => undefined);
    const effect = new Effect.Builder().from(owner).withExpiration(expiration).action(new EffectAction(action)).build();
    const instructionExecutor = {} as InstructionExecutor;

    await effect.doAction(instructionExecutor, undefined);

    expect(effect.getNumTimesUsed()).toBe(1);
    expect(action).toHaveBeenCalledWith(instructionExecutor);
    expect(expiration.numUses).toBe(1);
  });
});
