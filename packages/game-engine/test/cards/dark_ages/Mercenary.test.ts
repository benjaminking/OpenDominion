import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Mercenary } from '../../../src/cards/dark_ages/Mercenary';
import { CardHarness, createCardHarness } from '../testHarness';

const addCoppersToHand = (harness: CardHarness, prefix: string, count: number): Copper[] => {
  const coppers: Copper[] = [];
  for (let i = 0; i < count; i++) {
    const copper = new Copper(harness.sharedGameState);
    copper.setId(`${prefix}-${String(i)}`);
    coppers.push(copper);
    harness.addToHand(copper);
  }
  return coppers;
};

const setUp = (numTargetHandCards: number) => {
  const testHarness = createCardHarness();
  const targetHarness = createCardHarness();
  testHarness.routeAttacksTo(targetHarness);
  const handEstate = new Estate(testHarness.sharedGameState);
  handEstate.setId('estate-hand-0');
  testHarness.addToHand(handEstate);
  const handCopper = new Copper(testHarness.sharedGameState);
  handCopper.setId('copper-hand-0');
  testHarness.addToHand(handCopper);
  for (let i = 0; i < 3; i++) {
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(i)}`);
    testHarness.addToDeck(deckCopper);
  }
  const targetHand = addCoppersToHand(targetHarness, 'copper-target-hand', numTargetHandCards);
  return { testHarness, targetHarness, handEstate, handCopper, targetHand };
};

describe('Mercenary', () => {
  it('trashing 2 cards gives +2 Cards, +$2 and makes each other player discard down to 3', async () => {
    const { testHarness, targetHarness, handEstate, handCopper, targetHand } = setUp(5);

    testHarness.pickCards([handEstate, handCopper]);
    targetHarness.pickCards([targetHand[0], targetHand[1]]);
    await new Mercenary(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray().map((card) => card.getId())).toEqual([
      'estate-hand-0',
      'copper-hand-0',
    ]);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.coins).toBe(2);
    expect(targetHarness.hand.size()).toBe(3);
    expect(targetHarness.discard.size()).toBe(2);
  });

  it('trashing nothing gives no bonus and does not attack', async () => {
    const { testHarness, targetHarness } = setUp(5);

    await new Mercenary(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.stats.coins).toBe(0);
    expect(targetHarness.hand.size()).toBe(5);
  });

  it('attack does not make a player with 3 or fewer cards discard', async () => {
    const { testHarness, targetHarness, handEstate, handCopper } = setUp(3);

    testHarness.pickCards([handEstate, handCopper]);
    await new Mercenary(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(3);
    expect(targetHarness.discard.size()).toBe(0);
  });
});
