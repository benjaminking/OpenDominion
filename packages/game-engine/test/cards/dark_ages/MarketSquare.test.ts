import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { MarketSquare } from '../../../src/cards/dark_ages/MarketSquare';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

const setUpReaction = () => {
  const testHarness = createCardHarness();
  const marketSquare = new MarketSquare(testHarness.sharedGameState);
  marketSquare.setId('market-square-0');
  const trashedCopper = new Copper(testHarness.sharedGameState);
  trashedCopper.setId('copper-trashed');
  const gold = new Gold(testHarness.sharedGameState);
  gold.setId('gold-supply-0');
  const [onTrash] = testHarness.getCardEffects(marketSquare, EffectTriggerType.TRASH);
  return { testHarness, marketSquare, trashedCopper, gold, onTrash };
};

describe('MarketSquare', () => {
  it('gives +1 Card, +1 Action and +1 Buy', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    await new MarketSquare(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
  });

  it('when one of your cards is trashed, may be discarded from hand to gain a Gold', async () => {
    const { testHarness, marketSquare, trashedCopper, gold, onTrash } = setUpReaction();
    testHarness.addToHand(marketSquare);
    testHarness.addSupplyPile(gold);

    expect(onTrash.isMandatory()).toBe(false);
    expect(onTrash.areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
    await onTrash.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCards(CardCollection.fromCards([trashedCopper])).build(),
    );

    expect(testHarness.hand.size()).toBe(0);
    expect(idsOf(testHarness.discard)).toEqual(['market-square-0', 'gold-supply-0']);
  });

  it('reaction is unavailable when Market Square is not in hand', async () => {
    const { testHarness, marketSquare, trashedCopper, gold, onTrash } = setUpReaction();
    testHarness.addToInPlay(marketSquare);
    testHarness.addSupplyPile(gold);

    expect(onTrash.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
    await onTrash.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCards(CardCollection.fromCards([trashedCopper])).build(),
    );

    expect(idsOf(testHarness.inPlay)).toEqual(['market-square-0']);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('gains from the Supply pile named "Gold"', async () => {
    const { testHarness, marketSquare, trashedCopper, gold, onTrash } = setUpReaction();
    testHarness.addToHand(marketSquare);
    // Register the pile only under its real name, as Piles does in a real game.
    testHarness.pileCards.set('Gold', [gold]);

    await onTrash.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCards(CardCollection.fromCards([trashedCopper])).build(),
    );

    expect(idsOf(testHarness.discard)).toEqual(['market-square-0', 'gold-supply-0']);
  });
});
