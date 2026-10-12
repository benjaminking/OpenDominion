import { describe, expect, it, vi } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { WitchsHut } from '../../../src/cards/hinterlands/WitchsHut';
import { CardHarness, createCardHarness } from '../testHarness';

const addCoppersToDeck = (testHarness: CardHarness, numCoppers: number): Copper[] => {
  const coppers: Copper[] = [];
  for (let i = 0; i < numCoppers; i++) {
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(i)}`);
    testHarness.addToDeck(deckCopper);
    coppers.push(deckCopper);
  }
  return coppers;
};

const setUpTargetWithCursePile = (testHarness: CardHarness) => {
  const targetHarness = createCardHarness();
  testHarness.routeAttacksTo(targetHarness);
  const curse = new Curse(targetHarness.sharedGameState);
  curse.setId('curse-supply-0');
  targetHarness.addSupplyPile(curse);
  return { targetHarness, curse };
};

const addActionsToHand = (testHarness: CardHarness) => {
  const village = new Village(testHarness.sharedGameState);
  village.setId('village-hand-0');
  testHarness.addToHand(village);
  const smithy = new Smithy(testHarness.sharedGameState);
  smithy.setId('smithy-hand-0');
  testHarness.addToHand(smithy);
  return { village, smithy };
};

describe('WitchsHut', () => {
  it('draws 4 cards, then discards 2', async () => {
    const testHarness = createCardHarness();
    const deckCoppers = addCoppersToDeck(testHarness, 5);

    testHarness.pickCards([deckCoppers[4], deckCoppers[3]]);
    await new WitchsHut(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.discard.size()).toBe(2);
  });

  it('makes each other player gain a Curse when both discarded cards are Actions', async () => {
    const testHarness = createCardHarness();
    const { targetHarness, curse } = setUpTargetWithCursePile(testHarness);
    const { village, smithy } = addActionsToHand(testHarness);
    addCoppersToDeck(testHarness, 4);

    testHarness.pickCards([village, smithy]);
    await new WitchsHut(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.contains(village)).toBe(true);
    expect(testHarness.discard.contains(smithy)).toBe(true);
    expect(targetHarness.discard.size()).toBe(1);
    expect(targetHarness.discard.contains(curse)).toBe(true);
  });

  it('does not attack when only one discarded card is an Action', async () => {
    const testHarness = createCardHarness();
    const { targetHarness } = setUpTargetWithCursePile(testHarness);
    const { village } = addActionsToHand(testHarness);
    const deckCoppers = addCoppersToDeck(testHarness, 4);

    testHarness.pickCards([village, deckCoppers[3]]);
    await new WitchsHut(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(2);
    expect(targetHarness.discard.size()).toBe(0);
  });

  it('does not attack when only one Action card could be discarded', async () => {
    const testHarness = createCardHarness();
    const { targetHarness } = setUpTargetWithCursePile(testHarness);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);

    testHarness.pickCards([village]);
    await new WitchsHut(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1);
    expect(targetHarness.discard.size()).toBe(0);
  });

  it('loses track of a chosen card that leaves the hand while it is revealed, and discards the other', async () => {
    const testHarness = createCardHarness();
    const { targetHarness } = setUpTargetWithCursePile(testHarness);
    const { village } = addActionsToHand(testHarness);
    const deckCoppers = addCoppersToDeck(testHarness, 4);
    const lostTrack = vi.spyOn(testHarness.executor, 'sendLostTrackMessage');
    // Something reacting to the reveal moves the Copper out of the hand
    vi.spyOn(testHarness.executor, 'revealCards').mockImplementation(() => {
      testHarness.hand.removeCard(deckCoppers[3]);
      testHarness.addToDeck(deckCoppers[3]);
      return Promise.resolve();
    });

    testHarness.pickCards([village, deckCoppers[3]]);
    await new WitchsHut(testHarness.sharedGameState).play(testHarness.executor);

    expect(lostTrack).toHaveBeenCalledWith(deckCoppers[3]);
    expect(testHarness.discard.asCardArray()).toEqual([village]);
    expect(testHarness.deck.asCardArray()).toEqual([deckCoppers[3]]);
    expect(targetHarness.discard.size()).toBe(0);
  });
});
