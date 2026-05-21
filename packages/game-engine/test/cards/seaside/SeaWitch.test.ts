import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { SeaWitch } from '../../../src/cards/seaside/SeaWitch';
import { createCardHarness } from '../testHarness';

describe('SeaWitch', () => {
  it('draws 2 cards and registers a duration effect', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new SeaWitch(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
  });

  it('curseAttack causes target player to gain a Curse to their discard', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const curse = new Curse(targetHarness.sharedGameState);
    curse.setId('curse-supply-0');
    targetHarness.addSupplyPile(curse);

    await new SeaWitch(testHarness.sharedGameState).curseAttack(targetHarness.player, targetHarness.player);

    expect(targetHarness.discard.size()).toBe(1);
    expect(targetHarness.discard.asCardArray()[0].getName()).toBe('Curse');
  });
});
