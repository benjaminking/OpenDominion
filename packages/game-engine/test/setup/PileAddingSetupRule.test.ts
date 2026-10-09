import { describe, expect, it, vi } from 'vitest';

import { AddedPilePostAction } from '../../src/setup/AddedPilePostAction';
import { PileAddingSetupRule } from '../../src/setup/PileAddingSetupRule';
import { PileSpecification } from '../../src/setup/PileSpecification';
import { SetupRuleType } from '../../src/setup/SetupRule';

describe('PileAddingSetupRule', () => {
  it('adds a pile and runs the post action when a pile is added', () => {
    const pile = { id: 'pile-1' };
    const gameInitializer = {
      addRandomPile: vi.fn(() => pile),
    };
    const addedPilePostAction = {
      performAction: vi.fn(),
    };
    const pileSpecification = new PileSpecification({ requiredCoinCosts: [2, 3] }, true, true);
    const rule = new PileAddingSetupRule(pileSpecification, addedPilePostAction as never);

    rule.applySetupRule(gameInitializer as never);

    expect(rule.setupRuleType).toBe(SetupRuleType.GAME_INITIALIZATION);
    expect(gameInitializer.addRandomPile).toHaveBeenCalledWith(pileSpecification);
    expect(addedPilePostAction.performAction).toHaveBeenCalledWith(pile);
  });

  it('does not run the post action when no pile is added', () => {
    const gameInitializer = {
      addRandomPile: vi.fn(() => undefined),
    };
    const addedPilePostAction = {
      performAction: vi.fn(),
    };
    const rule = new PileAddingSetupRule(new PileSpecification({}), addedPilePostAction as never);

    rule.applySetupRule(gameInitializer as never);

    expect(gameInitializer.addRandomPile).toHaveBeenCalledTimes(1);
    expect(addedPilePostAction.performAction).not.toHaveBeenCalled();
  });

  it('adds a pile without a post action', () => {
    const gameInitializer = {
      addRandomPile: vi.fn(() => ({ id: 'pile-1' })),
    };
    const pileSpecification = new PileSpecification({ requiredCoinCosts: [3, 4] });
    const rule = new PileAddingSetupRule(pileSpecification);

    expect(() => {
      rule.applySetupRule(gameInitializer as never);
    }).not.toThrow();
    expect(gameInitializer.addRandomPile).toHaveBeenCalledWith(pileSpecification);
  });

  it('passes the added pile to a real post action', () => {
    const pile = { name: 'Moat' };
    const action = vi.fn();
    const rule = new PileAddingSetupRule(new PileSpecification({}), new AddedPilePostAction(action));

    rule.applySetupRule({ addRandomPile: () => pile } as never);

    expect(action).toHaveBeenCalledWith(pile);
  });
});
