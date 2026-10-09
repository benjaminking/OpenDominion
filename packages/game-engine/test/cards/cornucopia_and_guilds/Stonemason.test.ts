import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Stonemason } from '../../../src/cards/cornucopia_and_guilds/Stonemason';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Stonemason', () => {
  it('trashes a card from hand and gains 2 cards each costing less than it', async () => {
    const testHarness = createCardHarness();
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-hand-0');
    testHarness.addToHand(gold);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-supply-0');
    testHarness.addSupplyPile(estate);

    testHarness.pickCard(gold);
    testHarness.pickCard(silver);
    testHarness.pickCard(estate);
    await new Stonemason(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([gold]);
    expect(testHarness.discard.asCardArray()).toEqual([silver, estate]);
  });

  it('cannot gain cards costing the same as or more than the trashed card', async () => {
    const testHarness = createCardHarness();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);
    const supplyEstate = new Estate(testHarness.sharedGameState);
    supplyEstate.setId('estate-supply-0');
    testHarness.addSupplyPile(supplyEstate);

    testHarness.pickCard(handEstate);
    testHarness.pickCard(supplyEstate);
    await new Stonemason(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray()).toEqual([handEstate]);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('does nothing with an empty hand', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-supply-0');
    testHarness.addSupplyPile(estate);

    await new Stonemason(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('overpay gains 2 Action cards each costing exactly the amount overpaid', async () => {
    const testHarness = createCardHarness();
    const stonemason = new Stonemason(testHarness.sharedGameState);
    stonemason.setId('stonemason-0');
    const villageA = new Village(testHarness.sharedGameState);
    villageA.setId('village-supply-0');
    testHarness.addSupplyPile(villageA);
    const villageB = new Village(testHarness.sharedGameState);
    villageB.setId('village-supply-1');
    testHarness.addSupplyPile(villageB);
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);
    testHarness.stats.coins = 3;

    testHarness.pickOption('$3');
    testHarness.pickCard(villageA);
    testHarness.pickCard(villageB);
    const [buyEffect] = testHarness.getCardEffects(stonemason, EffectTriggerType.BUY);
    await buyEffect.doAction(testHarness.executor, stonemason);

    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.discard.asCardArray()).toEqual([villageA, villageB]);
  });

  it('overpay cannot gain a non-Action card', async () => {
    const testHarness = createCardHarness();
    const stonemason = new Stonemason(testHarness.sharedGameState);
    stonemason.setId('stonemason-0');
    // Silver costs $3 but is not an Action
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);
    testHarness.stats.coins = 3;

    testHarness.pickOption('$3');
    testHarness.pickCard(silver);
    const [buyEffect] = testHarness.getCardEffects(stonemason, EffectTriggerType.BUY);
    await buyEffect.doAction(testHarness.executor, stonemason);

    expect(testHarness.discard.size()).toBe(0);
  });

  it('gains nothing when not overpaying', async () => {
    const testHarness = createCardHarness();
    const stonemason = new Stonemason(testHarness.sharedGameState);
    stonemason.setId('stonemason-0');
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');
    testHarness.addSupplyPile(village);
    testHarness.stats.coins = 3;

    testHarness.pickOption("Don't overpay");
    const [buyEffect] = testHarness.getCardEffects(stonemason, EffectTriggerType.BUY);
    await buyEffect.doAction(testHarness.executor, stonemason);

    expect(testHarness.stats.coins).toBe(3);
    expect(testHarness.discard.size()).toBe(0);
  });
});
