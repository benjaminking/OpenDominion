import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Province } from '../../../src/cards/basic_cards/Province';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { DameAnna } from '../../../src/cards/dark_ages/DameAnna';
import { DameJosephine } from '../../../src/cards/dark_ages/DameJosephine';
import { createCardHarness } from '../testHarness';

describe('DameAnna', () => {
  it('trashes up to 2 cards from hand', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);

    testHarness.pickCards([estate, copper]);
    await new DameAnna(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray()).toEqual([estate, copper]);
    expect(testHarness.hand.asCardArray()).toEqual([silver]);
  });

  it('may trash nothing', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    // default decision: no cards
    await new DameAnna(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.asCardArray()).toEqual([estate]);
  });

  it('attack makes the target trash a revealed card costing $3 to $6', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const bottomCopper = new Copper(targetHarness.sharedGameState);
    bottomCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(bottomCopper);
    const revealedCopper = new Copper(targetHarness.sharedGameState);
    revealedCopper.setId('copper-target-deck-1');
    targetHarness.addToDeck(revealedCopper);
    const revealedSilver = new Silver(targetHarness.sharedGameState);
    revealedSilver.setId('silver-target-deck-0');
    targetHarness.addToDeck(revealedSilver);
    const dameAnna = new DameAnna(testHarness.sharedGameState);
    dameAnna.setId('dame-anna-0');
    testHarness.addToInPlay(dameAnna);
    testHarness.routeAttacksTo(targetHarness);

    await dameAnna.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedSilver]);
    expect(targetHarness.deck.asCardArray()).toEqual([bottomCopper]);
    expect(testHarness.inPlay.asCardArray()).toEqual([dameAnna]);
  });

  it('attack lets the target choose which eligible card to trash', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedSilver = new Silver(targetHarness.sharedGameState);
    revealedSilver.setId('silver-target-deck-0');
    targetHarness.addToDeck(revealedSilver);
    const revealedVillage = new Village(targetHarness.sharedGameState);
    revealedVillage.setId('village-target-deck-0');
    targetHarness.addToDeck(revealedVillage);
    testHarness.routeAttacksTo(targetHarness);

    targetHarness.pickCard(revealedVillage);
    await new DameAnna(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedVillage]);
  });

  it('attack trashes nothing when no revealed card costs $3 to $6', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedCopper = new Copper(targetHarness.sharedGameState);
    revealedCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(revealedCopper);
    const revealedProvince = new Province(targetHarness.sharedGameState);
    revealedProvince.setId('province-target-deck-0');
    targetHarness.addToDeck(revealedProvince);
    testHarness.routeAttacksTo(targetHarness);

    await new DameAnna(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.sharedTrash.size()).toBe(0);
    expect(targetHarness.deck.size()).toBe(0);
  });

  // BUG: discardCardsFromRevealedSet(topCards) empties the set before discarding, so the other cards vanish
  it('attack discards the revealed cards that are not trashed', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedCopper = new Copper(targetHarness.sharedGameState);
    revealedCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(revealedCopper);
    const revealedSilver = new Silver(targetHarness.sharedGameState);
    revealedSilver.setId('silver-target-deck-0');
    targetHarness.addToDeck(revealedSilver);
    testHarness.routeAttacksTo(targetHarness);

    await new DameAnna(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedSilver]);
    expect(targetHarness.discard.asCardArray()).toEqual([revealedCopper]);
  });

  it('attack trashes this when a Knight is trashed', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const revealedCopper = new Copper(targetHarness.sharedGameState);
    revealedCopper.setId('copper-target-deck-0');
    targetHarness.addToDeck(revealedCopper);
    const revealedKnight = new DameJosephine(targetHarness.sharedGameState);
    revealedKnight.setId('dame-josephine-target-deck-0');
    targetHarness.addToDeck(revealedKnight);
    const dameAnna = new DameAnna(testHarness.sharedGameState);
    dameAnna.setId('dame-anna-0');
    testHarness.addToInPlay(dameAnna);
    testHarness.routeAttacksTo(targetHarness);

    await dameAnna.play(testHarness.executor);

    expect(targetHarness.sharedTrash.asCardArray()).toEqual([revealedKnight]);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([dameAnna]);
  });

  it('attack does nothing when the target has no cards to reveal', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);

    await new DameAnna(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.sharedTrash.size()).toBe(0);
    expect(targetHarness.discard.size()).toBe(0);
  });
});
