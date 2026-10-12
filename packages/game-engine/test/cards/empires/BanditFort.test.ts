import { CardInfoLookup } from '@dominion/card-info';
import { CardCategory, CardInfo, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../../src/card/Card';
import { CardCollection } from '../../../src/card/CardCollection';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Platinum } from '../../../src/cards/basic_cards/Platinum';
import { Potion } from '../../../src/cards/basic_cards/Potion';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { BanditFort } from '../../../src/cards/empires/BanditFort';
import { FoolsGold } from '../../../src/cards/hinterlands/FoolsGold';
import { SharedGameState } from '../../../src/game-state/SharedGameState';
import { createGame, TestPlayer } from '../../integration/gameHarness';
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

// The engine doesn't score Landmarks yet: score Bandit Fort over every card the player owns, as the end of the game would
const scoreFor = (banditFort: BanditFort, testPlayer: TestPlayer): number =>
  banditFort.score([CardCollection.fromCards(testPlayer.player.getOwnedCards().getAllCards())]);

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

  it('only counts cards named Silver or Gold, not other Treasures', () => {
    const { sharedGameState } = createCardHarness();
    const banditFort = new BanditFort(sharedGameState);
    const platinums = makeCards((s) => new Platinum(s), sharedGameState, 'platinum', 2);
    const foolsGolds = makeCards((s) => new FoolsGold(s), sharedGameState, 'fools-gold', 2);
    const potions = makeCards((s) => new Potion(s), sharedGameState, 'potion', 2);
    const gold = makeCards((s) => new Gold(s), sharedGameState, 'gold', 1);

    expect(banditFort.score([CardCollection.fromCards([...platinums, ...foolsGolds, ...potions, ...gold])])).toBe(-2);
  });

  it("counts its player's Silvers and Golds in every zone (set aside, on mats, deck, discard), not other players'", async () => {
    const game = createGame({ kingdom: ['Native Village', 'Haven', 'Island'] });
    game.alice.setHand(['Native Village', 'Haven', 'Island', 'Gold', 'Silver']);
    game.alice.setDeck(['Silver', 'Copper', 'Gold', 'Copper']);
    game.alice.setDiscard(['Silver', 'Estate']);
    game.bob.setHand(['Gold', 'Gold', 'Silver', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Native Village');
    await game.chooseOption('Put the top card of your deck face down on your Native Village mat');
    await game.playAction('Haven');
    await game.chooseCard('Gold');
    await game.playAction('Island');
    await game.chooseCard('Silver');

    expect(game.alice.nativeVillageMat).toEqual(['Silver']);
    expect(game.alice.setAside).toEqual(['Gold']);
    expect(game.alice.islandMat).toEqual(['Island', 'Silver']);
    expect(game.alice.deck).toEqual(['Gold', 'Copper']);
    const banditFort = new BanditFort(game.state);
    // 3 Silvers and 2 Golds: -10; Bob's 2 Golds and Silver count only for him
    expect(scoreFor(banditFort, game.alice)).toBe(-10);
    expect(scoreFor(banditFort, game.bob)).toBe(-6);
  });
});
