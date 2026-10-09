import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Herald } from '../../../src/cards/cornucopia_and_guilds/Herald';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

// Deck from the top: Copper (drawn by Herald), Village (revealed), Estate (drawn by Village)
const setUpDeckWithVillage = (testHarness: CardHarness) => {
  const estate = new Estate(testHarness.sharedGameState);
  estate.setId('estate-deck-0');
  testHarness.addToDeck(estate);
  const village = new Village(testHarness.sharedGameState);
  village.setId('village-deck-0');
  testHarness.addToDeck(village);
  const copper = new Copper(testHarness.sharedGameState);
  copper.setId('copper-deck-0');
  testHarness.addToDeck(copper);
  return { copper, village, estate };
};

describe('Herald', () => {
  it('gives +1 Card and +1 Action, then plays a revealed Action from the top of the deck', async () => {
    const testHarness = createCardHarness();
    const { copper, village, estate } = setUpDeckWithVillage(testHarness);

    await new Herald(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(3);
    expect(testHarness.hand.asCardArray()).toEqual([copper, estate]);
    expect(testHarness.deck.contains(village)).toBe(false);
    expect(testHarness.deck.size()).toBe(0);
  });

  // BUG: playCardFromLocation removes the card from the deck but never puts it into play
  it('moves the revealed Action into play', async () => {
    const testHarness = createCardHarness();
    const { village } = setUpDeckWithVillage(testHarness);

    await new Herald(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.inPlay.asCardArray()).toEqual([village]);
  });

  it('leaves a revealed non-Action on top of the deck', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    testHarness.addToDeck(estate);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);

    await new Herald(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.asCardArray()).toEqual([copper]);
    expect(testHarness.deck.asCardArray()).toEqual([estate]);
  });

  // BUG: the overpay card choice is not awaited, so the chosen card is never put onto the deck
  it('overpay puts a card from the discard pile onto the deck per $1 overpaid', async () => {
    const testHarness = createCardHarness();
    const herald = new Herald(testHarness.sharedGameState);
    herald.setId('herald-0');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-discard-0');
    testHarness.addToDiscard(silver);
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-discard-0');
    testHarness.addToDiscard(gold);
    testHarness.stats.coins = 2;

    testHarness.pickOption('$1');
    testHarness.pickCard(gold);
    const [buyEffect] = testHarness.getCardEffects(herald, EffectTriggerType.BUY);
    await buyEffect.doAction(testHarness.executor, herald);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.deck.asCardArray()).toEqual([gold]);
    expect(testHarness.discard.asCardArray()).toEqual([silver]);
  });
});
