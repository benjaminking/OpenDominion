import { describe, expect, it, vi } from 'vitest';

import { CostModifier } from '../../src/effects/CostModifier';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { CostModifyingSetupRule } from '../../src/setup/CostModifyingSetupRule';
import { SetupRuleType } from '../../src/setup/SetupRule';
import { SetupRules } from '../../src/setup/SetupRules';

describe('CostModifyingSetupRule', () => {
  it('is a game-state setup rule that adds its cost modifier to the shared game state', () => {
    const costModifier = { id: 'peddler-discount' } as unknown as CostModifier;
    const sharedGameState = { addCostModifier: vi.fn() };
    const rule = new CostModifyingSetupRule(costModifier);

    rule.applySetupRule(sharedGameState as unknown as SharedGameState);

    expect(rule.setupRuleType).toBe(SetupRuleType.GAME_STATE);
    expect(sharedGameState.addCostModifier).toHaveBeenCalledTimes(1);
    expect(sharedGameState.addCostModifier).toHaveBeenCalledWith(costModifier);
  });

  it('is stored with the game-state setup rules', () => {
    const rules = new SetupRules();
    const rule = new CostModifyingSetupRule({} as CostModifier);

    rules.add(rule);

    expect(rules.hasAnyGameStateSetupRules()).toBe(true);
    expect(rules.hasAnyGameInitializationSetupRules()).toBe(false);
    expect(rules.getNextGameStateSetupRule()).toBe(rule);
  });
});
