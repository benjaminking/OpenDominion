import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Cutpurse } from '../../../src/cards/seaside/Cutpurse';
import { createCardHarness } from '../testHarness';

describe('Cutpurse', () => {
  it('adds $2 when played', async () => {
    const testHarness = createCardHarness();
    await new Cutpurse(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
  });

  it("attack discards a Copper from target's hand", async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetHandCopper = new Copper(targetHarness.sharedGameState);
    targetHandCopper.setId('copper-target-hand-0');
    targetHarness.addToHand(targetHandCopper);

    await new Cutpurse(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    expect(targetHarness.discard.size()).toBe(1);
    expect(targetHarness.hand.size()).toBe(0);
  });

  it('attack reveals hand but discards nothing when target has no Copper', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    // empty hand — no Copper to discard
    await new Cutpurse(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    expect(targetHarness.discard.size()).toBe(0);
    expect(targetHarness.hand.size()).toBe(0);
  });
});
