import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { HuntingParty } from '../../../src/cards/cornucopia_and_guilds/HuntingParty';
import { createCardHarness } from '../testHarness';

describe('HuntingParty', () => {
  // BUG: createIsNotDuplicateWithHandCardEligibilityFunction is inverted, so it stops at the first duplicate
  it('puts the first revealed card that is not a copy of a hand card into hand and discards the rest', async () => {
    const testHarness = createCardHarness();
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-deck-0');
    const revealedSilver = new Silver(testHarness.sharedGameState);
    revealedSilver.setId('silver-deck-1');
    const revealedCopper = new Copper(testHarness.sharedGameState);
    revealedCopper.setId('copper-deck-0');
    const drawnSilver = new Silver(testHarness.sharedGameState);
    drawnSilver.setId('silver-deck-0');
    // Deck from the top: Silver (drawn), Copper, Silver, Gold, Estate
    testHarness.addToDeck(estate);
    testHarness.addToDeck(gold);
    testHarness.addToDeck(revealedSilver);
    testHarness.addToDeck(revealedCopper);
    testHarness.addToDeck(drawnSilver);

    await new HuntingParty(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.asCardArray()).toEqual([handCopper, drawnSilver, gold]);
    expect(testHarness.discard.asCardArray()).toEqual([revealedCopper, revealedSilver]);
    expect(testHarness.deck.asCardArray()).toEqual([estate]);
  });

  it('only gives +1 Card and +1 Action when the deck runs out', async () => {
    const testHarness = createCardHarness();
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    testHarness.addToDeck(silver);

    await new HuntingParty(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.asCardArray()).toEqual([handCopper, silver]);
    expect(testHarness.discard.size()).toBe(0);
  });
});
