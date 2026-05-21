import { describe, expect, it } from 'vitest';

import { CouncilRoom } from '../../../src/cards/base_game/CouncilRoom';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { createCardHarness } from '../testHarness';

describe('CouncilRoom', () => {
  it('draws 4 cards and adds 1 buy for self', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    await new CouncilRoom(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(4);
    expect(testHarness.stats.buys).toBe(1);
  });

  it('interaction draws 1 card for the target player', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetDeckCopper = new Copper(targetHarness.sharedGameState);
    targetDeckCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(targetDeckCopper);

    await new CouncilRoom(testHarness.sharedGameState).interaction(targetHarness.executor);

    expect(targetHarness.hand.size()).toBe(1);
  });
});
