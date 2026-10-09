import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { DameMolly } from '../../../src/cards/dark_ages/DameMolly';
import { DameSylvia } from '../../../src/cards/dark_ages/DameSylvia';
import { createCardHarness } from '../testHarness';

describe('DameSylvia', () => {
  it('gives +$2', async () => {
    const testHarness = createCardHarness();

    await new DameSylvia(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
  });

  it('attack makes the target trash a revealed card costing $3 to $6', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedCopper = new Copper(targetHarness.sharedGameState);
    revealedCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(revealedCopper);
    const revealedGold = new Gold(targetHarness.sharedGameState);
    revealedGold.setId('gold-target-deck-0');
    targetHarness.addToDeck(revealedGold);
    const dameSylvia = new DameSylvia(testHarness.sharedGameState);
    dameSylvia.setId('dame-sylvia-0');
    testHarness.addToInPlay(dameSylvia);
    testHarness.routeAttacksTo(targetHarness);

    await dameSylvia.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedGold]);
    expect(testHarness.inPlay.asCardArray()).toEqual([dameSylvia]);
  });

  it('attack trashes this when a Knight is trashed', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedKnight = new DameMolly(targetHarness.sharedGameState);
    revealedKnight.setId('dame-molly-target-deck-0');
    targetHarness.addToDeck(revealedKnight);
    const dameSylvia = new DameSylvia(testHarness.sharedGameState);
    dameSylvia.setId('dame-sylvia-0');
    testHarness.addToInPlay(dameSylvia);
    testHarness.routeAttacksTo(targetHarness);

    await dameSylvia.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedKnight]);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([dameSylvia]);
    expect(testHarness.stats.coins).toBe(2);
  });
});
