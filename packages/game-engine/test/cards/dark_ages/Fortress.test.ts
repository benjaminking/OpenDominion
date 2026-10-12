import { CardLocation } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Fortress } from '../../../src/cards/dark_ages/Fortress';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
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
    await onTrash.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(fortress).build());

    expect(testHarness.hand.asCardArray()).toEqual([fortress]);
    expect(fortress.getLocation()).toBe(CardLocation.HAND);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.sharedTrash.contains(fortress)).toBe(false);
  });

  it('loses track of itself when it has left the trash and come back before its trigger resolves', async () => {
    const testHarness = createCardHarness();
    const fortress = new Fortress(testHarness.sharedGameState);
    fortress.setId('fortress-0');
    testHarness.addToInPlay(fortress);
    const lostTrack = vi.spyOn(testHarness.executor, 'sendLostTrackMessage');

    await testHarness.executor.trashCardFromLocation(fortress, CardLocation.IN_PLAY);
    const trashed = new EffectContextBuilder()
      .withTargetCard(fortress)
      .withLocationExpectation(testHarness.executor.createLocationExpectation(CardLocation.TRASH))
      .build();
    // e.g. something else took it out of the trash and then trashed it again
    testHarness.executor.putCardIntoHandFromLocation(fortress, CardLocation.TRASH);
    await testHarness.executor.trashCardFromLocation(fortress, CardLocation.HAND);
    const [onTrash] = testHarness.getCardEffects(fortress, EffectTriggerType.TRASH);
    await onTrash.doAction(testHarness.executor, trashed);

    expect(lostTrack).toHaveBeenCalledWith(fortress);
    expect(fortress.getLocation()).toBe(CardLocation.TRASH);
    expect(testHarness.sharedTrash.contains(fortress)).toBe(true);
    expect(testHarness.hand.size()).toBe(0);
  });

  it('moves into hand when it is still where it was trashed', async () => {
    const testHarness = createCardHarness();
    const fortress = new Fortress(testHarness.sharedGameState);
    fortress.setId('fortress-0');
    testHarness.addToInPlay(fortress);
    const lostTrack = vi.spyOn(testHarness.executor, 'sendLostTrackMessage');

    await testHarness.executor.trashCardFromLocation(fortress, CardLocation.IN_PLAY);
    const trashed = new EffectContextBuilder()
      .withTargetCard(fortress)
      .withLocationExpectation(testHarness.executor.createLocationExpectation(CardLocation.TRASH))
      .build();
    const [onTrash] = testHarness.getCardEffects(fortress, EffectTriggerType.TRASH);
    await onTrash.doAction(testHarness.executor, trashed);

    expect(lostTrack).not.toHaveBeenCalled();
    expect(testHarness.hand.asCardArray()).toEqual([fortress]);
    expect(testHarness.sharedTrash.contains(fortress)).toBe(false);
  });
});
