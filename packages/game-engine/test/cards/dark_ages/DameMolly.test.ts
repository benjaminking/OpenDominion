import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { DameAnna } from '../../../src/cards/dark_ages/DameAnna';
import { DameMolly } from '../../../src/cards/dark_ages/DameMolly';
import { createCardHarness } from '../testHarness';

describe('DameMolly', () => {
  it('gives +2 Actions', async () => {
    const testHarness = createCardHarness();

    await new DameMolly(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
  });

  it('attack makes the target trash a revealed card costing $3 to $6', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedSilver = new Silver(targetHarness.sharedGameState);
    revealedSilver.setId('silver-target-deck-0');
    targetHarness.addToDeck(revealedSilver);
    const revealedCopper = new Copper(targetHarness.sharedGameState);
    revealedCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(revealedCopper);
    const dameMolly = new DameMolly(testHarness.sharedGameState);
    dameMolly.setId('dame-molly-0');
    testHarness.addToInPlay(dameMolly);
    testHarness.routeAttacksTo(targetHarness);

    await dameMolly.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedSilver]);
    expect(testHarness.inPlay.asCardArray()).toEqual([dameMolly]);
  });

  it('attack trashes this when a Knight is trashed', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedKnight = new DameAnna(targetHarness.sharedGameState);
    revealedKnight.setId('dame-anna-target-deck-0');
    targetHarness.addToDeck(revealedKnight);
    const dameMolly = new DameMolly(testHarness.sharedGameState);
    dameMolly.setId('dame-molly-0');
    testHarness.addToInPlay(dameMolly);
    testHarness.routeAttacksTo(targetHarness);

    await dameMolly.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedKnight]);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([dameMolly]);
    expect(testHarness.stats.actions).toBe(2);
  });
});
