import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Hamlet } from '../../../src/cards/cornucopia_and_guilds/Hamlet';
import { YoungWitch } from '../../../src/cards/cornucopia_and_guilds/YoungWitch';
import { Pile } from '../../../src/piles/Pile';
import { GameInitializer } from '../../../src/setup/GameInitializer';
import { PileSpecification } from '../../../src/setup/PileSpecification';
import { CardHarness, createCardHarness } from '../testHarness';

// Runs Young Witch's setup rule with the given pile chosen as the Bane pile.
const setUpBane = (testHarness: CardHarness, banePileName: string) => {
  const addRandomPile = vi.fn((_pileSpecification: PileSpecification) => ({ name: banePileName }) as unknown as Pile);
  const youngWitch = new YoungWitch(testHarness.sharedGameState);
  youngWitch.setId('young-witch-setup');
  youngWitch
    .getSetupRules()
    .getNextGameInitializationSetupRule()
    .applySetupRule({ addRandomPile } as unknown as GameInitializer);
  return addRandomPile;
};

// Target with a Curse in their Supply and the given card in hand.
const setUpTarget = (createHandCard: (targetHarness: CardHarness) => Card) => {
  const targetHarness = createCardHarness();
  const curse = new Curse(targetHarness.sharedGameState);
  curse.setId('curse-supply-0');
  targetHarness.addSupplyPile(curse);
  targetHarness.addToHand(createHandCard(targetHarness));
  return { targetHarness, curse };
};

const createTargetHamlet = (targetHarness: CardHarness): Hamlet => {
  const hamlet = new Hamlet(targetHarness.sharedGameState);
  hamlet.setId('hamlet-target-hand-0');
  return hamlet;
};

describe('YoungWitch', () => {
  it('gives +2 Cards and then discards 2 cards', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    testHarness.addToDeck(silver);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    testHarness.pickCards([estate, copper]);
    await new YoungWitch(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.asCardArray()).toEqual([silver]);
    expect(testHarness.discard.asCardArray()).toEqual([estate, copper]);
  });

  // BUG: gains from lowercase pile 'curse', but pile names are case-sensitive, so nothing is gained
  it('each other player without a Bane in hand gains a Curse', async () => {
    const testHarness = createCardHarness();
    const { targetHarness, curse } = setUpTarget((harness) => {
      const copper = new Copper(harness.sharedGameState);
      copper.setId('copper-target-hand-0');
      return copper;
    });
    testHarness.routeAttacksTo(targetHarness);

    await new YoungWitch(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.discard.asCardArray()).toEqual([curse]);
    expect(targetHarness.decisionService.chooseOneOption).not.toHaveBeenCalled();
  });

  it('setup adds an extra Kingdom pile costing $2 or $3', () => {
    const testHarness = createCardHarness();

    const addRandomPile = setUpBane(testHarness, 'Hamlet');

    expect(addRandomPile).toHaveBeenCalledTimes(1);
    expect(addRandomPile.mock.calls[0][0].getRandomizerRequirements()).toEqual({ requiredCoinCosts: [2, 3] });
  });

  it('a player who reveals a Bane from hand does not gain a Curse', async () => {
    const testHarness = createCardHarness();
    setUpBane(testHarness, 'Hamlet');
    const { targetHarness } = setUpTarget(createTargetHamlet);
    testHarness.routeAttacksTo(targetHarness);

    targetHarness.pickOption('Yes');
    await new YoungWitch(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.discard.size()).toBe(0);
    expect(targetHarness.hand.size()).toBe(1);
  });

  // BUG: gains from lowercase pile 'curse', but pile names are case-sensitive, so nothing is gained
  it('a player may choose not to reveal their Bane and gain a Curse', async () => {
    const testHarness = createCardHarness();
    setUpBane(testHarness, 'Hamlet');
    const { targetHarness, curse } = setUpTarget(createTargetHamlet);
    testHarness.routeAttacksTo(targetHarness);

    targetHarness.pickOption('No');
    await new YoungWitch(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.discard.asCardArray()).toEqual([curse]);
  });
});
