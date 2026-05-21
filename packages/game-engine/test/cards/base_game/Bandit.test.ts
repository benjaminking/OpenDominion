import { describe, expect, it } from 'vitest';

import { Bandit } from '../../../src/cards/base_game/Bandit';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { createCardHarness } from '../testHarness';

describe('Bandit', () => {
  it('gains a Gold to discard when played', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);

    await new Bandit(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1);
    expect(testHarness.discard.asCardArray()[0].getName()).toBe('Gold');
  });

  it("attack trashes a non-Copper treasure from the top of target's deck", async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetDeckSilver = new Silver(targetHarness.sharedGameState);
    targetDeckSilver.setId('silver-target-deck-0');
    targetHarness.addToDeck(targetDeckSilver);

    await new Bandit(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    expect(targetHarness.sharedTrash.size()).toBe(1);
    expect(targetHarness.sharedTrash.asCardArray()[0].getName()).toBe('Silver');
  });

  it('attack discards Copper rather than trashing it', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const targetDeckCopper = new Copper(targetHarness.sharedGameState);
      targetDeckCopper.setId(`copper-target-deck-${String(cardIndex)}`);
      targetHarness.addToDeck(targetDeckCopper);
    }

    await new Bandit(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    // Coppers are not eligible to trash — they are discarded instead
    expect(targetHarness.sharedTrash.size()).toBe(0);
    expect(targetHarness.discard.size()).toBe(2);
  });
});
