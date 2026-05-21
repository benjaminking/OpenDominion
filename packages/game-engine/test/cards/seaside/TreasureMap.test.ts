import { describe, expect, it } from 'vitest';

import { Gold } from '../../../src/cards/basic_cards/Gold';
import { TreasureMap } from '../../../src/cards/seaside/TreasureMap';
import { createCardHarness } from '../testHarness';

describe('TreasureMap', () => {
  it('trashes itself and a second Treasure Map from hand, then gains 4 Golds to deck', async () => {
    const testHarness = createCardHarness();
    const secondMap = new TreasureMap(testHarness.sharedGameState);
    secondMap.setId('map-2');
    testHarness.addToHand(secondMap);

    // Set up Gold supply pile with 4 cards
    for (let i = 0; i < 4; i++) {
      const gold = new Gold(testHarness.sharedGameState);
      gold.setId(`gold-${String(i)}`);
      testHarness.addSupplyPile(gold);
    }

    // The map being played must be in IN_PLAY (location check in trashCardFromLocation)
    const mapInPlay = new TreasureMap(testHarness.sharedGameState);
    mapInPlay.setId('map-1');
    testHarness.addToInPlay(mapInPlay);

    testHarness.pickCard(secondMap); // choose second map to trash
    await mapInPlay.play(testHarness.executor);

    // Both maps trashed (itself + secondMap)
    expect(testHarness.sharedTrash.size()).toBe(2);
    // 4 Golds gained to deck
    expect(testHarness.deck.size()).toBe(4);
  });

  it('trashes itself but gains no Golds when no second map in hand', async () => {
    const testHarness = createCardHarness();
    const mapInPlay = new TreasureMap(testHarness.sharedGameState);
    mapInPlay.setId('map-1');
    testHarness.addToInPlay(mapInPlay);

    // No second map available → choice returns ImpossibleChoice / no card chosen
    // (The allowNoneOption is not set, so it's ImpossibleChoice — implementation skips gain)
    await mapInPlay.play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(0);
  });
});
