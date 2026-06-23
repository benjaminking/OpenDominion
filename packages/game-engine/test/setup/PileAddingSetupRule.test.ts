import { describe, expect, it, vi } from 'vitest';

import { PileAddingSetupRule } from '../../src/setup/PileAddingSetupRule';
import { SetupRuleType } from '../../src/setup/SetupRule';

describe('PileAddingSetupRule', () => {
  it('adds a pile and runs the post action when a pile is added', () => {
    const pile = { id: 'pile-1' };
    const gameInitializer = {
      addPile: vi.fn(() => pile),
    };
    const addedPilePostAction = {
      performAction: vi.fn(),
    };
    const pileSpecification = { doesRandomizerMatch: vi.fn(() => true) };
    const rule = new PileAddingSetupRule(pileSpecification as never, addedPilePostAction as never);

    rule.applySetupRule(gameInitializer as never);

    expect(rule.setupRuleType).toBe(SetupRuleType.GAME_INITIALIZATION);
    expect(gameInitializer.addPile).toHaveBeenCalledWith(pileSpecification);
    expect(addedPilePostAction.performAction).toHaveBeenCalledWith(pile);
  });

  it('does not run the post action when no pile is added', () => {
    const gameInitializer = {
      addPile: vi.fn(() => undefined),
    };
    const addedPilePostAction = {
      performAction: vi.fn(),
    };
    const rule = new PileAddingSetupRule({} as never, addedPilePostAction as never);

    rule.applySetupRule(gameInitializer as never);

    expect(addedPilePostAction.performAction).not.toHaveBeenCalled();
  });
});
