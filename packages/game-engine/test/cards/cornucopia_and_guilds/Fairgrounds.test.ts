import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Province } from '../../../src/cards/basic_cards/Province';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Fairgrounds } from '../../../src/cards/cornucopia_and_guilds/Fairgrounds';
import { SharedGameState } from '../../../src/game-state/SharedGameState';
import { createCardHarness } from '../testHarness';

const cardFactories: ((sharedGameState: SharedGameState) => Card)[] = [
  (sharedGameState) => new Copper(sharedGameState),
  (sharedGameState) => new Silver(sharedGameState),
  (sharedGameState) => new Gold(sharedGameState),
  (sharedGameState) => new Estate(sharedGameState),
  (sharedGameState) => new Duchy(sharedGameState),
  (sharedGameState) => new Province(sharedGameState),
  (sharedGameState) => new Curse(sharedGameState),
  (sharedGameState) => new Village(sharedGameState),
  (sharedGameState) => new Smithy(sharedGameState),
];

// Creates one card each of the first `numDistinct` names, plus a duplicate of the first.
const createCards = (sharedGameState: SharedGameState, numDistinct: number): Card[] => {
  const cards: Card[] = [];
  for (let cardIndex = 0; cardIndex < numDistinct; cardIndex++) {
    const card = cardFactories[cardIndex](sharedGameState);
    card.setId(`card-${String(cardIndex)}`);
    cards.push(card);
  }
  const duplicate = cardFactories[0](sharedGameState);
  duplicate.setId('card-duplicate');
  cards.push(duplicate);
  return cards;
};

describe('Fairgrounds', () => {
  it.each([
    { numOtherNames: 3, expectedVP: 0 },
    { numOtherNames: 4, expectedVP: 2 },
    { numOtherNames: 8, expectedVP: 2 },
    { numOtherNames: 9, expectedVP: 4 },
  ])(
    'is worth $expectedVP VP with $numOtherNames other differently named cards plus itself',
    ({ numOtherNames, expectedVP }) => {
      const testHarness = createCardHarness();
      const fairgrounds = new Fairgrounds(testHarness.sharedGameState);
      fairgrounds.setId('fairgrounds-0');
      const otherCards = createCards(testHarness.sharedGameState, numOtherNames);

      // Split the cards across zones to check they are all counted together
      const score = fairgrounds.score([
        CardCollection.fromCards([fairgrounds, ...otherCards.slice(0, 2)]),
        CardCollection.fromCards(otherCards.slice(2)),
      ]);

      expect(score).toBe(expectedVP);
    },
  );
});
