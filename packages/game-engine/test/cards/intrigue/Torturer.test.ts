import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Torturer } from '../../../src/cards/intrigue/Torturer';
import { createCardHarness } from '../testHarness';

describe('Torturer', () => {
  it('draws 3 cards when played', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Torturer(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(3);
  });

  it("attack: discard option removes 2 chosen cards from target's hand", async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetHandCards: Copper[] = [];
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const targetHandCopper = new Copper(targetHarness.sharedGameState);
      targetHandCopper.setId(`copper-target-hand-${String(cardIndex)}`);
      targetHandCards.push(targetHandCopper);
      targetHarness.addToHand(targetHandCopper);
    }

    targetHarness.pickOption('Discard 2 cards');
    targetHarness.pickCards([targetHandCards[0], targetHandCards[1]]);
    await new Torturer(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    expect(targetHarness.hand.size()).toBe(1);
    expect(targetHarness.discard.size()).toBe(2);
  });

  it("attack: gain curse option places a Curse in target's hand", async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const curse = new Curse(targetHarness.sharedGameState);
    curse.setId('curse-supply-0');
    targetHarness.addSupplyPile(curse);

    targetHarness.pickOption('Gain a Curse to your hand');
    await new Torturer(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    expect(targetHarness.hand.size()).toBe(1);
    expect(targetHarness.hand.asCardArray()[0].getName()).toBe('Curse');
  });
});
