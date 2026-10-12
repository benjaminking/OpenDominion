import { CardChoice } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Province } from '../../../src/cards/basic_cards/Province';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Smugglers } from '../../../src/cards/seaside/Smugglers';
import { createCardHarness } from '../testHarness';

const offeredCardNames = (testHarness: ReturnType<typeof createCardHarness>): string[] =>
  (
    (testHarness.decisionService.chooseCard.mock.calls[0] as unknown[] | undefined)?.[3] as CardChoice[] | undefined
  )?.map((choice) => choice.card.name) ?? [];

// The player to the right gains the given cards on a turn they then complete
const setUpPlayerToTheRight = (testHarness: ReturnType<typeof createCardHarness>, gainedCards: Card[]) => {
  const rightHarness = createCardHarness();
  rightHarness.turnTracker.startNewStandardTurn();
  for (const card of gainedCards) {
    rightHarness.turnTracker.addGainedCard(card);
  }
  rightHarness.turnTracker.endTurn();
  vi.mocked(testHarness.sharedGameState.getPlayerRightOfCurrent).mockReturnValue(rightHarness.player);
  return rightHarness;
};

describe('Smugglers', () => {
  it('gains a copy of a card the player to the right gained on their last turn', async () => {
    const testHarness = createCardHarness();
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply');
    testHarness.addSupplyPile(supplySilver);
    const supplyGold = new Gold(testHarness.sharedGameState);
    supplyGold.setId('gold-supply');
    testHarness.addSupplyPile(supplyGold);
    const gainedSilver = new Silver(testHarness.sharedGameState);
    gainedSilver.setId('silver-gained');
    setUpPlayerToTheRight(testHarness, [gainedSilver]);

    testHarness.pickCard(supplySilver);
    await new Smugglers(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedGameState.getPlayerRightOfCurrent).toHaveBeenCalled();
    expect(testHarness.sharedGameState.getPlayerLeftOfCurrent).not.toHaveBeenCalled();
    expect(offeredCardNames(testHarness)).toEqual(['Silver']);
    expect(testHarness.discard.asCardArray()).toEqual([supplySilver]);
  });

  it('does not offer a card costing more than $6', async () => {
    const testHarness = createCardHarness();
    const supplyProvince = new Province(testHarness.sharedGameState);
    supplyProvince.setId('province-supply');
    testHarness.addSupplyPile(supplyProvince);
    const gainedProvince = new Province(testHarness.sharedGameState);
    gainedProvince.setId('province-gained');
    setUpPlayerToTheRight(testHarness, [gainedProvince]);

    await new Smugglers(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
    expect(testHarness.discard.size()).toBe(0);
  });

  it('gains nothing when the player to the right has not completed a turn', async () => {
    const testHarness = createCardHarness();
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply');
    testHarness.addSupplyPile(supplySilver);
    const rightHarness = createCardHarness();
    vi.mocked(testHarness.sharedGameState.getPlayerRightOfCurrent).mockReturnValue(rightHarness.player);

    await new Smugglers(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
    expect(testHarness.discard.size()).toBe(0);
  });
});
