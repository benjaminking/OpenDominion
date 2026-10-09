import { CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Familiar } from '../../../src/cards/alchemy/Familiar';
import { Vineyard } from '../../../src/cards/alchemy/Vineyard';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { SharedGameState } from '../../../src/game-state/SharedGameState';
import { createCardHarness } from '../testHarness';

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

describe('Vineyard', () => {
  it('is a Victory card costing $0P', () => {
    const { sharedGameState } = createCardHarness();
    const vineyard = new Vineyard(sharedGameState);

    expect(vineyard.hasType(CardType.VICTORY)).toBe(true);
    expect(vineyard.getCost().coins).toBe(0);
    expect(vineyard.getCost().potions).toBe(1);
  });

  it('scores 1 VP per 3 Action cards across all card groups, rounded down', () => {
    const { sharedGameState } = createCardHarness();
    const vineyard = new Vineyard(sharedGameState);
    vineyard.setId('vineyard-0');
    const villages = makeCards((s) => new Village(s), sharedGameState, 'village', 5);
    const familiars = makeCards((s) => new Familiar(s), sharedGameState, 'familiar', 3);

    const groups = [
      CardCollection.fromCards([...villages.slice(0, 2), vineyard]),
      CardCollection.fromCards(villages.slice(2)),
      CardCollection.fromCards(familiars),
    ];

    // 8 Actions -> 2 VP
    expect(vineyard.score(groups)).toBe(2);
  });

  it('scores 0 VP with fewer than 3 Action cards', () => {
    const { sharedGameState } = createCardHarness();
    const vineyard = new Vineyard(sharedGameState);
    vineyard.setId('vineyard-0');
    const villages = makeCards((s) => new Village(s), sharedGameState, 'village', 2);

    expect(vineyard.score([])).toBe(0);
    expect(vineyard.score([CardCollection.fromCards(villages)])).toBe(0);
  });

  it('does not count non-Action cards', () => {
    const { sharedGameState } = createCardHarness();
    const vineyard = new Vineyard(sharedGameState);
    vineyard.setId('vineyard-0');
    const otherVineyards = makeCards((s) => new Vineyard(s), sharedGameState, 'vineyard-other', 2);
    const coppers = makeCards((s) => new Copper(s), sharedGameState, 'copper', 3);
    const estates = makeCards((s) => new Estate(s), sharedGameState, 'estate', 3);
    const villages = makeCards((s) => new Village(s), sharedGameState, 'village', 3);

    expect(vineyard.score([CardCollection.fromCards([vineyard, ...otherVineyards, ...coppers, ...estates])])).toBe(0);
    expect(vineyard.score([CardCollection.fromCards([...coppers, ...estates, ...villages])])).toBe(1);
  });
});
