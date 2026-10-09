import { describe, expect, it } from 'vitest';

import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Rats } from '../../../src/cards/dark_ages/Rats';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

const setUp = () => {
  const testHarness = createCardHarness();
  const pileRats = new Rats(testHarness.sharedGameState);
  pileRats.setId('rats-pile-0');
  testHarness.pileCards.set('Rats', [pileRats]);
  const rats = new Rats(testHarness.sharedGameState);
  rats.setId('rats-in-play');
  testHarness.addToInPlay(rats);
  return { testHarness, rats };
};

describe('Rats', () => {
  it('gives +1 Card and +1 Action, gains a Rats and trashes a chosen non-Rats card from hand', async () => {
    const { testHarness, rats } = setUp();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    testHarness.pickCard(handEstate);
    await rats.play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0']);
    expect(idsOf(testHarness.discard)).toEqual(['rats-pile-0']);
    expect(testHarness.pileCards.get('Rats')).toHaveLength(0);
    expect(idsOf(testHarness.sharedTrash)).toEqual(['estate-hand-0']);
  });

  it('trashes nothing when the hand is all Rats', async () => {
    const { testHarness, rats } = setUp();
    const handRats = new Rats(testHarness.sharedGameState);
    handRats.setId('rats-hand-0');
    testHarness.addToHand(handRats);
    const deckRats = new Rats(testHarness.sharedGameState);
    deckRats.setId('rats-deck-0');
    testHarness.addToDeck(deckRats);

    await rats.play(testHarness.executor);

    expect(idsOf(testHarness.hand)).toEqual(['rats-hand-0', 'rats-deck-0']);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.decisionService.chooseCard).not.toHaveBeenCalled();
  });

  it('gains nothing when the Rats pile is empty', async () => {
    const { testHarness, rats } = setUp();
    testHarness.pileCards.set('Rats', []);
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);

    testHarness.pickCard(handEstate);
    await rats.play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
    expect(idsOf(testHarness.sharedTrash)).toEqual(['estate-hand-0']);
  });

  it('draws a card when trashed', async () => {
    const { testHarness, rats } = setUp();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);

    const [onTrash] = testHarness.getCardEffects(rats, EffectTriggerType.TRASH);
    expect(onTrash.isMandatory()).toBe(true);
    expect(onTrash.getCardEligibility().matches(rats)).toBe(true);
    await onTrash.doAction(testHarness.executor, CardCollection.fromCards([rats]));

    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0']);
  });
});
