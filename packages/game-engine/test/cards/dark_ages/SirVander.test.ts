import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { SirVander } from '../../../src/cards/dark_ages/SirVander';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('SirVander', () => {
  it('makes each other player trash a revealed card costing $3-$6 and gives no other bonus', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    const sirVander = new SirVander(testHarness.sharedGameState);
    sirVander.setId('sir-vander-in-play');
    testHarness.addToInPlay(sirVander);
    const targetCopper = new Copper(targetHarness.sharedGameState);
    targetCopper.setId('copper-target-deck');
    targetHarness.addToDeck(targetCopper);
    const targetSilver = new Silver(targetHarness.sharedGameState);
    targetSilver.setId('silver-target-deck');
    targetHarness.addToDeck(targetSilver);

    await sirVander.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray().map((card) => card.getId())).toEqual(['silver-target-deck']);
    expect(targetHarness.deck.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
  });

  it('gains a Gold when trashed', async () => {
    const testHarness = createCardHarness();
    const sirVander = new SirVander(testHarness.sharedGameState);
    sirVander.setId('sir-vander-0');
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    testHarness.addSupplyPile(gold);

    const [onTrash] = testHarness.getCardEffects(sirVander, EffectTriggerType.TRASH);
    expect(onTrash.isMandatory()).toBe(true);
    await onTrash.doAction(testHarness.executor, CardCollection.fromCards([sirVander]));

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['gold-supply-0']);
  });

  it('on-trash effect only applies to this Sir Vander', () => {
    const testHarness = createCardHarness();
    const sirVander = new SirVander(testHarness.sharedGameState);
    sirVander.setId('sir-vander-0');
    const otherSirVander = new SirVander(testHarness.sharedGameState);
    otherSirVander.setId('sir-vander-1');

    const [onTrash] = testHarness.getCardEffects(sirVander, EffectTriggerType.TRASH);

    expect(onTrash.isSelf()).toBe(true);
    expect(onTrash.getCardEligibility().matches(sirVander)).toBe(true);
    expect(onTrash.getCardEligibility().matches(otherSirVander)).toBe(false);
  });

  it('gains a Gold from the Supply pile named "Gold" when trashed', async () => {
    const testHarness = createCardHarness();
    const sirVander = new SirVander(testHarness.sharedGameState);
    sirVander.setId('sir-vander-0');
    const gold = new Gold(testHarness.sharedGameState);
    gold.setId('gold-supply-0');
    // Register the pile only under its real name, as Piles does in a real game.
    testHarness.pileCards.set('Gold', [gold]);

    const [onTrash] = testHarness.getCardEffects(sirVander, EffectTriggerType.TRASH);
    await onTrash.doAction(testHarness.executor, CardCollection.fromCards([sirVander]));

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['gold-supply-0']);
  });
});
