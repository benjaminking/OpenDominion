import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Infirmary } from '../../../src/cards/cornucopia_and_guilds/Infirmary';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

// Bought Infirmary in the discard pile, Copper and Silver in the deck, Estate and Curse in hand.
const setUpOverpay = (testHarness: CardHarness) => {
  const infirmary = new Infirmary(testHarness.sharedGameState);
  infirmary.setId('infirmary-0');
  testHarness.addToDiscard(infirmary);
  const silver = new Silver(testHarness.sharedGameState);
  silver.setId('silver-deck-0');
  testHarness.addToDeck(silver);
  const copper = new Copper(testHarness.sharedGameState);
  copper.setId('copper-deck-0');
  testHarness.addToDeck(copper);
  const estate = new Estate(testHarness.sharedGameState);
  estate.setId('estate-hand-0');
  testHarness.addToHand(estate);
  const curse = new Curse(testHarness.sharedGameState);
  curse.setId('curse-hand-0');
  testHarness.addToHand(curse);
  testHarness.stats.coins = 2;
  return { infirmary, silver, copper, estate, curse };
};

describe('Infirmary', () => {
  it('gives +1 Card and trashes a chosen card from hand', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    testHarness.pickCard(estate);
    await new Infirmary(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([copper]);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([estate]);
  });

  it('trashing is optional', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    await new Infirmary(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('overpay plays it once per $1 overpaid', async () => {
    const testHarness = createCardHarness();
    const { infirmary, silver, copper, estate, curse } = setUpOverpay(testHarness);

    testHarness.pickOption('$2');
    testHarness.pickCard(estate);
    testHarness.pickCard(curse);
    const [buyEffect] = testHarness.getCardEffects(infirmary, EffectTriggerType.BUY);
    await buyEffect.doAction(testHarness.executor, infirmary);

    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.hand.asCardArray()).toEqual([copper, silver]);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([estate, curse]);
  });

  // BUG: playCardFromLocation removes Infirmary from the discard pile without putting it anywhere, so it is lost
  it('is still in the discard pile or in play after being played by overpaying', async () => {
    const testHarness = createCardHarness();
    const { infirmary } = setUpOverpay(testHarness);

    testHarness.pickOption('$1');
    const [buyEffect] = testHarness.getCardEffects(infirmary, EffectTriggerType.BUY);
    await buyEffect.doAction(testHarness.executor, infirmary);

    const ownedCards = [...testHarness.discard.asCardArray(), ...testHarness.inPlay.asCardArray()];
    expect(ownedCards).toContain(infirmary);
  });

  it('does nothing extra when not overpaying', async () => {
    const testHarness = createCardHarness();
    const { infirmary } = setUpOverpay(testHarness);

    testHarness.pickOption("Don't overpay");
    const [buyEffect] = testHarness.getCardEffects(infirmary, EffectTriggerType.BUY);
    await buyEffect.doAction(testHarness.executor, infirmary);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.discard.asCardArray()).toEqual([infirmary]);
  });
});
