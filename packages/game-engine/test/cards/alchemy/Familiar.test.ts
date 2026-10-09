import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Familiar } from '../../../src/cards/alchemy/Familiar';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { createCardHarness } from '../testHarness';

const cardIds = (cards: Iterable<Card>): string[] => Array.from(cards, (card) => card.getId());

describe('Familiar', () => {
  it('draws 1 card and gives +1 Action', async () => {
    const testHarness = createCardHarness();
    for (let i = 0; i < 2; i++) {
      const copper = new Copper(testHarness.sharedGameState);
      copper.setId(`copper-deck-${String(i)}`);
      testHarness.addToDeck(copper);
    }

    await new Familiar(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
  });

  it('makes each other player gain a Curse when played', async () => {
    const testHarness = createCardHarness();
    const firstTargetHarness = createCardHarness();
    const secondTargetHarness = createCardHarness();
    const firstCurse = new Curse(firstTargetHarness.sharedGameState);
    firstCurse.setId('curse-supply-0');
    firstTargetHarness.addSupplyPile(firstCurse);
    const secondCurse = new Curse(secondTargetHarness.sharedGameState);
    secondCurse.setId('curse-supply-1');
    secondTargetHarness.addSupplyPile(secondCurse);
    testHarness.routeAttacksTo(firstTargetHarness, secondTargetHarness);

    await new Familiar(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(firstTargetHarness.discard)).toEqual([firstCurse.getId()]);
    expect(cardIds(secondTargetHarness.discard)).toEqual([secondCurse.getId()]);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('attack gains the target a Curse from the top of the pile', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const topCurse = new Curse(targetHarness.sharedGameState);
    topCurse.setId('curse-supply-0');
    targetHarness.addSupplyPile(topCurse);
    const nextCurse = new Curse(targetHarness.sharedGameState);
    nextCurse.setId('curse-supply-1');
    targetHarness.addSupplyPile(nextCurse);

    await new Familiar(testHarness.sharedGameState).attack(targetHarness.player, testHarness.player);

    expect(cardIds(targetHarness.discard)).toEqual([topCurse.getId()]);
    expect(cardIds(targetHarness.pileCards.get('Curse') ?? [])).toEqual([nextCurse.getId()]);
  });

  it('attack does nothing when the Curse pile is empty', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    targetHarness.pileCards.set('Curse', []);

    await new Familiar(testHarness.sharedGameState).attack(targetHarness.player, testHarness.player);

    expect(targetHarness.discard.size()).toBe(0);
  });
});
