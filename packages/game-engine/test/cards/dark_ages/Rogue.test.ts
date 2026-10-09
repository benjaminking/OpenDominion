import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Province } from '../../../src/cards/basic_cards/Province';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Rogue } from '../../../src/cards/dark_ages/Rogue';
import { CardHarness, createCardHarness } from '../testHarness';

const withId = <T extends Card>(card: T, id: string): T => {
  card.setId(id);
  return card;
};

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

const putInTrash = (harness: CardHarness, card: Card): void => {
  harness.sharedTrash.addCard(card);
  card.setLocation(CardLocation.TRASH);
  harness.sharedCardsById.set(card.getId(), card);
};

// Cards are listed top-first.
const stackDeck = (harness: CardHarness, cards: Card[]): void => {
  for (const card of [...cards].reverse()) {
    harness.addToDeck(card);
  }
};

const setUp = () => {
  const testHarness = createCardHarness();
  const targetHarness = createCardHarness();
  testHarness.routeAttacksTo(targetHarness);
  return { testHarness, targetHarness };
};

describe('Rogue', () => {
  it('gives +$2 and gains a card costing $3-$6 from the trash instead of attacking', async () => {
    const { testHarness, targetHarness } = setUp();
    const trashSilver = withId(new Silver(testHarness.sharedGameState), 'silver-trash-0');
    putInTrash(testHarness, trashSilver);
    targetHarness.addToDeck(withId(new Gold(targetHarness.sharedGameState), 'gold-target-deck'));

    testHarness.pickCard(trashSilver);
    await new Rogue(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(idsOf(testHarness.discard)).toEqual(['silver-trash-0']);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(targetHarness.deck.size()).toBe(1);
    expect(targetHarness.sharedTrash.size()).toBe(0);
  });

  it('only offers trash cards costing $3-$6', async () => {
    const { testHarness } = setUp();
    putInTrash(testHarness, withId(new Province(testHarness.sharedGameState), 'province-trash-0'));
    putInTrash(testHarness, withId(new Silver(testHarness.sharedGameState), 'silver-trash-1'));
    putInTrash(testHarness, withId(new Copper(testHarness.sharedGameState), 'copper-trash-2'));

    await new Rogue(testHarness.sharedGameState).play(testHarness.executor);

    const [, , , offeredChoices] = testHarness.decisionService.chooseCard.mock.calls[0] as unknown[] as [
      string,
      string,
      string,
      { card: { id: string } }[],
    ];
    expect(offeredChoices.map((choice) => choice.card.id)).toEqual(['silver-trash-1']);
  });

  it('attacks when no card in the trash costs $3-$6', async () => {
    const { testHarness, targetHarness } = setUp();
    putInTrash(testHarness, withId(new Copper(testHarness.sharedGameState), 'copper-trash-0'));
    putInTrash(testHarness, withId(new Province(testHarness.sharedGameState), 'province-trash-1'));
    stackDeck(targetHarness, [
      withId(new Silver(targetHarness.sharedGameState), 'silver-target-deck'),
      withId(new Estate(targetHarness.sharedGameState), 'estate-target-deck'),
    ]);

    await new Rogue(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.sharedTrash.size()).toBe(2);
    expect(idsOf(targetHarness.sharedTrash)).toEqual(['silver-target-deck']);
    expect(targetHarness.deck.size()).toBe(0);
  });

  it('attack lets the target choose which revealed card costing $3-$6 to trash', async () => {
    const { testHarness, targetHarness } = setUp();
    const targetSilver = withId(new Silver(targetHarness.sharedGameState), 'silver-target-deck');
    const targetGold = withId(new Gold(targetHarness.sharedGameState), 'gold-target-deck');
    stackDeck(targetHarness, [targetSilver, targetGold]);

    targetHarness.pickCard(targetSilver);
    await new Rogue(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(targetHarness.sharedTrash)).toEqual(['silver-target-deck']);
  });

  it('attack trashes nothing when neither revealed card costs $3-$6', async () => {
    const { testHarness, targetHarness } = setUp();
    stackDeck(targetHarness, [
      withId(new Copper(targetHarness.sharedGameState), 'copper-target-deck'),
      withId(new Province(targetHarness.sharedGameState), 'province-target-deck'),
    ]);

    await new Rogue(testHarness.sharedGameState).play(testHarness.executor);

    expect(targetHarness.sharedTrash.size()).toBe(0);
    expect(targetHarness.deck.size()).toBe(0);
  });

  it('attack discards the revealed cards that are not trashed', async () => {
    const { testHarness, targetHarness } = setUp();
    stackDeck(targetHarness, [
      withId(new Silver(targetHarness.sharedGameState), 'silver-target-deck'),
      withId(new Estate(targetHarness.sharedGameState), 'estate-target-deck'),
    ]);

    await new Rogue(testHarness.sharedGameState).play(testHarness.executor);

    expect(idsOf(targetHarness.discard)).toEqual(['estate-target-deck']);
  });
});
