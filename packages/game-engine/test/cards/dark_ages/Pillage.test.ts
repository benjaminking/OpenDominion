import { ChoiceType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Pillage } from '../../../src/cards/dark_ages/Pillage';
import { Spoils } from '../../../src/cards/dark_ages/Spoils';
import { createCardHarness } from '../testHarness';

const setUp = (numSpoils: number, numTargetHandCards: number) => {
  const testHarness = createCardHarness();
  const targetHarness = createCardHarness();
  testHarness.routeAttacksTo(targetHarness);
  const pillage = new Pillage(testHarness.sharedGameState);
  pillage.setId('pillage-in-play');
  testHarness.addToInPlay(pillage);
  const spoilsPile: Spoils[] = [];
  for (let i = 0; i < numSpoils; i++) {
    const spoils = new Spoils(testHarness.sharedGameState);
    spoils.setId(`spoils-pile-${String(i)}`);
    spoilsPile.push(spoils);
  }
  testHarness.pileCards.set('Spoils', spoilsPile);
  // Differently named cards, so the attacker always has a real choice.
  const targetHandFactories = [Copper, Silver, Gold, Estate, Copper, Silver];
  const targetHand: Card[] = [];
  for (let i = 0; i < numTargetHandCards; i++) {
    const handCard = new targetHandFactories[i](targetHarness.sharedGameState);
    handCard.setId(`target-hand-${String(i)}`);
    targetHand.push(handCard);
    targetHarness.addToHand(handCard);
  }
  return { testHarness, targetHarness, pillage, targetHand };
};

describe('Pillage', () => {
  it('trashes itself and gains 2 Spoils', async () => {
    const { testHarness, pillage } = setUp(3, 0);

    await pillage.play(testHarness.executor);

    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.sharedTrash.asCardArray().map((card) => card.getId())).toEqual(['pillage-in-play']);
    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['spoils-pile-0', 'spoils-pile-1']);
    expect(testHarness.pileCards.get('Spoils')?.map((card) => card.getId())).toEqual(['spoils-pile-2']);
  });

  it('gains only as many Spoils as remain in the pile', async () => {
    const { testHarness, pillage } = setUp(1, 0);

    await pillage.play(testHarness.executor);

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['spoils-pile-0']);
  });

  it('gains nothing when played again after it was already trashed (e.g. Throne Room)', async () => {
    const { testHarness, pillage } = setUp(4, 0);

    await pillage.play(testHarness.executor);
    await pillage.play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.pileCards.get('Spoils')).toHaveLength(2);
  });

  it('attack does nothing to a player with 4 or fewer cards in hand', async () => {
    const { testHarness, targetHarness, pillage } = setUp(2, 4);

    await pillage.play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(4);
    expect(targetHarness.discard.size()).toBe(0);
    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
  });

  // BUG: the attacker's executor resolves the chosen card among the attacker's own cards, so choosing throws
  it('attack makes a player with 5 or more cards discard the card the attacker chooses', async () => {
    const { testHarness, targetHarness, pillage, targetHand } = setUp(2, 5);
    const targetGold = targetHand[2];

    testHarness.pickCard(targetGold);
    await pillage.play(testHarness.executor);

    expect(targetHarness.hand.size()).toBe(4);
    expect(targetHarness.discard.asCardArray().map((card) => card.getId())).toEqual([targetGold.getId()]);
  });

  // BUG: the attacker is offered a "none" option, but the card text requires a card to be discarded
  it('attack does not let the attacker choose to discard nothing', async () => {
    const { testHarness, pillage } = setUp(2, 5);

    await pillage.play(testHarness.executor);

    expect(testHarness.decisionService.chooseCard).toHaveBeenCalledTimes(1);
    const noneOption = (testHarness.decisionService.chooseCard.mock.calls[0] as unknown[])[4];
    expect(noneOption).not.toEqual({ type: ChoiceType.None });
  });
});
