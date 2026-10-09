import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Fortress } from '../../../src/cards/dark_ages/Fortress';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Fortress', () => {
  it('draws 1 card and gives +2 Actions', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new Fortress(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(2);
  });

  it('when trashed, moves from the trash into hand', async () => {
    const testHarness = createCardHarness();
    const fortress = new Fortress(testHarness.sharedGameState);
    fortress.setId('fortress-0');
    testHarness.addToInPlay(fortress);

    await testHarness.executor.trashCardFromLocation(fortress, CardLocation.IN_PLAY);
    const [onTrash] = testHarness.getCardEffects(fortress, EffectTriggerType.TRASH);
    await onTrash.doAction(testHarness.executor, fortress);

    expect(testHarness.hand.asCardArray()).toEqual([fortress]);
    expect(fortress.getLocation()).toBe(CardLocation.HAND);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.sharedTrash.contains(fortress)).toBe(false);
  });
});
