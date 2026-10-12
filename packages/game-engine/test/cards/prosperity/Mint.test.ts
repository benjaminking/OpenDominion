import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Mint } from '../../../src/cards/prosperity/Mint';
import { Astrolabe } from '../../../src/cards/seaside/Astrolabe';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Mint', () => {
  it('reveals a Treasure from hand and gains a copy of it', async () => {
    const testHarness = createCardHarness();
    const handSilver = new Silver(testHarness.sharedGameState);
    handSilver.setId('silver-hand-0');
    testHarness.addToHand(handSilver);
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    testHarness.addSupplyPile(supplySilver);

    testHarness.pickCard(handSilver);
    await new Mint(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['silver-hand-0']);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['silver-supply-0']);
  });

  it('gains nothing when no Treasure is revealed', async () => {
    const testHarness = createCardHarness();
    const handSilver = new Silver(testHarness.sharedGameState);
    handSilver.setId('silver-hand-0');
    testHarness.addToHand(handSilver);
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    testHarness.addSupplyPile(supplySilver);

    // default: choice returns none
    await new Mint(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Silver')).toHaveLength(1);
  });

  it('does not prompt when there is no Treasure in hand', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    await new Mint(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
    expect(testHarness.discard.size()).toBe(0);
  });

  it('trashes all non-Duration Treasures in play when gained', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-in-play-0');
    testHarness.addToInPlay(copper);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-in-play-0');
    testHarness.addToInPlay(silver);
    const astrolabe = new Astrolabe(testHarness.sharedGameState);
    astrolabe.setId('astrolabe-in-play-0');
    testHarness.addToInPlay(astrolabe);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-in-play-0');
    testHarness.addToInPlay(village);
    const mint = new Mint(testHarness.sharedGameState);
    mint.setId('mint-supply-0');
    testHarness.addSupplyPile(mint);

    await testHarness.executor.gainCardFromPile(mint);
    const gainEffects = testHarness.getCardEffects(mint, EffectTriggerType.GAIN);
    expect(gainEffects).toHaveLength(1);
    expect(gainEffects[0].isMandatory()).toBe(true);
    expect(gainEffects[0].areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
    await gainEffects[0].doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(mint).withGainLocation(mint.getLocation()).build());

    expect(testHarness.inPlay.asCardArray().map((card) => card.getId())).toEqual([
      'astrolabe-in-play-0',
      'village-in-play-0',
    ]);
    expect(
      testHarness.sharedTrash
        .asCardArray()
        .map((card) => card.getId())
        .sort(),
    ).toEqual(['copper-in-play-0', 'silver-in-play-0']);
    expect(testHarness.discard.contains(mint)).toBe(true);
  });

  it('only triggers on gaining this Mint, not other cards or other Mints', () => {
    const testHarness = createCardHarness();
    const mint = new Mint(testHarness.sharedGameState);
    mint.setId('mint-supply-0');
    testHarness.addSupplyPile(mint);
    const otherMint = new Mint(testHarness.sharedGameState);
    otherMint.setId('mint-supply-1');

    const gainEffect = testHarness.getCardEffects(mint, EffectTriggerType.GAIN)[0];

    expect(gainEffect.getCardEligibility().matches(mint)).toBe(true);
    expect(gainEffect.getCardEligibility().matches(otherMint)).toBe(false);
  });

  it('gains nothing when the Supply pile of the revealed Treasure is empty', async () => {
    const testHarness = createCardHarness();
    const handSilver = new Silver(testHarness.sharedGameState);
    handSilver.setId('silver-hand-0');
    testHarness.addToHand(handSilver);

    testHarness.pickCard(handSilver);
    await new Mint(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.decisionService.chooseCard).toHaveBeenCalledTimes(1);
    expect(testHarness.hand.asCardArray().map((card) => card.getId())).toEqual(['silver-hand-0']);
    expect(testHarness.discard.size()).toBe(0);
  });
});
