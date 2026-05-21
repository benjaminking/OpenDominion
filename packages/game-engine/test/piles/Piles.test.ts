import { CardInfo, CardType, Expansion, PileCategory } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { Cost } from '../../src/card/Cost';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { Pile } from '../../src/piles/Pile';
import { Piles } from '../../src/piles/Piles';
import { SharedGameState } from '../../src/SharedGameState';

class TestCard extends Card {}

const createSharedGameStateMock = (cost?: Cost) => {
  const resolvedCost = cost ?? Cost.Simple(0);
  return {
    cost: vi.fn(() => resolvedCost),
    registerEffectTrigger: vi.fn(),
  } as unknown as SharedGameState;
};

const createCard = (id: string, name: string, cost: Cost, types: CardType[] = [CardType.ACTION]): Card => {
  const card = new TestCard(createSharedGameStateMock(cost), {
    name,
    text: 'Test card text',
    font_size: 'small',
    cost: cost.toCommonCost(),
    types,
    expansion: Expansion.TESTING,
    mechanics: [],
  } satisfies CardInfo);
  card.setId(id);
  return card;
};

const createPile = (name: string, cards: Card[], types: CardType[] = [CardType.ACTION]): Pile => {
  return new Pile(name, CardCollection.fromCards(cards), new Set(types), new Set([PileCategory.KINGDOM]), {
    sendPileMetadata: vi.fn(),
  } as unknown as GameMessageBroadcaster);
};

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

  it('returns buyable supply card choices in cost order and within the provided coin limit', () => {
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

    expect(piles.getEligibleCardChoicesToBuy(4)).toEqual([
      {
        type: 'card',
        card: villagePile.getTopCard()!.getMetadata(),
      },
      {
        type: 'card',
        card: copperPile.getTopCard()!.getMetadata(),
      },
    ]);
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
});
