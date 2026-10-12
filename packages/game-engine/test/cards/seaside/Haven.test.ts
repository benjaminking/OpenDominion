import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Haven } from '../../../src/cards/seaside/Haven';
import { EndOfPlayersNextTurnEffectExpiration } from '../../../src/effects/StandardEffectExpirations';
import { createCardHarness } from '../testHarness';

describe('Haven', () => {
  it('sets aside a chosen hand card and registers a duration effect', async () => {
    const testHarness = createCardHarness();
    const handCard = new Copper(testHarness.sharedGameState);
    handCard.setId('hand-copper');
    testHarness.addToHand(handCard);

    testHarness.pickCard(handCard);
    await new Haven(testHarness.sharedGameState).play(testHarness.executor);

    // card moved from hand to set-aside
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.effects.addEffect).toHaveBeenCalledTimes(1);
    expect(testHarness.effects.addEffect.mock.calls[0][0].getExpiration()).toBeInstanceOf(
      EndOfPlayersNextTurnEffectExpiration,
    );
  });

  it('gives +1 Card and +1 Action before setting a card aside', async () => {
    const testHarness = createCardHarness();
    const handCard = new Copper(testHarness.sharedGameState);
    handCard.setId('hand-copper');
    testHarness.addToHand(handCard);
    const deckCard = new Silver(testHarness.sharedGameState);
    deckCard.setId('deck-silver');
    testHarness.addToDeck(deckCard);

    testHarness.pickCard(handCard);
    await new Haven(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.asCardArray()).toEqual([deckCard]);
    expect(testHarness.deck.size()).toBe(0);
  });
});
