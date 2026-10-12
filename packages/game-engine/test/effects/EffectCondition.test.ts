import { describe, expect, it, vi } from 'vitest';

import { EffectCondition } from '../../src/effects/EffectCondition';
import { EffectContext, EffectContextBuilder } from '../../src/effects/EffectContext';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';

describe('EffectCondition', () => {
  it('evaluates the wrapped condition with the provided instruction executor and effect context', () => {
    const ie = {} as InstructionExecutor;
    const effectContext = new EffectContextBuilder().build();
    const condition = vi.fn(() => true);

    expect(new EffectCondition(condition).isSatisfied(ie, effectContext)).toBe(true);
    expect(condition).toHaveBeenCalledWith(ie, effectContext);
  });

  it('passes an empty effect context when none is given', () => {
    const ie = {} as InstructionExecutor;
    let effectContext: EffectContext | undefined;

    new EffectCondition((_ie: InstructionExecutor, context: EffectContext) => {
      effectContext = context;
      return true;
    }).isSatisfied(ie);

    expect(effectContext?.getTargetCards()).toBeUndefined();
    expect(effectContext?.getGainLocation()).toBeUndefined();
  });

  it('returns false when the wrapped condition fails', () => {
    const ie = {} as InstructionExecutor;

    expect(new EffectCondition(() => false).isSatisfied(ie)).toBe(false);
  });
});
