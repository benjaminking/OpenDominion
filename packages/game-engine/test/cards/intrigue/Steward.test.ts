import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Steward } from '../../../src/cards/intrigue/Steward';
import { createCardHarness } from '../testHarness';

describe('Steward', () => {
  it('draws 2 cards when +2 Cards is chosen', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 4; i++) {
      const deckCard = new Copper(testHarness.sharedGameState);
      deckCard.setId(`deck-copper-${String(i)}`);
      testHarness.addToDeck(deckCard);
    }

    testHarness.pickOption('+2 Cards');
    await new Steward(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
  });

  it('adds 2 coins when +$2 is chosen', async () => {
    const testHarness = createCardHarness();
    testHarness.pickOption('+$2');
    await new Steward(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.stats.coins).toBe(2);
  });

  it('trashes 2 chosen cards when trash option chosen', async () => {
    const testHarness = createCardHarness();
    const firstHandCard = new Copper(testHarness.sharedGameState);
    firstHandCard.setId('first-hand-copper');
    const secondHandCard = new Copper(testHarness.sharedGameState);
    secondHandCard.setId('second-hand-copper');
    testHarness.addToHand(firstHandCard);
    testHarness.addToHand(secondHandCard);

    testHarness.pickOption('Trash 2 cards from your hand.');
    testHarness.pickCards([firstHandCard, secondHandCard]);
    await new Steward(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(2);
    expect(testHarness.hand.size()).toBe(0);
  });
});
