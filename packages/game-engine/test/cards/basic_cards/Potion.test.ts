import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Potion } from '../../../src/cards/basic_cards/Potion';
import { createCardHarness } from '../testHarness';

describe('Potion', () => {
  it('is a simple Treasure costing $4 and worth no coins', () => {
    const testHarness = createCardHarness();
    const potion = new Potion(testHarness.sharedGameState);

    expect(potion.getName()).toBe('Potion');
    expect(potion.hasType(CardType.TREASURE)).toBe(true);
    expect(potion.isSimpleTreasure()).toBe(true);
    expect(potion.getCoins()).toBe(0);
    expect(potion.getCost().coins).toBe(4);
    expect(potion.getCost().potions).toBe(0);
  });

  it('adds 1 Potion and no coins when played', async () => {
    const testHarness = createCardHarness();
    const potion = new Potion(testHarness.sharedGameState);

    await potion.play(testHarness.executor);

    expect(testHarness.stats.potions).toBe(1);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('adds another Potion each time it is played', async () => {
    const testHarness = createCardHarness();
    const firstPotion = new Potion(testHarness.sharedGameState);
    firstPotion.setId('potion-0');
    const secondPotion = new Potion(testHarness.sharedGameState);
    secondPotion.setId('potion-1');

    await firstPotion.play(testHarness.executor);
    await secondPotion.play(testHarness.executor);

    expect(testHarness.stats.potions).toBe(2);
  });
});
