import { CardCategory, CardInfo, CardLocation, CardType, Expansion, PileCategory } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { CardFactory } from '../../src/card/CardFactory';
import { Cost } from '../../src/card/Cost';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { Pile } from '../../src/piles/Pile';
import { Piles } from '../../src/piles/Piles';
import { createTestClock } from '../testClock';

class TestCard extends Card {}

const createSharedGameStateMock = (cost?: Cost) => {
  const resolvedCost = cost ?? Cost.Simple(0);
  return {
    cost: vi.fn(() => resolvedCost),
    registerEffectTrigger: vi.fn(),
    ...createTestClock(),
  } as unknown as SharedGameState;
};

const createCard = (
  id: string,
  name: string,
  cost: Cost,
  types: CardType[] = [CardType.ACTION],
  pileNameOverride?: string,
): Card => {
  const card = new TestCard(createSharedGameStateMock(cost), {
    name,
    category: CardCategory.CARD,
    text: 'Test card text',
    font_size: 'small',
    cost: cost.toCommonCost(),
    types,
    expansion: Expansion.TESTING,
    mechanics: [],
    pileNameOverride,
  } satisfies CardInfo);
  card.setId(id);
  return card;
};

const createPile = (name: string, cards: Card[], types: CardType[] = [CardType.ACTION]): Pile => {
  return new Pile(name, CardCollection.fromCards(cards), new Set(types), new Set([PileCategory.KINGDOM]), {
    sendPileMetadata: vi.fn(),
  } as unknown as GameMessageBroadcaster);
};

const createCards = (count: number, name: string, cost: Cost, types?: CardType[], pileNameOverride?: string): Card[] =>
  Array.from({ length: count }, (_, index) =>
    createCard(`${name}-${String(index)}`, name, cost, types, pileNameOverride),
  );

