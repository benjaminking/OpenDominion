import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { DameJosephine } from '../../../src/cards/dark_ages/DameJosephine';
import { DameSylvia } from '../../../src/cards/dark_ages/DameSylvia';
import { createCardHarness } from '../testHarness';

describe('DameJosephine', () => {
  it('attack makes the target trash a revealed card costing $3 to $6', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedCopper = new Copper(targetHarness.sharedGameState);
    revealedCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(revealedCopper);
    const revealedSilver = new Silver(targetHarness.sharedGameState);
    revealedSilver.setId('silver-target-deck-0');
    targetHarness.addToDeck(revealedSilver);
    const dameJosephine = new DameJosephine(testHarness.sharedGameState);
    dameJosephine.setId('dame-josephine-0');
    testHarness.addToInPlay(dameJosephine);
    testHarness.routeAttacksTo(targetHarness);

    await dameJosephine.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedSilver]);
    expect(testHarness.inPlay.asCardArray()).toEqual([dameJosephine]);
    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.stats.actions).toBe(0);
  });

  it('attack trashes this when a Knight is trashed', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedKnight = new DameSylvia(targetHarness.sharedGameState);
    revealedKnight.setId('dame-sylvia-target-deck-0');
    targetHarness.addToDeck(revealedKnight);
    const dameJosephine = new DameJosephine(testHarness.sharedGameState);
    dameJosephine.setId('dame-josephine-0');
    testHarness.addToInPlay(dameJosephine);
    testHarness.routeAttacksTo(targetHarness);

    await dameJosephine.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedKnight]);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([dameJosephine]);
    expect(testHarness.inPlay.size()).toBe(0);
  });

  it('is worth 2 VP', () => {
    const testHarness = createCardHarness();
    const dameJosephine = new DameJosephine(testHarness.sharedGameState);
    dameJosephine.setId('dame-josephine-0');

    expect(dameJosephine.score([])).toBe(2);
    expect(dameJosephine.score([CardCollection.fromCards([dameJosephine])])).toBe(2);
  });

  it('is a Victory card', () => {
    const testHarness = createCardHarness();
    const dameJosephine = new DameJosephine(testHarness.sharedGameState);

    expect(dameJosephine.hasType(CardType.VICTORY)).toBe(true);
  });
});
