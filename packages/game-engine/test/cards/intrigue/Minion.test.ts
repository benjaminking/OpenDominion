import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Minion } from '../../../src/cards/intrigue/Minion';
import { createCardHarness } from '../testHarness';

describe('Minion', () => {
  it('adds 1 action', async () => {
    const testHarness = createCardHarness();
    testHarness.pickOption('+$2');
    await new Minion(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('adds 2 coins when +$2 option chosen', async () => {
    const testHarness = createCardHarness();
    testHarness.pickOption('+$2');
    await new Minion(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.coins).toBe(2);
  });

  it('discards hand and draws 4 when discard option chosen', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const handCopper = new Copper(testHarness.sharedGameState);
      handCopper.setId(`copper-hand-${String(cardIndex)}`);
      testHarness.addToHand(handCopper);
    }
    for (let cardIndex = 0; cardIndex < 6; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    testHarness.pickOption('Discard hand and draw 4 cards');
    await new Minion(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(4);
    expect(testHarness.discard.size()).toBe(2); // original hand discarded
  });

  it('discardAttack discards and redraws target hand when target has 5 or more cards', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
      const targetHandCopper = new Copper(targetHarness.sharedGameState);
      targetHandCopper.setId(`copper-target-hand-${String(cardIndex)}`);
      targetHarness.addToHand(targetHandCopper);
    }
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const targetDeckCopper = new Copper(targetHarness.sharedGameState);
      targetDeckCopper.setId(`copper-target-deck-${String(cardIndex)}`);
      targetHarness.addToDeck(targetDeckCopper);
    }

    await new Minion(testHarness.sharedGameState).discardAttack(targetHarness.player, targetHarness.player);

    expect(targetHarness.hand.size()).toBe(4);
    expect(targetHarness.discard.size()).toBe(5);
  });

  it('discardAttack does nothing when target has fewer than 5 cards', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const targetHandCopper = new Copper(targetHarness.sharedGameState);
      targetHandCopper.setId(`copper-target-hand-${String(cardIndex)}`);
      targetHarness.addToHand(targetHandCopper);
    }

    await new Minion(testHarness.sharedGameState).discardAttack(targetHarness.player, targetHarness.player);

    expect(targetHarness.hand.size()).toBe(4);
    expect(targetHarness.discard.size()).toBe(0);
  });
});
