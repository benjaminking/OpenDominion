import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Bank } from '../../../src/cards/prosperity/Bank';
import { createCardHarness } from '../testHarness';

describe('Bank', () => {
  it('adds $1 per Treasure in play, counting itself', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-play-0');
    testHarness.addToInPlay(copper);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-in-play-0');
    testHarness.addToInPlay(silver);
    // Non-Treasures in play and Treasures still in hand don't count
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-in-play-0');
    testHarness.addToInPlay(village);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-hand-0');
    testHarness.addToHand(gold);
    const bank = new Bank(testHarness.sharedGameState);
    bank.setId('bank-hand-0');
    testHarness.addToHand(bank);

    await testHarness.executor.playCardFromHand(bank);

    expect(testHarness.stats.coins).toBe(3);
  });

  it('adds $1 when it is the only Treasure in play', async () => {
    const testHarness = createCardHarness();
    const bank = new Bank(testHarness.sharedGameState);
    bank.setId('bank-hand-0');
    testHarness.addToHand(bank);

    await testHarness.executor.playCardFromHand(bank);

    expect(testHarness.stats.coins).toBe(1);
  });
});
