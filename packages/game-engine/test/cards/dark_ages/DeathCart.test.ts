import { CardChoice, ChoiceType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { AbandonedMine } from '../../../src/cards/dark_ages/AbandonedMine';
import { DeathCart } from '../../../src/cards/dark_ages/DeathCart';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('DeathCart', () => {
  it('may trash an Action card from hand for +$5', async () => {
    const testHarness = createCardHarness();
    const deathCart = new DeathCart(testHarness.sharedGameState);
    deathCart.setId('death-cart-0');
    testHarness.addToInPlay(deathCart);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);

    testHarness.pickCard(village);
    await deathCart.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(5);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([village]);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.inPlay.asCardArray()).toEqual([deathCart]);
  });

  it('may choose not to trash anything', async () => {
    const testHarness = createCardHarness();
    const deathCart = new DeathCart(testHarness.sharedGameState);
    deathCart.setId('death-cart-0');
    testHarness.addToInPlay(deathCart);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);

    testHarness.decisionService.chooseCard.mockResolvedValueOnce({ type: ChoiceType.None });
    await deathCart.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.asCardArray()).toEqual([village]);
    expect(testHarness.inPlay.asCardArray()).toEqual([deathCart]);
  });

  it('cannot trash a non-Action card from hand', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);

    testHarness.pickCard(copper);
    await new DeathCart(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.hand.asCardArray()).toEqual([copper]);
  });

  it('may trash itself from play for +$5', async () => {
    const testHarness = createCardHarness();
    const deathCart = new DeathCart(testHarness.sharedGameState);
    deathCart.setId('death-cart-0');
    testHarness.addToInPlay(deathCart);

    testHarness.pickCard(deathCart);
    await deathCart.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(5);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([deathCart]);
    expect(testHarness.inPlay.size()).toBe(0);
  });

  it('offers only itself and Action cards in hand', async () => {
    const testHarness = createCardHarness();
    const deathCart = new DeathCart(testHarness.sharedGameState);
    deathCart.setId('death-cart-0');
    testHarness.addToInPlay(deathCart);
    const villageInPlay = new Village(testHarness.sharedGameState);
    villageInPlay.setId('village-in-play-0');
    testHarness.addToInPlay(villageInPlay);
    const smithyInHand = new Smithy(testHarness.sharedGameState);
    smithyInHand.setId('smithy-hand-0');
    testHarness.addToHand(smithyInHand);
    const copperInHand = new Copper(testHarness.sharedGameState);
    copperInHand.setId('copper-hand-0');
    testHarness.addToHand(copperInHand);

    await deathCart.play(testHarness.executor);

    const offeredChoices = testHarness.decisionService.chooseCard.mock.calls[0] as unknown[];
    const offeredIds = (offeredChoices[3] as CardChoice[]).map((choice) => choice.card.id).sort();
    expect(offeredIds).toEqual(['death-cart-0', 'smithy-hand-0']);
  });

  it('when gained, gains 2 Ruins', async () => {
    const testHarness = createCardHarness();
    const deathCart = new DeathCart(testHarness.sharedGameState);
    deathCart.setId('death-cart-0');
    testHarness.addToDiscard(deathCart);
    for (let cardIndex = 0; cardIndex < 3; cardIndex++) {
      const ruins = new AbandonedMine(testHarness.sharedGameState);
      ruins.setId(`ruins-supply-${String(cardIndex)}`);
      testHarness.addSupplyPile(ruins);
    }

    const [onGain] = testHarness.getCardEffects(deathCart, EffectTriggerType.GAIN);
    await onGain.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(deathCart).withGainLocation(deathCart.getLocation()).build());

    expect(testHarness.discard.size()).toBe(3);
    expect(testHarness.discard.asCardArray().filter((card) => card.getPileName() === 'Ruins')).toHaveLength(2);
    expect(testHarness.pileCards.get('Ruins')).toHaveLength(1);
  });

  it('when gained with only 1 Ruins left, gains just that one', async () => {
    const testHarness = createCardHarness();
    const deathCart = new DeathCart(testHarness.sharedGameState);
    deathCart.setId('death-cart-0');
    const ruins = new AbandonedMine(testHarness.sharedGameState);
    ruins.setId('ruins-supply-0');
    testHarness.addSupplyPile(ruins);

    const [onGain] = testHarness.getCardEffects(deathCart, EffectTriggerType.GAIN);
    await onGain.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(deathCart).withGainLocation(deathCart.getLocation()).build());

    expect(testHarness.discard.asCardArray()).toEqual([ruins]);
    expect(testHarness.pileCards.get('Ruins')).toEqual([]);
  });
});
