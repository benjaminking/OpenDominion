import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Inn } from '../../../src/cards/hinterlands/Inn';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const setUpGainedInn = (testHarness: CardHarness) => {
  const deckSilver = new Silver(testHarness.sharedGameState);
  deckSilver.setId('silver-deck-0');
  testHarness.addToDeck(deckSilver);
  const village = new Village(testHarness.sharedGameState);
  village.setId('village-discard-0');
  testHarness.addToDiscard(village);
  const copper = new Copper(testHarness.sharedGameState);
  copper.setId('copper-discard-0');
  testHarness.addToDiscard(copper);
  const inn = new Inn(testHarness.sharedGameState);
  inn.setId('inn-gained');
  testHarness.addToDiscard(inn);
  return { inn, village, copper };
};

describe('Inn', () => {
  it('draws 2 cards, adds 2 actions, then discards 2 cards', async () => {
    const testHarness = createCardHarness();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    const deckSilvers: Silver[] = [];
    for (let i = 0; i < 2; i++) {
      const deckSilver = new Silver(testHarness.sharedGameState);
      deckSilver.setId(`silver-deck-${String(i)}`);
      testHarness.addToDeck(deckSilver);
      deckSilvers.push(deckSilver);
    }

    testHarness.pickCards([handEstate, deckSilvers[0]]);
    await new Inn(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.discard.contains(handEstate)).toBe(true);
    expect(testHarness.discard.contains(deckSilvers[0])).toBe(true);
  });

  it('when gained, shuffles the chosen Action cards from the discard pile into the deck', async () => {
    const testHarness = createCardHarness();
    const { inn, village, copper } = setUpGainedInn(testHarness);
    const [onGain] = testHarness.getCardEffects(inn, EffectTriggerType.GAIN);

    testHarness.pickCards([inn, village]);
    await onGain.doAction(testHarness.executor, inn);

    expect(testHarness.deck.size()).toBe(3);
    expect(testHarness.deck.contains(inn)).toBe(true);
    expect(testHarness.deck.contains(village)).toBe(true);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual([copper.getId()]);
  });

  it('when gained, leaves the discard pile alone if no cards are chosen', async () => {
    const testHarness = createCardHarness();
    const { inn } = setUpGainedInn(testHarness);
    const [onGain] = testHarness.getCardEffects(inn, EffectTriggerType.GAIN);

    await onGain.doAction(testHarness.executor, inn);

    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.discard.size()).toBe(3);
  });
});
