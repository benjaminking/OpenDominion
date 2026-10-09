import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { DameNatalie } from '../../../src/cards/dark_ages/DameNatalie';
import { DameSylvia } from '../../../src/cards/dark_ages/DameSylvia';
import { createCardHarness } from '../testHarness';

describe('DameNatalie', () => {
  it('gains a card costing up to $3', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    testHarness.pickCard(silver);
    await new DameNatalie(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray()).toEqual([silver]);
    expect(testHarness.pileCards.get('Silver')).toEqual([]);
  });

  it('may choose not to gain a card', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    // default decision: none
    await new DameNatalie(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Silver')).toEqual([silver]);
  });

  it('cannot gain a card costing more than $3', async () => {
    const testHarness = createCardHarness();
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);

    testHarness.pickCard(duchy);
    await new DameNatalie(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Duchy')).toEqual([duchy]);
  });

  it('attack makes the target trash a revealed card costing $3 to $6', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedCopper = new Copper(targetHarness.sharedGameState);
    revealedCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(revealedCopper);
    const revealedSilver = new Silver(targetHarness.sharedGameState);
    revealedSilver.setId('silver-target-deck-0');
    targetHarness.addToDeck(revealedSilver);
    const dameNatalie = new DameNatalie(testHarness.sharedGameState);
    dameNatalie.setId('dame-natalie-0');
    testHarness.addToInPlay(dameNatalie);
    testHarness.routeAttacksTo(targetHarness);

    await dameNatalie.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedSilver]);
    expect(testHarness.inPlay.asCardArray()).toEqual([dameNatalie]);
  });

  it('attack trashes this when a Knight is trashed', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedKnight = new DameSylvia(targetHarness.sharedGameState);
    revealedKnight.setId('dame-sylvia-target-deck-0');
    targetHarness.addToDeck(revealedKnight);
    const dameNatalie = new DameNatalie(testHarness.sharedGameState);
    dameNatalie.setId('dame-natalie-0');
    testHarness.addToInPlay(dameNatalie);
    testHarness.routeAttacksTo(targetHarness);

    await dameNatalie.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedKnight]);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([dameNatalie]);
  });
});
