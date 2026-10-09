import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Golem } from '../../../src/cards/alchemy/Golem';
import { Festival } from '../../../src/cards/base_game/Festival';
import { Militia } from '../../../src/cards/base_game/Militia';
import { Moneylender } from '../../../src/cards/base_game/Moneylender';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { CardHarness, createCardHarness } from '../testHarness';

const stackDeck = (testHarness: CardHarness, topToBottom: Card[]): void => {
  for (const card of [...topToBottom].reverse()) {
    testHarness.addToDeck(card);
  }
};

// Fails the test instead of hanging if Golem keeps asking which card to play next
const guardAgainstEndlessChoiceLoop = (testHarness: CardHarness): void => {
  const originalChooseCard = testHarness.executor.chooseCard.bind(testHarness.executor);
  let numCalls = 0;
  vi.spyOn(testHarness.executor, 'chooseCard').mockImplementation((prompt: string) => {
    numCalls++;
    if (numCalls > 10) {
      throw new Error('Golem kept asking which card to play next');
    }
    return originalChooseCard(prompt);
  });
};

const cardIds = (cards: Iterable<Card>): string[] => Array.from(cards, (card) => card.getId());

describe('Golem', () => {
  // BUG: the found Action can't be resolved for play once takeCardOffDeck has cleared limbo, so Golem loops forever
  it('discards revealed non-Actions and Golems and plays the Action it finds', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck');
    const otherGolem = new Golem(testHarness.sharedGameState);
    otherGolem.setId('golem-deck');
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck');
    const festival = new Festival(testHarness.sharedGameState);
    festival.setId('festival-deck');
    stackDeck(testHarness, [copper, otherGolem, estate, festival]);
    guardAgainstEndlessChoiceLoop(testHarness);

    await new Golem(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.discard.size()).toBe(3);
    expect(testHarness.discard.contains(copper)).toBe(true);
    expect(testHarness.discard.contains(otherGolem)).toBe(true);
    expect(testHarness.discard.contains(estate)).toBe(true);
    expect(testHarness.deck.size()).toBe(0);
  });

  // BUG: Actions revealed before the last card can't be resolved for play (takeCardOffDeck clears limbo)
  it('stops after 2 non-Golem Actions and plays both of them', async () => {
    const testHarness = createCardHarness();
    const festival = new Festival(testHarness.sharedGameState);
    festival.setId('festival-deck');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck');
    const militia = new Militia(testHarness.sharedGameState);
    militia.setId('militia-deck');
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck');
    stackDeck(testHarness, [festival, copper, militia, silver]);
    guardAgainstEndlessChoiceLoop(testHarness);

    testHarness.pickCard(festival);
    await new Golem(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(4);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.buys).toBe(1);
    expect(cardIds(testHarness.discard)).toEqual([copper.getId()]);
    expect(cardIds(testHarness.deck)).toEqual([silver.getId()]);
  });

  // BUG: Actions revealed before the last card can't be resolved for play (takeCardOffDeck clears limbo)
  it('plays the first revealed Action first when chosen', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-deck');
    const moneylender = new Moneylender(testHarness.sharedGameState);
    moneylender.setId('moneylender-deck');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck');
    stackDeck(testHarness, [village, moneylender, copper]);
    guardAgainstEndlessChoiceLoop(testHarness);

    // Village draws the Copper, which Moneylender then trashes
    testHarness.pickCard(village);
    testHarness.pickCard(copper);
    await new Golem(testHarness.sharedGameState).play(testHarness.executor);

    expect(cardIds(testHarness.sharedTrash)).toEqual([copper.getId()]);
    expect(testHarness.stats.coins).toBe(3);
    expect(testHarness.stats.actions).toBe(2);
  });

  // BUG: Actions revealed before the last card can't be resolved for play (takeCardOffDeck clears limbo)
  it('plays the second revealed Action first when chosen', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-deck');
    const moneylender = new Moneylender(testHarness.sharedGameState);
    moneylender.setId('moneylender-deck');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck');
    stackDeck(testHarness, [village, moneylender, copper]);
    guardAgainstEndlessChoiceLoop(testHarness);

    // Moneylender has no Copper to trash yet; Village then draws it
    testHarness.pickCard(moneylender);
    await new Golem(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
    expect(cardIds(testHarness.hand)).toEqual([copper.getId()]);
    expect(testHarness.stats.actions).toBe(2);
  });

  // BUG: the found Action can't be resolved for play (limbo cleared), and playCardFromLocation never moves it into play
  it('puts the Actions it plays into play', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck');
    const festival = new Festival(testHarness.sharedGameState);
    festival.setId('festival-deck');
    stackDeck(testHarness, [copper, festival]);
    guardAgainstEndlessChoiceLoop(testHarness);

    await new Golem(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(cardIds(testHarness.inPlay)).toEqual([festival.getId()]);
  });

  it('discards everything and plays nothing when no other Actions are revealed', async () => {
    const testHarness = createCardHarness();
    const otherGolem = new Golem(testHarness.sharedGameState);
    otherGolem.setId('golem-deck');
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck');
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-deck');
    stackDeck(testHarness, [otherGolem, copper, estate]);

    await new Golem(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(3);
    expect(testHarness.deck.size()).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.stats.actions).toBe(0);
  });

  it('does nothing with an empty deck and discard pile', async () => {
    const testHarness = createCardHarness();

    await new Golem(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(0);
  });
});
