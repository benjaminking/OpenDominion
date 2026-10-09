import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { BanditCamp } from '../../../src/cards/dark_ages/BanditCamp';
import { Spoils } from '../../../src/cards/dark_ages/Spoils';
import { createCardHarness } from '../testHarness';

describe('BanditCamp', () => {
  it('draws 1 card, gives +2 Actions, and gains a Spoils', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }
    const spoils = new Spoils(testHarness.sharedGameState);
    spoils.setId('spoils-pile-0');
    testHarness.addSupplyPile(spoils);

    await new BanditCamp(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.discard.asCardArray()).toEqual([spoils]);
    expect(testHarness.pileCards.get('Spoils')).toEqual([]);
  });

  it('still draws and gives actions when the Spoils pile is empty', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);
    testHarness.pileCards.set('Spoils', []);

    await new BanditCamp(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.discard.size()).toBe(0);
  });
});
