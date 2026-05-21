import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Swindler } from '../../../src/cards/intrigue/Swindler';
import { createCardHarness } from '../testHarness';

describe('Swindler', () => {
  it('adds 2 coins when played', async () => {
    const testHarness = createCardHarness();
    await new Swindler(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.coins).toBe(2);
  });

  it("attack trashes the top card of target's deck", async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetDeckCopper = new Copper(targetHarness.sharedGameState);
    targetDeckCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(targetDeckCopper);

    // Swindler.attack is private; cast to access it for testing.
    // No supply cards in attacker\'s supply, so the gain step is skipped.
    const swindler = new Swindler(testHarness.sharedGameState);
    await (swindler as unknown as { attack(...args: unknown[]): Promise<void> }).attack(
      targetHarness.player,
      testHarness.player,
    );

    expect(targetHarness.sharedTrash.size()).toBe(1);
    expect(targetHarness.sharedTrash.asCardArray()[0].getName()).toBe('Copper');
  });
});
