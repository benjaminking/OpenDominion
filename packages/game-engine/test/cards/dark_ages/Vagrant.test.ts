import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Necropolis } from '../../../src/cards/dark_ages/Necropolis';
import { RuinedVillage } from '../../../src/cards/dark_ages/RuinedVillage';
import { Vagrant } from '../../../src/cards/dark_ages/Vagrant';
import { SharedGameState } from '../../../src/game-state/SharedGameState';
import { createCardHarness } from '../testHarness';

const idsOf = (cards: CardCollection): string[] => cards.asCardArray().map((card) => card.getId());

const setUp = (createTopCard: (sharedGameState: SharedGameState) => Card) => {
  const testHarness = createCardHarness();
  const topCard = createTopCard(testHarness.sharedGameState);
  topCard.setId('top-card');
  testHarness.addToDeck(topCard);
  const drawnCopper = new Copper(testHarness.sharedGameState);
  drawnCopper.setId('copper-deck-0');
  testHarness.addToDeck(drawnCopper);
  return testHarness;
};

describe('Vagrant', () => {
  it.each([
    ['Victory', (sharedGameState: SharedGameState) => new Estate(sharedGameState)],
    ['Curse', (sharedGameState: SharedGameState) => new Curse(sharedGameState)],
    ['Ruins', (sharedGameState: SharedGameState) => new RuinedVillage(sharedGameState)],
    ['Shelter', (sharedGameState: SharedGameState) => new Necropolis(sharedGameState)],
  ])('gives +1 Card and +1 Action and puts a revealed %s card into hand', async (_type, createTopCard) => {
    const testHarness = setUp(createTopCard);

    await new Vagrant(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0', 'top-card']);
    expect(testHarness.deck.size()).toBe(0);
  });

  it('leaves any other revealed card on top of the deck', async () => {
    const testHarness = setUp((sharedGameState: SharedGameState) => new Silver(sharedGameState));

    await new Vagrant(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(idsOf(testHarness.hand)).toEqual(['copper-deck-0']);
    expect(idsOf(testHarness.deck)).toEqual(['top-card']);
  });

  it('only gives +1 Card and +1 Action when there is nothing left to reveal', async () => {
    const testHarness = createCardHarness();
    const deckEstate = new Estate(testHarness.sharedGameState);
    deckEstate.setId('estate-deck-0');
    testHarness.addToDeck(deckEstate);

    await new Vagrant(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(idsOf(testHarness.hand)).toEqual(['estate-deck-0']);
  });
});
