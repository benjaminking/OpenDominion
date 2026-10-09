import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Courser } from '../../../src/cards/cornucopia_and_guilds/Courser';
import { createCardHarness } from '../testHarness';

describe('Courser', () => {
  it('can choose +2 Cards and +2 Actions', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    testHarness.pickOptions(['+2 Cards', '+2 Actions']);
    await new Courser(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('can choose +$2 and gain 4 Silvers', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 5; cardIndex++) {
      const supplySilver = new Silver(testHarness.sharedGameState);
      supplySilver.setId(`silver-supply-${String(cardIndex)}`);
      testHarness.addSupplyPile(supplySilver);
    }

    testHarness.pickOptions(['+$2', 'Gain 4 Silvers']);
    await new Courser(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.discard.asCardArray().map((card) => card.getName())).toEqual([
      'Silver',
      'Silver',
      'Silver',
      'Silver',
    ]);
    expect(testHarness.piles.getPileSizeByName('Silver')).toBe(1);
  });
});
