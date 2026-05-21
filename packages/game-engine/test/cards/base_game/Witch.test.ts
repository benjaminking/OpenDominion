import { describe, expect, it } from 'vitest';

import { Witch } from '../../../src/cards/base_game/Witch';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { createCardHarness } from '../testHarness';

describe('Witch', () => {
  it('draws 2 cards when played', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Witch(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(2);
  });

  it('attack causes target player to gain a Curse to their discard', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const curse = new Curse(targetHarness.sharedGameState);
    curse.setId('curse-supply-0');
    targetHarness.addSupplyPile(curse);

    await new Witch(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    expect(targetHarness.discard.size()).toBe(1);
    expect(targetHarness.discard.asCardArray()[0].getName()).toBe('Curse');
  });
});
