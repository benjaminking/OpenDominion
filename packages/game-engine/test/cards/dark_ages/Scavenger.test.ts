import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Scavenger } from '../../../src/cards/dark_ages/Scavenger';
import { createCardHarness } from '../testHarness';

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

const setUp = () => {
  const testHarness = createCardHarness();
  const deckCopper = new Copper(testHarness.sharedGameState);
  deckCopper.setId('copper-deck-0');
  testHarness.addToDeck(deckCopper);
  const deckGold = new Gold(testHarness.sharedGameState);
  deckGold.setId('gold-deck-1');
  testHarness.addToDeck(deckGold);
  const discardEstate = new Estate(testHarness.sharedGameState);
  discardEstate.setId('estate-discard-0');
  testHarness.addToDiscard(discardEstate);
  const discardSilver = new Silver(testHarness.sharedGameState);
  discardSilver.setId('silver-discard-1');
  testHarness.addToDiscard(discardSilver);
  return { testHarness, deckCopper, deckGold, discardEstate, discardSilver };
};

describe('Scavenger', () => {
  it('gives +$2 and puts a chosen card from the discard pile onto the deck', async () => {
    const { testHarness, discardSilver } = setUp();

    testHarness.pickOption('No');
    testHarness.pickCard(discardSilver);
    await new Scavenger(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(idsOf(testHarness.deck)).toEqual(['copper-deck-0', 'gold-deck-1', 'silver-discard-1']);
    expect(idsOf(testHarness.discard)).toEqual(['estate-discard-0']);
  });

  it('may put the deck into the discard pile before choosing a card', async () => {
    const { testHarness, discardSilver } = setUp();

    testHarness.pickOption('Yes');
    testHarness.pickCard(discardSilver);
    await new Scavenger(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.deck)).toEqual(['silver-discard-1']);
    expect(idsOf(testHarness.discard).sort()).toEqual(['copper-deck-0', 'estate-discard-0', 'gold-deck-1']);
  });

  it('can put a card that was in the deck back on top after putting the deck into the discard pile', async () => {
    const { testHarness, deckCopper, deckGold } = setUp();

    testHarness.pickOption('Yes');
    testHarness.pickCard(deckGold);
    await new Scavenger(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.deck)).toEqual(['gold-deck-1']);
    expect(deckCopper.getLocation()).toBe(CardLocation.DISCARD);
  });

  it('only gives +$2 when the discard pile is empty and the deck is kept', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    testHarness.pickOption('No');
    await new Scavenger(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(idsOf(testHarness.deck)).toEqual(['copper-deck-0']);
    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
  });
});
