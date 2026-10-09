import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Baker } from '../../../src/cards/cornucopia_and_guilds/Baker';
import { createCardHarness } from '../testHarness';

describe('Baker', () => {
  it('gives +1 Card, +1 Action and +1 Coffers', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);

    await new Baker(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([copper]);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.coffers).toBe(1);
  });

  it('setup gives each player +1 Coffers', () => {
    const testHarness = createCardHarness();
    const otherHarness = createCardHarness();
    vi.mocked(testHarness.sharedGameState.getCurrentTurnOrder).mockReturnValue([
      testHarness.player,
      otherHarness.player,
    ]);
    const baker = new Baker(testHarness.sharedGameState);

    baker.getSetupRules().getNextGameStateSetupRule().applySetupRule(testHarness.sharedGameState);

    expect(testHarness.stats.coffers).toBe(1);
    expect(otherHarness.stats.coffers).toBe(1);
  });
});
