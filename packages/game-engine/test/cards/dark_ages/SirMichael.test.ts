import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { SirMartin } from '../../../src/cards/dark_ages/SirMartin';
import { SirMichael } from '../../../src/cards/dark_ages/SirMichael';
import { createCardHarness } from '../testHarness';

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

const setUp = (numTargetHandCards: number) => {
  const testHarness = createCardHarness();
  const targetHarness = createCardHarness();
  testHarness.routeAttacksTo(targetHarness);
  const sirMichael = new SirMichael(testHarness.sharedGameState);
  sirMichael.setId('sir-michael-in-play');
  testHarness.addToInPlay(sirMichael);
  const targetHand: Copper[] = [];
  for (let i = 0; i < numTargetHandCards; i++) {
    const handCopper = new Copper(targetHarness.sharedGameState);
    handCopper.setId(`copper-target-hand-${String(i)}`);
    targetHand.push(handCopper);
    targetHarness.addToHand(handCopper);
  }
  return { testHarness, targetHarness, sirMichael, targetHand };
};

describe('SirMichael', () => {
  it('makes each other player discard down to 3, then trash a revealed card costing $3-$6', async () => {
    const { testHarness, targetHarness, sirMichael, targetHand } = setUp(5);
    const targetEstate = new Estate(targetHarness.sharedGameState);
    targetEstate.setId('estate-target-deck');
    targetHarness.addToDeck(targetEstate);
    const targetSilver = new Silver(targetHarness.sharedGameState);
    targetSilver.setId('silver-target-deck');
    targetHarness.addToDeck(targetSilver);

    targetHarness.pickCards([targetHand[0], targetHand[1]]);
    await sirMichael.play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(3);
    expect(idsOf(targetHarness.sharedTrash)).toEqual(['silver-target-deck']);
    expect(idsOf(targetHarness.discard)).toContain('copper-target-hand-0');
    expect(idsOf(targetHarness.discard)).toContain('copper-target-hand-1');
    expect(targetHarness.deck.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
  });

  it('does not make a player with 3 or fewer cards discard, but still attacks their deck', async () => {
    const { testHarness, targetHarness, sirMichael } = setUp(3);
    const targetSilver = new Silver(targetHarness.sharedGameState);
    targetSilver.setId('silver-target-deck');
    targetHarness.addToDeck(targetSilver);

    await sirMichael.play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(3);
    expect(targetHarness.discard.size()).toBe(0);
    expect(idsOf(targetHarness.sharedTrash)).toEqual(['silver-target-deck']);
  });

  it('trashes itself when its attack trashes a Knight', async () => {
    const { testHarness, targetHarness, sirMichael } = setUp(0);
    const targetKnight = new SirMartin(targetHarness.sharedGameState);
    targetKnight.setId('sir-martin-target-deck');
    targetHarness.addToDeck(targetKnight);

    await sirMichael.play(testHarness.executor);

    expect(idsOf(targetHarness.sharedTrash)).toEqual(['sir-martin-target-deck']);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(idsOf(testHarness.sharedTrash)).toEqual(['sir-michael-in-play']);
  });
});
