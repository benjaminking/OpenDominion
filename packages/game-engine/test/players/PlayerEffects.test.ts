import { describe, expect, it, vi } from 'vitest';

import { Effect } from '../../src/effects/Effect';
import { EffectTriggerType } from '../../src/effects/EffectTriggerType';
import { Player } from '../../src/players/Player';
import { PlayerEffects } from '../../src/players/PlayerEffects';
import { Turn } from '../../src/turns/Turn';

interface TestEffect {
  getTrigger: ReturnType<typeof vi.fn>;
  hasExpired: ReturnType<typeof vi.fn>;
  getTurnEligibility: ReturnType<typeof vi.fn>;
  registerStartOfPlayersTurn: ReturnType<typeof vi.fn>;
  registerEndOfPlayersTurn: ReturnType<typeof vi.fn>;
}

const createEffect = (options: { trigger: EffectTriggerType; expired?: boolean; eligible?: boolean }): TestEffect => {
  return {
    getTrigger: vi.fn(() => options.trigger),
    hasExpired: vi.fn(() => options.expired ?? false),
    getTurnEligibility: vi.fn(() => ({
      matches: vi.fn(() => options.eligible ?? true),
    })),
    registerStartOfPlayersTurn: vi.fn(),
    registerEndOfPlayersTurn: vi.fn(),
  };
};

const createAttackCard = (id: string) => {
  return {
    getId: vi.fn(() => id),
  } as never;
};

const createExtraTurn = (options: { ownerKey: string; valid: boolean }) => {
  return {
    canExtraTurnHappen: vi.fn(() => options.valid),
    doInitiatorsMatch: vi.fn((other) => other.ownerKey === options.ownerKey),
    ownerKey: options.ownerKey,
  } as never;
};

describe('PlayerEffects', () => {
  it('stores effects by trigger and forwards turn lifecycle registration to each active effect', () => {
    const playerEffects = new PlayerEffects();
    const turnStartEffect = createEffect({ trigger: EffectTriggerType.TURN_START });
    const turnEndEffect = createEffect({ trigger: EffectTriggerType.TURN_END });
    const player = {} as Player;
    const turn = {} as Turn;

    playerEffects.addEffect(turnStartEffect as unknown as Effect);
    playerEffects.addEffect(turnEndEffect as unknown as Effect);

    expect(playerEffects.getEffectsByType(EffectTriggerType.TURN_START)).toEqual([turnStartEffect]);
    expect(playerEffects.getEffectsByType(EffectTriggerType.NEVER)).toEqual([]);

    playerEffects.registerStartOfPlayersTurn(player, turn);
    playerEffects.registerEndOfPlayersTurn(player, turn);

    expect(turnStartEffect.registerStartOfPlayersTurn).toHaveBeenCalledWith(player, turn);
    expect(turnEndEffect.registerStartOfPlayersTurn).toHaveBeenCalledWith(player, turn);
    expect(turnStartEffect.registerEndOfPlayersTurn).toHaveBeenCalledWith(player, turn);
    expect(turnEndEffect.registerEndOfPlayersTurn).toHaveBeenCalledWith(player, turn);
  });

  it('removes expired and turn-ineligible effects without affecting eligible ones', () => {
    const playerEffects = new PlayerEffects();
    const expiredEffect = createEffect({ trigger: EffectTriggerType.TURN_START, expired: true });
    const ineligibleEffect = createEffect({ trigger: EffectTriggerType.TURN_START, eligible: false });
    const keptEffect = createEffect({ trigger: EffectTriggerType.TURN_START });

    playerEffects.addEffect(expiredEffect as unknown as Effect);
    playerEffects.addEffect(ineligibleEffect as unknown as Effect);
    playerEffects.addEffect(keptEffect as unknown as Effect);

    playerEffects.removeExpiredEffects();
    expect(playerEffects.getEffectsByType(EffectTriggerType.TURN_START)).toEqual([ineligibleEffect, keptEffect]);

    playerEffects.removeIneligibleEffectsByTurn({} as Turn);
    expect(playerEffects.getEffectsByType(EffectTriggerType.TURN_START)).toEqual([keptEffect]);
  });

  it('tracks attack blocks by card id', () => {
    const playerEffects = new PlayerEffects();
    const militia = createAttackCard('militia-id');

    expect(playerEffects.isAttackBlocked(militia)).toBe(false);

    playerEffects.blockAttack(militia);
    expect(playerEffects.isAttackBlocked(militia)).toBe(true);

    playerEffects.clearBlocksForAttackCard(militia);
    expect(playerEffects.isAttackBlocked(militia)).toBe(false);
  });

  it('queues, filters, removes, and clears extra turns', () => {
    const playerEffects = new PlayerEffects();
    const validExtraTurn = createExtraTurn({ ownerKey: 'alice', valid: true });
    const invalidExtraTurn = createExtraTurn({ ownerKey: 'bob', valid: false });

    expect(playerEffects.hasExtraTurnsQueued()).toBe(false);

    playerEffects.addExtraTurn(validExtraTurn);
    playerEffects.addExtraTurn(invalidExtraTurn);

    expect(playerEffects.hasExtraTurnsQueued()).toBe(true);
    expect(playerEffects.findValidExtraTurns([])).toEqual([validExtraTurn]);

    playerEffects.removeExtraTurnFromQueue({ ownerKey: 'alice' } as never);
    expect(playerEffects.findValidExtraTurns([])).toEqual([]);
    expect(playerEffects.hasExtraTurnsQueued()).toBe(true);

    playerEffects.clearExtraTurns();
    expect(playerEffects.hasExtraTurnsQueued()).toBe(false);
  });
});