describe('Piles', () => {
  it('adds supply piles into the expected groups and reports top cards and empty-pile counts', () => {
    const copperPile = createPile(
      'Copper',
      [createCard('copper-id', 'Copper', Cost.Simple(0), [CardType.TREASURE])],
      [CardType.TREASURE],
    );
    const estatePile = createPile(
      'Estate',
      [createCard('estate-id', 'Estate', Cost.Simple(2), [CardType.VICTORY])],
      [CardType.VICTORY],
    );
    const villagePile = createPile('Village', []);
    const piles = new Piles();

    piles.addBasicTreasurePile(copperPile);
    piles.addBasicVictoryPile(estatePile);
    piles.addKingdomPile(villagePile);

    expect(piles.basicTreasurePiles.getPileByName('Copper')).toBe(copperPile);
    expect(piles.basicVictoryPiles.getPileByName('Estate')).toBe(estatePile);
    expect(piles.kingdomPiles.getPileByName('Village')).toBe(villagePile);
    expect(piles.getTopCardsOfSupplyPiles().toCardNameArray()).toEqual(['Copper', 'Estate']);
    expect(piles.numEmptySupplyPiles).toBe(1);
  });

  it('gets and removes cards from named piles while leaving missing piles untouched', () => {
    const village = createCard('village-id', 'Village', Cost.Simple(3));
    const smithy = createCard('smithy-id', 'Smithy', Cost.Simple(4));
    const actionPile = createPile('Village', [village, smithy]);
    const piles = new Piles();

    piles.addKingdomPile(actionPile);

    expect(piles.getTopCardOfPile('Village')).toBe(smithy);
    expect(piles.getTopCardOfPile('Market')).toBeUndefined();
    expect(piles.getPileSizeByName('Village')).toBe(2);
    expect(piles.getPileSizeByName('Market')).toBe(0);
    expect(piles.isPileEmpty('Village')).toBe(false);
    expect(piles.isPileEmpty('Market')).toBe(false);

    expect(piles.removeCardFromPile(village)).toBe(village);
    expect(piles.getPileSizeByName('Village')).toBe(1);
    expect(piles.removeTopCardFromPile('Village')).toBe(smithy);
    expect(piles.removeTopCardFromPile('Village')).toBeUndefined();
    expect(piles.isPileEmpty('Village')).toBe(true);
  });

  it('returns buyable supply card choices in descending cost order', () => {
    const copperPile = createPile(
      'Copper',
      [createCard('copper-id', 'Copper', Cost.Simple(0), [CardType.TREASURE])],
      [CardType.TREASURE],
    );
    const villagePile = createPile('Village', [createCard('village-id', 'Village', Cost.Simple(3))]);
    const marketPile = createPile('Market', [createCard('market-id', 'Market', Cost.Simple(5))]);
    const provincePile = createPile(
      'Province',
      [createCard('province-id', 'Province', Cost.Simple(8), [CardType.VICTORY])],
      [CardType.VICTORY],
    );
    const piles = new Piles();

    piles.addBasicTreasurePile(copperPile);
    piles.addKingdomPile(villagePile);
    piles.addKingdomPile(marketPile);
    piles.addBasicVictoryPile(provincePile);

    const choices = piles.getEligibleCardChoicesToBuy();
    expect(choices.map((choice) => choice.card.name)).toEqual(['Province', 'Market', 'Village', 'Copper']);
  });

  it('recognizes supply piles by name', () => {
    const copperPile = createPile(
      'Copper',
      [createCard('copper-id', 'Copper', Cost.Simple(0), [CardType.TREASURE])],
      [CardType.TREASURE],
    );
    const villagePile = createPile('Village', [createCard('village-id', 'Village', Cost.Simple(3))]);
    const piles = new Piles();

    piles.addBasicTreasurePile(copperPile);
    piles.addKingdomPile(villagePile);

    expect(piles.isSupplyPile('Copper')).toBe(true);
    expect(piles.isSupplyPile('Village')).toBe(true);
    expect(piles.isSupplyPile('Market')).toBe(false);
  });

  it('computes gains needed to end as the smaller of provinces and the three emptiest supply piles', () => {
    const provincePile = createPile(
      'Province',
      Array.from({ length: 5 }, (_, index) =>
        createCard(`province-${String(index)}`, 'Province', Cost.Simple(8), [CardType.VICTORY]),
      ),
      [CardType.VICTORY],
    );
    const copperPile = createPile(
      'Copper',
      Array.from({ length: 8 }, (_, index) =>
        createCard(`copper-${String(index)}`, 'Copper', Cost.Simple(0), [CardType.TREASURE]),
      ),
      [CardType.TREASURE],
    );
    const villagePile = createPile(
      'Village',
      Array.from({ length: 2 }, (_, index) => createCard(`village-${String(index)}`, 'Village', Cost.Simple(3))),
    );
    const smithyPile = createPile(
      'Smithy',
      Array.from({ length: 4 }, (_, index) => createCard(`smithy-${String(index)}`, 'Smithy', Cost.Simple(4))),
    );
    const marketPile = createPile(
      'Market',
      Array.from({ length: 7 }, (_, index) => createCard(`market-${String(index)}`, 'Market', Cost.Simple(5))),
    );
    const piles = new Piles();

    piles.addBasicVictoryPile(provincePile);
    piles.addBasicTreasurePile(copperPile);
    piles.addKingdomPile(villagePile);
    piles.addKingdomPile(smithyPile);
    piles.addKingdomPile(marketPile);

    expect(piles.getGainsNeededToEnd()).toBe(5);
  });

  it('keeps non-kingdom supply piles in the Supply but out of the Kingdom', () => {
    const ruinsPile = createPile('Ruins', createCards(2, 'Survivors', Cost.Simple(0), [CardType.ACTION], 'Ruins'));
    const emptyPile = createPile('Empty', []);
    const piles = new Piles();

    piles.addNonKingdomSupplyPile(ruinsPile);
    piles.addNonKingdomSupplyPile(emptyPile);

    expect(piles.supplyPiles.getPileByName('Ruins')).toBe(ruinsPile);
    expect(piles.allPiles.getPileByName('Ruins')).toBe(ruinsPile);
    expect(piles.kingdomPiles.hasPile('Ruins')).toBe(false);
    expect(piles.nonSupplyPiles.hasPile('Ruins')).toBe(false);
    expect(piles.isSupplyPile('Ruins')).toBe(true);
    expect(piles.isPile('Ruins')).toBe(true);
    expect(piles.getTopCardsOfSupplyPiles().toCardNameArray()).toEqual(['Survivors']);
    expect(piles.numEmptySupplyPiles).toBe(1);
  });

  it('keeps non-supply piles out of the Supply while still finding them by name', () => {
    const spoils = createCards(2, 'Spoils', Cost.Simple(0), [CardType.TREASURE]);
    const spoilsPile = createPile('Spoils', spoils, [CardType.TREASURE]);
    const emptyMadmanPile = createPile('Madman', []);
    const villagePile = createPile('Village', [createCard('village-id', 'Village', Cost.Simple(3))]);
    const piles = new Piles();

    piles.addNonSupplyPile(spoilsPile);
    piles.addNonSupplyPile(emptyMadmanPile);
    piles.addKingdomPile(villagePile);

    expect(piles.nonSupplyPiles.getPileByName('Spoils')).toBe(spoilsPile);
    expect(piles.allPiles.getPileByName('Spoils')).toBe(spoilsPile);
    expect(piles.isSupplyPile('Spoils')).toBe(false);
    expect(piles.isPile('Spoils')).toBe(true);
    expect(piles.isPile('Market')).toBe(false);
    expect(piles.getTopCardOfPile('Spoils')).toBe(spoils[1]);
    expect(piles.getTopCardsOfSupplyPiles().toCardNameArray()).toEqual(['Village']);
    expect(piles.getEligibleCardChoicesToBuy().map((choice) => choice.card.name)).toEqual(['Village']);
    expect(piles.numEmptySupplyPiles).toBe(0);
    expect(piles.isPileEmpty('Madman')).toBe(true);
  });

  it('returns a card to the top of the pile it belongs to', () => {
    const villages = createCards(3, 'Village', Cost.Simple(3));
    const ruins = createCards(2, 'Survivors', Cost.Simple(0), [CardType.ACTION, CardType.RUINS], 'Ruins');
    const piles = new Piles();
    piles.addKingdomPile(createPile('Village', villages));
    piles.addNonKingdomSupplyPile(createPile('Ruins', ruins));

    const gainedVillage = piles.removeTopCardFromPile('Village')!;
    const gainedRuins = piles.removeTopCardFromPile('Ruins')!;
    piles.returnCardToPile(gainedVillage);
    piles.returnCardToPile(gainedRuins);

    expect(piles.getPileSizeByName('Village')).toBe(3);
    expect(piles.getTopCardOfPile('Village')).toBe(gainedVillage);
    expect(piles.getPileSizeByName('Ruins')).toBe(2);
    expect(piles.getTopCardOfPile('Ruins')).toBe(gainedRuins);
  });

  it('ignores a returned card whose pile is not in the game', () => {
    const piles = new Piles();
    piles.addKingdomPile(createPile('Village', createCards(1, 'Village', Cost.Simple(3))));

    expect(() => {
      piles.returnCardToPile(createCard('smithy-id', 'Smithy', Cost.Simple(4)));
    }).not.toThrow();
    expect(piles.getPileSizeByName('Village')).toBe(1);
    expect(piles.isPile('Smithy')).toBe(false);
  });

  it('removes a specific card from its pile without disturbing the rest', () => {
    const villages = createCards(3, 'Village', Cost.Simple(3));
    const piles = new Piles();
    piles.addKingdomPile(createPile('Village', villages));

    expect(piles.removeCardFromPile(villages[1])).toBe(villages[1]);
    expect(piles.getPileSizeByName('Village')).toBe(2);
    expect(piles.getTopCardOfPile('Village')).toBe(villages[2]);
    expect(piles.isCardInPile(villages[1], 'Village')).toBe(false);
    expect(piles.removeCardFromPile(villages[1])).toBeUndefined();
    expect(piles.getPileSizeByName('Village')).toBe(2);
    expect(piles.removeCardFromPile(createCard('smithy-id', 'Smithy', Cost.Simple(4)))).toBeUndefined();
  });

  it('reports whether a specific card is in a named pile', () => {
    const villages = createCards(2, 'Village', Cost.Simple(3));
    const otherVillage = createCard('other-village', 'Village', Cost.Simple(3));
    const piles = new Piles();
    piles.addKingdomPile(createPile('Village', villages));
    piles.addKingdomPile(createPile('Smithy', createCards(1, 'Smithy', Cost.Simple(4))));

    expect(piles.isCardInPile(villages[0], 'Village')).toBe(true);
    expect(piles.isCardInPile(villages[0], 'Smithy')).toBe(false);
    expect(piles.isCardInPile(villages[0], 'Market')).toBe(false);
    expect(piles.isCardInPile(otherVillage, 'Village')).toBe(false);
  });

  it('returns one card of each name from a pile', () => {
    const ruins = [
      ...createCards(2, 'Abandoned Mine', Cost.Simple(0), [CardType.RUINS], 'Ruins'),
      ...createCards(3, 'Survivors', Cost.Simple(0), [CardType.RUINS], 'Ruins'),
      ...createCards(1, 'Ruined Library', Cost.Simple(0), [CardType.RUINS], 'Ruins'),
    ];
    const piles = new Piles();
    piles.addNonKingdomSupplyPile(createPile('Ruins', ruins));

    const uniqueCards = piles.getUniqueCardsFromPile('Ruins');

    expect([...uniqueCards.toCardNameArray()].sort()).toEqual(['Abandoned Mine', 'Ruined Library', 'Survivors']);
    expect(piles.getPileSizeByName('Ruins')).toBe(6);
    expect(piles.getUniqueCardsFromPile('Knights').size()).toBe(0);
  });

  it('finds a card anywhere in a named pile from its metadata', () => {
    const rewards = [
      createCard('coronet-id', 'Coronet', Cost.Simple(0), [CardType.REWARD], 'Rewards'),
      createCard('renown-id', 'Renown', Cost.Simple(0), [CardType.REWARD], 'Rewards'),
    ];
    const piles = new Piles();
    piles.addNonSupplyPile(createPile('Rewards', rewards));
    piles.addKingdomPile(createPile('Village', createCards(1, 'Village', Cost.Simple(3))));

    expect(piles.getCardFromMetadata(rewards[0].getMetadata(), 'Rewards')).toBe(rewards[0]);
    expect(piles.getCardFromMetadata(rewards[0].getMetadata(), 'Village')).toBeUndefined();
    expect(piles.getCardFromMetadata(rewards[0].getMetadata(), 'Prizes')).toBeUndefined();
  });

  it('replaces matching cards in every pile, keeping their ids, location and supply status', () => {
    const curses = createCards(2, 'Curse', Cost.Simple(0), [CardType.CURSE]);
    for (const curse of curses) {
      curse.markAsSupplyCard();
    }
    const villages = createCards(1, 'Village', Cost.Simple(3));
    const nonSupplyCurse = createCard('loose-curse', 'Curse', Cost.Simple(0), [CardType.CURSE]);
    const cardFactory = {
      createCard: vi.fn((name: string, id: string) => createCard(id, name, Cost.Simple(0), [CardType.CURSE])),
    } as unknown as CardFactory;
    const piles = new Piles();
    piles.addBasicVictoryPile(createPile('Curse', curses, [CardType.CURSE]));
    piles.addKingdomPile(createPile('Village', [...villages]));
    piles.addNonSupplyPile(createPile('Loose', [nonSupplyCurse]));

    piles.replaceCardsInPiles('Curse', 'CharlatanCurse', cardFactory);

    const cursePile = piles.allPiles.getPileByName('Curse')!;
    expect(cursePile.toCardNameArray()).toEqual(['CharlatanCurse', 'CharlatanCurse']);
    expect(cursePile.asCardArray().map((card) => card.getId())).toEqual(['Curse-0', 'Curse-1']);
    expect(cursePile.asCardArray().every((card) => card.isSupplyCard())).toBe(true);
    expect(cursePile.asCardArray().every((card) => card.getLocation() === CardLocation.PILE)).toBe(true);
    expect(piles.allPiles.getPileByName('Loose')!.toCardNameArray()).toEqual(['CharlatanCurse']);
    expect(piles.allPiles.getPileByName('Loose')!.getTopCard()!.isSupplyCard()).toBe(false);
    expect(piles.allPiles.getPileByName('Village')!.asCardArray()).toEqual(villages);
  });

  it('ends the game when the Provinces run out or three supply piles are empty', () => {
    const createPiles = (provinceCount: number, emptySupplyPiles: number, emptyNonSupplyPiles: number) => {
      const piles = new Piles();
      piles.addBasicVictoryPile(
        createPile('Province', createCards(provinceCount, 'Province', Cost.Simple(8), [CardType.VICTORY])),
      );
      for (let index = 0; index < emptySupplyPiles; index++) {
        piles.addKingdomPile(createPile(`Empty Supply ${String(index)}`, []));
      }
      for (let index = 0; index < emptyNonSupplyPiles; index++) {
        piles.addNonSupplyPile(createPile(`Empty Non-Supply ${String(index)}`, []));
      }
      return piles;
    };

    expect(createPiles(1, 2, 0).areGameEndingConditionsMet()).toBe(false);
    expect(createPiles(1, 3, 0).areGameEndingConditionsMet()).toBe(true);
    expect(createPiles(0, 0, 0).areGameEndingConditionsMet()).toBe(true);
    expect(createPiles(1, 2, 3).areGameEndingConditionsMet()).toBe(false);
  });
});
