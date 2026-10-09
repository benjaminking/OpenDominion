import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardInfo, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { BanditFort } from '../../../src/cards/empires/BanditFort';
import { SharedGameState } from '../../../src/game-state/SharedGameState';
import { createCardHarness } from '../testHarness';

// Empires is not registered in CardInfoLookup yet, so supply Bandit Fort's card info directly
const banditFortInfo: CardInfo = {
  name: 'Bandit Fort',
  category: CardCategory.LANDMARK,
  text: 'When scoring, -2 for each Silver and each Gold you have.',
  font_size: 'large',
  cost: { coins: 0 },
  types: [],
  expansion: Expansion.EMPIRES,
  has_randomizer: false,
};
const lookUpRegisteredCardInfo = CardInfoLookup.lookUpCardInfo.bind(CardInfoLookup);
vi.spyOn(CardInfoLookup, 'lookUpCardInfo').mockImplementation((cardName: string) =>
  cardName === banditFortInfo.name ? banditFortInfo : lookUpRegisteredCardInfo(cardName),
);

const makeCards = (
  createCard: (sharedGameState: SharedGameState) => Card,
  sharedGameState: SharedGameState,
  idPrefix: string,
  count: number,
): Card[] => {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    const card = createCard(sharedGameState);
    card.setId(`${idPrefix}-${String(i)}`);
    cards.push(card);
  }
  return cards;
};

describe('Bandit Fort', () => {
  it('scores -2 VP for each Silver and each Gold across all card groups', () => {
    const { sharedGameState } = createCardHarness();
    const banditFort = new BanditFort(sharedGameState);
    const silvers = makeCards((s) => new Silver(s), sharedGameState, 'silver', 3);
    const golds = makeCards((s) => new Gold(s), sharedGameState, 'gold', 2);
    const coppers = makeCards((s) => new Copper(s), sharedGameState, 'copper', 4);

    const groups = [
      CardCollection.fromCards([silvers[0], golds[0], ...coppers]),
      CardCollection.fromCards([silvers[1], silvers[2]]),
      CardCollection.fromCards([golds[1]]),
    ];

    expect(banditFort.score(groups)).toBe(-10);
  });

  it('scores 0 VP without any Silvers or Golds', () => {
    const { sharedGameState } = createCardHarness();
    const banditFort = new BanditFort(sharedGameState);
    const coppers = makeCards((s) => new Copper(s), sharedGameState, 'copper', 7);
    const estates = makeCards((s) => new Estate(s), sharedGameState, 'estate', 3);

    // -2 * 0 is -0, so add 0 to compare the VP value rather than the sign of zero
    expect(banditFort.score([]) + 0).toBe(0);
    expect(banditFort.score([CardCollection.fromCards([...coppers, ...estates])]) + 0).toBe(0);
  });
});
