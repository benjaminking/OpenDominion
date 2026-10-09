import { describe, expect, it } from 'vitest';

import { isNotCleanup } from '../../src/effects/StandardEffectConditions';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';
import { TurnPhase } from '../../src/turns/TurnPhase';

const createInstructionExecutorInPhase = (turnPhase: TurnPhase): InstructionExecutor =>
  ({
    getSharedGameState: () => ({
      getTurnPhase: () => turnPhase,
    }),
  }) as unknown as InstructionExecutor;

describe('StandardEffectConditions', () => {
  it('isNotCleanup is satisfied during the action and buy phases', () => {
    expect(isNotCleanup.isSatisfied(createInstructionExecutorInPhase(TurnPhase.ACTION))).toBe(true);
    expect(isNotCleanup.isSatisfied(createInstructionExecutorInPhase(TurnPhase.BUY))).toBe(true);
  });

  it('isNotCleanup is not satisfied during the cleanup phase', () => {
    expect(isNotCleanup.isSatisfied(createInstructionExecutorInPhase(TurnPhase.CLEANUP))).toBe(false);
  });
});
