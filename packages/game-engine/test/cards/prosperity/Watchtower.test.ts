import { describe, expect, it, vi } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Watchtower } from '../../../src/cards/prosperity/Watchtower';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const addEstatesToHand = (testHarness: CardHarness, numEstates: number): void => {
  for (let cardIndex = 0; cardIndex < numEstates; cardIndex++) {
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId(`estate-hand-${String(cardIndex)}`);
    testHarness.addToHand(handEstate);
  }
};

const addCoppersToDeck = (testHarness: CardHarness, numCoppers: number): void => {
  for (let cardIndex = 0; cardIndex < numCoppers; cardIndex++) {
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId(`copper-deck-${String(cardIndex)}`);
    testHarness.addToDeck(deckCopper);
  }
};

const setUpGainedSilver = async (testHarness: CardHarness): Promise<{ watchtower: Watchtower; silver: Silver }> => {
  const watchtower = new Watchtower(testHarness.sharedGameState);
  watchtower.setId('watchtower-hand-0');
  testHarness.addToHand(watchtower);
  const silver = new Silver(testHarness.sharedGameState);
  silver.setId('silver-supply-0');
  testHarness.addSupplyPile(silver);
  await testHarness.executor.gainCardFromPile(silver);
  return { watchtower, silver };
};

describe('Watchtower', () => {
  it('draws until you have 6 cards in hand', async () => {
    const testHarness = createCardHarness();
    addEstatesToHand(testHarness, 2);
    addCoppersToDeck(testHarness, 6);

    await new Watchtower(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(6);
    expect(testHarness.deck.size()).toBe(2);
  });

  it('draws nothing when you already have 6 cards in hand', async () => {
    const testHarness = createCardHarness();
    addEstatesToHand(testHarness, 6);
    addCoppersToDeck(testHarness, 2);

    await new Watchtower(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(6);
    expect(testHarness.deck.size()).toBe(2);
  });

  it('shuffles the discard pile when needed and stops when out of cards', async () => {
    const testHarness = createCardHarness();
    addEstatesToHand(testHarness, 2);
    addCoppersToDeck(testHarness, 1);
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const discardCopper = new Copper(testHarness.sharedGameState);
      discardCopper.setId(`copper-discard-${String(cardIndex)}`);
      testHarness.addToDiscard(discardCopper);
    }

    await new Watchtower(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(5);
    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('draws Action cards too', async () => {
    const testHarness = createCardHarness();
    addEstatesToHand(testHarness, 5);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-deck-0');
    testHarness.addToDeck(village);
    // Guard so the endless loop fails the test instead of hanging it
    let numActionReveals = 0;
    vi.mocked(testHarness.sharedGameState.triggerEffect).mockImplementation(async (trigger: EffectTriggerType) => {
      if (trigger === EffectTriggerType.REVEALED_ACTION_DURING_DTX) {
        numActionReveals++;
        if (numActionReveals > 20) {
          throw new Error('Draw-until loop is stuck on an Action card');
        }
      }
    });

    await new Watchtower(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(6);
    expect(testHarness.hand.contains(village)).toBe(true);
  });

  it('when you gain a card, can be revealed from hand to trash that card', async () => {
    const testHarness = createCardHarness();
    const { watchtower, silver } = await setUpGainedSilver(testHarness);

    const gainEffects = testHarness.getCardEffects(watchtower, EffectTriggerType.GAIN);
    expect(gainEffects).toHaveLength(1);
    expect(gainEffects[0].isMandatory()).toBe(false);
    expect(
      gainEffects[0].areOtherConditionsSatisfied(
        testHarness.executor,
        new EffectContextBuilder().withTargetCard(silver).withGainLocation(silver.getLocation()).build(),
      ),
    ).toBe(true);
    testHarness.pickOption('Trash it');
    await gainEffects[0].doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(silver).withGainLocation(silver.getLocation()).build());

    expect(testHarness.sharedTrash.contains(silver)).toBe(true);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.hand.contains(watchtower)).toBe(true);
  });

  it('when you gain a card, can be revealed from hand to put that card onto your deck', async () => {
    const testHarness = createCardHarness();
    addCoppersToDeck(testHarness, 1);
    const { watchtower, silver } = await setUpGainedSilver(testHarness);

    testHarness.pickOption('Put it onto your deck');
    await testHarness
      .getCardEffects(watchtower, EffectTriggerType.GAIN)[0]
      .doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(silver).withGainLocation(silver.getLocation()).build());

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.deck.getTopCard()?.getId()).toBe('silver-supply-0');
    expect(testHarness.deck.size()).toBe(2);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('can only react while it is in your hand', () => {
    const testHarness = createCardHarness();
    const watchtower = new Watchtower(testHarness.sharedGameState);
    watchtower.setId('watchtower-in-play-0');
    testHarness.addToInPlay(watchtower);

    const gainEffect = testHarness.getCardEffects(watchtower, EffectTriggerType.GAIN)[0];

    expect(gainEffect.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });
});
