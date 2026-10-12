import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Militia } from '../../../src/cards/base_game/Militia';
import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Squire } from '../../../src/cards/dark_ages/Squire';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

describe('Squire', () => {
  it('gives +$1 and +2 Actions', async () => {
    const testHarness = createCardHarness();

    testHarness.pickOption('+2 Actions');
    await new Squire(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.buys).toBe(0);
  });

  it('gives +$1 and +2 Buys', async () => {
    const testHarness = createCardHarness();

    testHarness.pickOption('+2 Buys');
    await new Squire(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.stats.buys).toBe(2);
    expect(testHarness.stats.actions).toBe(0);
  });

  it('gives +$1 and gains a Silver', async () => {
    const testHarness = createCardHarness();
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    testHarness.addSupplyPile(supplySilver);

    testHarness.pickOption('Gain a Silver');
    await new Squire(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(idsOf(testHarness.discard)).toEqual(['silver-supply-0']);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.stats.buys).toBe(0);
  });

  it('gains from the Supply pile named "Silver"', async () => {
    const testHarness = createCardHarness();
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    // Register the pile only under its real name, as Piles does in a real game.
    testHarness.pileCards.set('Silver', [supplySilver]);

    testHarness.pickOption('Gain a Silver');
    await new Squire(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.discard)).toEqual(['silver-supply-0']);
  });

  it('gains an Attack card from the Supply when trashed', async () => {
    const testHarness = createCardHarness();
    const squire = new Squire(testHarness.sharedGameState);
    squire.setId('squire-0');
    const supplyMilitia = new Militia(testHarness.sharedGameState);
    supplyMilitia.setId('militia-supply-0');
    testHarness.addSupplyPile(supplyMilitia);
    const supplySmithy = new Smithy(testHarness.sharedGameState);
    supplySmithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(supplySmithy);

    const [onTrash] = testHarness.getCardEffects(squire, EffectTriggerType.TRASH);
    expect(onTrash.isMandatory()).toBe(true);
    expect(onTrash.getCardEligibility().matches(squire)).toBe(true);
    testHarness.pickCard(supplyMilitia);
    await onTrash.doAction(testHarness.executor, new EffectContextBuilder().withTargetCards(CardCollection.fromCards([squire])).build());

    expect(idsOf(testHarness.discard)).toEqual(['militia-supply-0']);
  });

  it('gains nothing when trashed if there is no Attack card in the Supply', async () => {
    const testHarness = createCardHarness();
    const squire = new Squire(testHarness.sharedGameState);
    squire.setId('squire-0');
    const supplySmithy = new Smithy(testHarness.sharedGameState);
    supplySmithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(supplySmithy);

    const [onTrash] = testHarness.getCardEffects(squire, EffectTriggerType.TRASH);
    testHarness.pickCard(supplySmithy);
    await onTrash.doAction(testHarness.executor, new EffectContextBuilder().withTargetCards(CardCollection.fromCards([squire])).build());

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
  });
});
