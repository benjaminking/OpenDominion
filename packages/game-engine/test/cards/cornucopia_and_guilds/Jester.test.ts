import { describe, expect, it } from 'vitest';

import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Jester } from '../../../src/cards/cornucopia_and_guilds/Jester';
import { createCardHarness } from '../testHarness';

describe('Jester', () => {
  it('gives +$2', async () => {
    const testHarness = createCardHarness();

    await new Jester(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
  });

  // BUG: gains from lowercase pile 'curse', but pile names are case-sensitive, so nothing is gained
  it('a player who discards a Victory card gains a Curse', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const estate = new Estate(targetHarness.sharedGameState);
    estate.setId('estate-target-deck-0');
    targetHarness.addToDeck(estate);
    const curse = new Curse(targetHarness.sharedGameState);
    curse.setId('curse-supply-0');
    targetHarness.addSupplyPile(curse);
    testHarness.routeAttacksTo(targetHarness);

    await new Jester(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.deck.size()).toBe(0);
    expect(targetHarness.discard.asCardArray()).toEqual([estate, curse]);
    expect(testHarness.decisionService.chooseOneOption).not.toHaveBeenCalled();
  });

  it('the attacker can gain a copy of a discarded non-Victory card', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetSilver = new Silver(targetHarness.sharedGameState);
    targetSilver.setId('silver-target-deck-0');
    targetHarness.addToDeck(targetSilver);
    const supplySilver = new Silver(testHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    testHarness.addSupplyPile(supplySilver);
    testHarness.routeAttacksTo(targetHarness);

    testHarness.pickOption('You gain a copy');
    await new Jester(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.discard.asCardArray()).toEqual([targetSilver]);
    expect(testHarness.discard.asCardArray()).toEqual([supplySilver]);
  });

  it('the attacker can make the attacked player gain the copy instead', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetSilver = new Silver(targetHarness.sharedGameState);
    targetSilver.setId('silver-target-deck-0');
    targetHarness.addToDeck(targetSilver);
    const supplySilver = new Silver(targetHarness.sharedGameState);
    supplySilver.setId('silver-supply-0');
    targetHarness.addSupplyPile(supplySilver);
    testHarness.routeAttacksTo(targetHarness);

    testHarness.pickOption(`${targetHarness.player.getName()} gains a copy`);
    await new Jester(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.discard.asCardArray()).toEqual([targetSilver, supplySilver]);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('does nothing to a player with no cards to discard', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);

    await new Jester(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.discard.size()).toBe(0);
    expect(testHarness.decisionService.chooseOneOption).not.toHaveBeenCalled();
  });
});
