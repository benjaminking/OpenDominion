import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Shop } from '../../../src/cards/cornucopia_and_guilds/Shop';
import { CardHarness, createCardHarness } from '../testHarness';

const putShopInPlay = (testHarness: CardHarness): Shop => {
  const shop = new Shop(testHarness.sharedGameState);
  shop.setId('shop-0');
  testHarness.addToInPlay(shop);
  return shop;
};

describe('Shop', () => {
  it('gives +1 Card and +$1, and plays nothing when declined', async () => {
    const testHarness = createCardHarness();
    const shop = putShopInPlay(testHarness);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);

    await shop.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.hand.asCardArray()).toEqual([village, copper]);
    expect(testHarness.inPlay.asCardArray()).toEqual([shop]);
  });

  // BUG: the duplicate check is inverted so this Action is not offered, and playCardFromHand would also use an Action
  it('plays an Action from hand that has no copy in play, without using an Action', async () => {
    const testHarness = createCardHarness();
    const shop = putShopInPlay(testHarness);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck-0');
    testHarness.addToDeck(estate);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);

    testHarness.pickCard(village);
    await shop.play(testHarness.executor);

    expect(testHarness.inPlay.asCardArray()).toEqual([shop, village]);
    expect(testHarness.hand.asCardArray()).toEqual([copper, estate]);
    expect(testHarness.stats.actions).toBe(2);
  });

  // BUG: the duplicate check is inverted, so an Action with a copy in play is offered and played
  it('cannot play an Action that already has a copy in play', async () => {
    const testHarness = createCardHarness();
    const shop = putShopInPlay(testHarness);
    const playedSmithy = new Smithy(testHarness.sharedGameState);
    playedSmithy.setId('smithy-in-play-0');
    testHarness.addToInPlay(playedSmithy);
    for (let cardIndex = 0; cardIndex < 4; cardIndex++) {
      const deckCopper = new Copper(testHarness.sharedGameState);
      deckCopper.setId(`copper-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckCopper);
    }
    const handSmithy = new Smithy(testHarness.sharedGameState);
    handSmithy.setId('smithy-hand-0');
    testHarness.addToHand(handSmithy);

    testHarness.pickCard(handSmithy);
    await shop.play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.hand.contains(handSmithy)).toBe(true);
    expect(testHarness.inPlay.asCardArray()).toEqual([shop, playedSmithy]);
  });
});
