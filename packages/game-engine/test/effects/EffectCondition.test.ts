import { describe, expect, it, vi } from 'vitest';

import { EffectCondition } from '../../src/effects/EffectCondition';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';

describe('EffectCondition', () => {
  it('evaluates the wrapped condition with the provided instruction executor', () => {
    const ie = {} as InstructionExecutor;
    const condition = vi.fn(() => true);

    expect(new EffectCondition(condition).isSatisfied(ie)).toBe(true);
    expect(condition).toHaveBeenCalledWith(ie);
  });

  it('returns false when the wrapped condition fails', () => {
    const ie = {} as InstructionExecutor;

    expect(new EffectCondition(() => false).isSatisfied(ie)).toBe(false);
  });
});
