import { CardChoice } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { KingsCourt } from '../../../src/cards/prosperity/KingsCourt';
import { createCardHarness } from '../testHarness';

describe('KingsCourt', () => {
  it('plays the chosen Action card three times', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }

    testHarness.pickCard(village);
    await new KingsCourt(testHarness.sharedGameState).play(testHarness.executor);

    const offeredChoices = (testHarness.decisionService.chooseCard.mock.calls[0] as unknown[])[3] as CardChoice[];
    expect(offeredChoices.map((choice) => choice.card.id)).toEqual(['village-hand-0']);
    // Village (+1 Card, +2 Actions) three times
    expect(testHarness.hand.size()).toBe(4);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(6);
    expect(testHarness.inPlay.asCardArray().map((card) => card.getId())).toEqual(['village-hand-0']);
  });

  it('does nothing when no card is chosen', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);

    // default: choice returns none
    await new KingsCourt(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.contains(village)).toBe(true);
    expect(testHarness.stats.actions).toBe(0);
  });

  it('does nothing when there is no Action card in hand', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);

    await new KingsCourt(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.inPlay.size()).toBe(0);
  });
});
