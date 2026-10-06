import { describe, expect, it, vi } from 'vitest';

import { PileReplacingSetupRule } from '../../src/setup/CardReplacingSetupRule';
import { SetupRuleType } from '../../src/setup/SetupRule';

describe('PileReplacingSetupRule', () => {
  it('replaces cards in piles through the game initializer', () => {
    const gameInitializer = {
      replaceCardsInPiles: vi.fn(),
    };
    const rule = new PileReplacingSetupRule('Estate', 'Duchy');

    rule.applySetupRule(gameInitializer as never);

    expect(rule.setupRuleType).toBe(SetupRuleType.GAME_INITIALIZATION);
    expect(gameInitializer.replaceCardsInPiles).toHaveBeenCalledWith('Estate', 'Duchy');
  });
});
