import { describe, expect, it } from 'vitest';

import { Militia } from '../../../src/cards/base_game/Militia';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('Militia', () => {
  it('adds 2 coins when played', async () => {
    const testHarness = createCardHarness();

    await new Militia(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
  });

  it('attack causes target player to discard down to 3 cards', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetHandCards: Copper[] = [];
    for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
      const targetHandCopper = new Copper(targetHarness.sharedGameState);
      targetHandCopper.setId(`copper-target-hand-${String(cardIndex)}`);
      targetHandCards.push(targetHandCopper);
      targetHarness.addToHand(targetHandCopper);
    }

    // Target discards 2 cards (5 → 3)
    targetHarness.pickCards([targetHandCards[0], targetHandCards[1]]);
    await new Militia(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    expect(targetHarness.hand.size()).toBe(3);
    expect(targetHarness.discard.size()).toBe(2);
  });

  it('attack does not discard when target already has 3 or fewer cards', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const targetHandCopper = new Copper(targetHarness.sharedGameState);
      targetHandCopper.setId(`copper-target-hand-${String(cardIndex)}`);
      targetHarness.addToHand(targetHandCopper);
    }

    await new Militia(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    expect(targetHarness.hand.size()).toBe(3);
    expect(targetHarness.discard.size()).toBe(0);
  });
});
