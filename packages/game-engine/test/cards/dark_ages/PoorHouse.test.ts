import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { PoorHouse } from '../../../src/cards/dark_ages/PoorHouse';
import { CardHarness, createCardHarness } from '../testHarness';

const addCoppersToHand = (harness: CardHarness, count: number): void => {
  for (let i = 0; i < count; i++) {
    const handCopper = new Copper(harness.sharedGameState);
    handCopper.setId(`copper-hand-${String(i)}`);
    harness.addToHand(handCopper);
  }
};

describe('PoorHouse', () => {
  it('gives +$4 when there are no Treasures in hand', async () => {
    const testHarness = createCardHarness();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);

    await new PoorHouse(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(4);
  });

  it('gives -$1 per Treasure in hand', async () => {
    const testHarness = createCardHarness();
    addCoppersToHand(testHarness, 1);
    const handSilver = new Silver(testHarness.sharedGameState);
    handSilver.setId('silver-hand-0');
    testHarness.addToHand(handSilver);
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);

    await new PoorHouse(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.hand.size()).toBe(3);
  });

  it('can reduce coins made earlier in the turn', async () => {
    const testHarness = createCardHarness();
    testHarness.stats.coins = 3;
    addCoppersToHand(testHarness, 5);

    await new PoorHouse(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
  });

  it('cannot take coins below $0', async () => {
    const testHarness = createCardHarness();
    addCoppersToHand(testHarness, 6);

    await new PoorHouse(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(0);
  });
});
