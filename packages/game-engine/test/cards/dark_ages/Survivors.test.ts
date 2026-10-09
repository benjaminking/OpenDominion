import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Survivors } from '../../../src/cards/dark_ages/Survivors';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

// Cards are listed top-first.
const stackDeck = (harness: CardHarness, cards: Card[]): void => {
  for (const card of [...cards].reverse()) {
    harness.addToDeck(card);
  }
};

const setUp = () => {
  const testHarness = createCardHarness();
  const topCopper = new Copper(testHarness.sharedGameState);
  topCopper.setId('copper-deck-0');
  const secondSilver = new Silver(testHarness.sharedGameState);
  secondSilver.setId('silver-deck-1');
  const bottomGold = new Gold(testHarness.sharedGameState);
  bottomGold.setId('gold-deck-2');
  stackDeck(testHarness, [topCopper, secondSilver, bottomGold]);
  return { testHarness, topCopper, secondSilver };
};

describe('Survivors', () => {
  it('puts the top 2 cards back in the chosen order', async () => {
    const { testHarness, secondSilver } = setUp();

    testHarness.pickOption('Put them back on top');
    testHarness.pickCard(secondSilver); // placed first, so it ends up second from the top
    await new Survivors(testHarness.sharedGameState).play(testHarness.executor);

    // bottom -> top
    expect(idsOf(testHarness.deck)).toEqual(['gold-deck-2', 'silver-deck-1', 'copper-deck-0']);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('can put the top 2 cards back in a different order', async () => {
    const { testHarness, topCopper } = setUp();

    testHarness.pickOption('Put them back on top');
    testHarness.pickCard(topCopper);
    await new Survivors(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.deck)).toEqual(['gold-deck-2', 'copper-deck-0', 'silver-deck-1']);
  });

  // BUG: discardCardsFromRevealedSet(topCards) empties topCards before discarding, so both cards vanish
  it('can discard the top 2 cards', async () => {
    const { testHarness } = setUp();

    testHarness.pickOption('Discard them');
    await new Survivors(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(testHarness.deck)).toEqual(['gold-deck-2']);
    expect(idsOf(testHarness.discard)).toEqual(['copper-deck-0', 'silver-deck-1']);
  });

  it('does nothing when there are no cards to look at', async () => {
    const testHarness = createCardHarness();

    await new Survivors(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.decisionService.chooseOneOption).not.toHaveBeenCalled();
    expect(testHarness.discard.size()).toBe(0);
  });

  // BUG: Survivors reveals the cards (public log + REVEAL trigger) but the card text only lets you look at them
  it('looks at the cards without revealing them', async () => {
    const { testHarness } = setUp();

    testHarness.pickOption('Put them back on top');
    await new Survivors(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedGameState.triggerEffect).not.toHaveBeenCalledWith(
      EffectTriggerType.REVEAL,
      expect.anything(),
      expect.anything(),
    );
  });
});
