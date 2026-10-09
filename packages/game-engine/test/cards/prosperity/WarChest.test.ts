import { CardChoice } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { WarChest } from '../../../src/cards/prosperity/WarChest';
import { Turn } from '../../../src/turns/Turn';
import { CardHarness, createCardHarness } from '../testHarness';

// War Chest remembers named cards per turn number in static state, so each test uses its own turn numbers.
const setCurrentTurn = (testHarness: CardHarness, turnNumber: number): void => {
  vi.mocked(testHarness.sharedGameState.getCurrentTurn).mockReturnValue(
    new Turn(testHarness.player, turnNumber, turnNumber),
  );
};

const setUpLeftPlayer = (testHarness: CardHarness): CardHarness => {
  const leftHarness = createCardHarness();
  vi.mocked(testHarness.sharedGameState.getPlayerLeftOfCurrent).mockReturnValue(leftHarness.player);
  const leftSilver = new Silver(leftHarness.sharedGameState);
  leftSilver.setId('silver-left-supply-0');
  leftHarness.addSupplyPile(leftSilver);
  const leftVillage = new Village(leftHarness.sharedGameState);
  leftVillage.setId('village-left-supply-0');
  leftHarness.addSupplyPile(leftVillage);
  return leftHarness;
};

const nameCard = (leftHarness: CardHarness, cardName: string): void => {
  leftHarness.pickCard(leftHarness.pileCards.get(cardName)![0]);
};

const offeredCardNames = (testHarness: CardHarness, callIndex: number): string[] =>
  ((testHarness.decisionService.chooseCard.mock.calls[callIndex] as unknown[])[3] as CardChoice[])
    .map((choice) => choice.card.name)
    .sort();

const addSupplyPiles = (testHarness: CardHarness) => {
  const silver = new Silver(testHarness.sharedGameState);
  silver.setId('silver-supply-0');
  testHarness.addSupplyPile(silver);
  const village = new Village(testHarness.sharedGameState);
  village.setId('village-supply-0');
  testHarness.addSupplyPile(village);
  const smithy = new Smithy(testHarness.sharedGameState);
  smithy.setId('smithy-supply-0');
  testHarness.addSupplyPile(smithy);
  const gold = new Gold(testHarness.sharedGameState);
  gold.setId('gold-supply-0');
  testHarness.addSupplyPile(gold);
  return { silver, village, smithy, gold };
};

describe('WarChest', () => {
  it('lets the player to your left name a card, then gains a card costing up to $5 that was not named', async () => {
    const testHarness = createCardHarness();
    const leftHarness = setUpLeftPlayer(testHarness);
    setCurrentTurn(testHarness, 101);
    const { village } = addSupplyPiles(testHarness);

    nameCard(leftHarness, 'Silver');
    testHarness.pickCard(village);
    await new WarChest(testHarness.sharedGameState).play(testHarness.executor);

    expect(leftHarness.decisionService.chooseCard).toHaveBeenCalledTimes(1);
    expect(testHarness.decisionService.chooseCard).toHaveBeenCalledTimes(1);
    expect(offeredCardNames(testHarness, 0)).toEqual(['Smithy', 'Village']);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['village-supply-0']);
  });

  it('excludes every card named for War Chest earlier in the same turn', async () => {
    const testHarness = createCardHarness();
    const leftHarness = setUpLeftPlayer(testHarness);
    setCurrentTurn(testHarness, 102);
    const { village, smithy } = addSupplyPiles(testHarness);

    nameCard(leftHarness, 'Silver');
    testHarness.pickCard(village);
    await new WarChest(testHarness.sharedGameState).play(testHarness.executor);
    nameCard(leftHarness, 'Village');
    testHarness.pickCard(smithy);
    await new WarChest(testHarness.sharedGameState).play(testHarness.executor);

    expect(offeredCardNames(testHarness, 1)).toEqual(['Smithy']);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual([
      'village-supply-0',
      'smithy-supply-0',
    ]);
  });

  it('allows cards named on an earlier turn', async () => {
    const testHarness = createCardHarness();
    const leftHarness = setUpLeftPlayer(testHarness);
    const { silver, smithy } = addSupplyPiles(testHarness);

    setCurrentTurn(testHarness, 103);
    nameCard(leftHarness, 'Silver');
    testHarness.pickCard(smithy);
    await new WarChest(testHarness.sharedGameState).play(testHarness.executor);

    setCurrentTurn(testHarness, 104);
    nameCard(leftHarness, 'Village');
    testHarness.pickCard(silver);
    await new WarChest(testHarness.sharedGameState).play(testHarness.executor);

    expect(offeredCardNames(testHarness, 1)).toContain('Silver');
    expect(offeredCardNames(testHarness, 1)).not.toContain('Village');
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual([
      'smithy-supply-0',
      'silver-supply-0',
    ]);
  });

  // BUG: named cards are kept in static state keyed only by the per-player turn number, so they leak between players
  it("does not exclude cards named on another player's turn", async () => {
    // Each player's turns are numbered separately, so both players are on their own turn 105
    const firstPlayerHarness = createCardHarness();
    const firstLeftHarness = setUpLeftPlayer(firstPlayerHarness);
    setCurrentTurn(firstPlayerHarness, 105);
    const { village } = addSupplyPiles(firstPlayerHarness);
    const secondPlayerHarness = createCardHarness();
    const secondLeftHarness = setUpLeftPlayer(secondPlayerHarness);
    setCurrentTurn(secondPlayerHarness, 105);
    const { smithy } = addSupplyPiles(secondPlayerHarness);

    nameCard(firstLeftHarness, 'Silver');
    firstPlayerHarness.pickCard(village);
    await new WarChest(firstPlayerHarness.sharedGameState).play(firstPlayerHarness.executor);
    nameCard(secondLeftHarness, 'Village');
    secondPlayerHarness.pickCard(smithy);
    await new WarChest(secondPlayerHarness.sharedGameState).play(secondPlayerHarness.executor);

    expect(offeredCardNames(secondPlayerHarness, 0)).toEqual(['Silver', 'Smithy']);
  });
});
