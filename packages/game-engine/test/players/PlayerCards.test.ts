import { CardInfo, CardLocation, CardType, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

const cardFactoryState = vi.hoisted(() => ({
  createCardMock: vi.fn(),
}));

vi.mock('../../src/card/CardFactory', () => ({
  CardFactory: vi.fn(function MockCardFactory() {
    return {
      createCard: cardFactoryState.createCardMock,
    };
  }),
}));

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { Cost } from '../../src/card/Cost';
import { CardEligibilityFunction } from '../../src/CardEligibilityFunction';
import { EffectTriggerType } from '../../src/effects/EffectTriggerType';
import { PlayerCards } from '../../src/players/PlayerCards';
import { SharedGameState } from '../../src/SharedGameState';

class TestCard extends Card {
  public setCoinsForTest(value: number): void {
    this.setCoins(value);
  }

  public markSimpleTreasureForTest(): void {
    this.markAsSimpleTreasure();
  }
}

const createCard = (name: string, id: string, type: CardType = CardType.ACTION): TestCard => {
  const state = {
    cost: vi.fn(() => Cost.Simple(0)),
    registerEffectTrigger: vi.fn(),
  } as unknown as SharedGameState;

  const cardInfo: CardInfo = {
    name,
    text: `${name} text`,
    font_size: 'small',
    cost: { coins: 0 },
    types: [type],
    expansion: Expansion.TESTING,
    mechanics: [],
  };

  const card = new TestCard(state, cardInfo);
  card.setId(id);
  return card;
};

const createPlayerCards = () => {
  const triggerEffect = vi.fn(async () => undefined);
  const gameState = {
    triggerEffect,
  };
  const logger = {
    gameMessage: vi.fn(),
  };
  const broadcaster = {
    updatePlayerCards: vi.fn(),
  };
  const botStatistics = {
    addCardToStatistics: vi.fn(),
  };
  const statistics = {
    setScore: vi.fn(),
  };
  const game = {
    getMessageBroadcaster: () => broadcaster,
    getLogger: () => logger,
    getGameState: () => gameState,
  };
  const player = {
    getGame: () => game,
    getBotStatistics: () => botStatistics,
    getStatistics: () => statistics,
  };

  const cards = new PlayerCards(player as never);

  return {
    cards,
    gameState,
    logger,
    botStatistics,
    statistics,
  };
};

describe('PlayerCards', () => {
  it('initializes starting deck cards through CardFactory and bot statistics', () => {
    const { cards, botStatistics } = createPlayerCards();
    const copper = createCard('Copper', 'copper-0', CardType.TREASURE);
    const estate = createCard('Estate', 'estate-0', CardType.VICTORY);
    cardFactoryState.createCardMock.mockReturnValueOnce(copper).mockReturnValueOnce(estate);

    cards.initialize({
      getCardNamesAndIds: () => [
        { name: 'Copper', id: 'copper-0' },
        { name: 'Estate', id: 'estate-0' },
      ],
    } as never);

    expect(cardFactoryState.createCardMock).toHaveBeenCalledWith('Copper', 'copper-0', CardLocation.DECK);
    expect(cardFactoryState.createCardMock).toHaveBeenCalledWith('Estate', 'estate-0', CardLocation.DECK);
    expect(botStatistics.addCardToStatistics).toHaveBeenCalledTimes(2);
    expect(cards.getDeck().size()).toBe(2);
  });

  it('maps card areas and supports area-based removal', () => {
    const { cards } = createPlayerCards();
    const handCard = createCard('Village', 'village-0');
    const discardCard = createCard('Copper', 'copper-0', CardType.TREASURE);

    cards.addCardToHand(handCard);
    cards.addCardToDiscard(discardCard);

    expect(cards.getCardsFromArea(CardLocation.HAND)).toBe(cards.getHand());
    expect(cards.getCardsFromArea(CardLocation.DISCARD)).toBe(cards.getDiscard());

    cards.removeCardFromLocation(handCard, CardLocation.HAND);
    expect(cards.getHand().size()).toBe(0);

    cards.removeCardsFromLocation(CardCollection.fromCards([discardCard]), CardLocation.DISCARD);
    expect(cards.getDiscard().size()).toBe(0);

    expect(() => cards.getCardsFromArea(CardLocation.TRASH)).toThrow('is not owned by the player');
  });

  it('adds cards to owned locations while updating card location metadata', () => {
    const { cards } = createPlayerCards();
    const deckCard = createCard('Copper', 'deck-0', CardType.TREASURE);
    const handCard = createCard('Village', 'hand-0');
    const inPlayCard = createCard('Smithy', 'inplay-0');

    cards.addCardToDeck(deckCard);
    cards.addCardToHand(handCard);
    cards.addCardToInPlay(inPlayCard);

    expect(deckCard.getLocation()).toBe(CardLocation.DECK);
    expect(handCard.getLocation()).toBe(CardLocation.HAND);
    expect(inPlayCard.getLocation()).toBe(CardLocation.IN_PLAY);
  });

  it('draws cards from deck into hand and logs only when cards were drawn', async () => {
    const { cards, logger } = createPlayerCards();
    cards.addCardToDeck(createCard('Copper', 'deck-0', CardType.TREASURE));
    cards.addCardToDeck(createCard('Estate', 'deck-1', CardType.VICTORY));

    const drawn = await cards.drawCards(2);

    expect(drawn.size()).toBe(2);
    expect(cards.getHand().size()).toBe(2);
    expect(cards.getDeck().size()).toBe(0);
    expect(logger.gameMessage).toHaveBeenCalledTimes(1);

    logger.gameMessage.mockClear();
    const drawnNone = await cards.drawCards(1);
    expect(drawnNone.size()).toBe(0);
    expect(logger.gameMessage).not.toHaveBeenCalled();
  });

  it('shuffles discard into deck when taking cards from an empty deck', async () => {
    const { cards, gameState, logger } = createPlayerCards();
    const discarded = createCard('Village', 'discard-0');
    cards.addCardToDiscard(discarded);

    const taken = await cards.takeCardOffDeck();

    expect(taken).toBeDefined();
    expect(taken?.getLocation()).toBe(CardLocation.REVEAL_LIMBO);
    expect(cards.getDiscard().size()).toBe(0);
    expect(gameState.triggerEffect).toHaveBeenCalledWith(EffectTriggerType.WOULD_SHUFFLE);
    expect(gameState.triggerEffect).toHaveBeenCalledWith(EffectTriggerType.SHUFFLE);
    expect(logger.gameMessage).toHaveBeenCalled();
  });

  it('can look at top deck card and insert cards at a chosen depth', async () => {
    const { cards } = createPlayerCards();
    const bottom = createCard('Copper', 'deck-0', CardType.TREASURE);
    const top = createCard('Silver', 'deck-1', CardType.TREASURE);
    const inserted = createCard('Gold', 'deck-2', CardType.TREASURE);

    cards.addCardToDeck(bottom);
    cards.addCardToDeck(top);

    expect(await cards.lookAtTopCardOfDeck()).toBe(top);

    cards.putCardIntoDeck(inserted, 1);
    expect(cards.getDeck().toCardNameArray()).toEqual(['Copper', 'Gold', 'Silver']);
  });

  it('discards with location checks and logs lost-track messages for mismatched cards', async () => {
    const { cards, gameState, logger } = createPlayerCards();
    const handCard = createCard('Village', 'hand-0');
    const wrongLocationCard = createCard('Smithy', 'wrong-0');

    cards.addCardToHand(handCard);
    wrongLocationCard.setLocation(CardLocation.DECK);

    await cards.discardCards(CardCollection.fromCards([handCard, wrongLocationCard]), CardLocation.HAND);

    expect(cards.getDiscard().contains(handCard)).toBe(true);
    expect(cards.getDiscard().contains(wrongLocationCard)).toBe(false);
    expect(gameState.triggerEffect).toHaveBeenCalledWith(EffectTriggerType.DISCARD, expect.any(CardCollection));
    expect(logger.gameMessage).toHaveBeenCalledTimes(2);
  });

  it('discards hand and cleanup-eligible in-play cards', async () => {
    const { cards } = createPlayerCards();
    const handCard = createCard('Village', 'hand-0');
    const discardable = createCard('Smithy', 'inplay-0');
    const notDiscardable = createCard('Monkey', 'inplay-1');
    notDiscardable.markAsUnfinished();

    cards.addCardToHand(handCard);
    cards.addCardToInPlay(discardable);
    cards.addCardToInPlay(notDiscardable);

    await cards.discardHand();
    await cards.discardAllFromInPlay();

    expect(cards.getHand().size()).toBe(0);
    expect(cards.getDiscard().contains(handCard)).toBe(true);
    expect(cards.getDiscard().contains(discardable)).toBe(true);
    expect(cards.getInPlay().contains(notDiscardable)).toBe(true);
  });

  it('gains cards to hand, deck, or discard based on target location', () => {
    const { cards } = createPlayerCards();
    const handGain = createCard('Village', 'gain-hand');
    const deckGain = createCard('Copper', 'gain-deck', CardType.TREASURE);
    const discardGain = createCard('Estate', 'gain-discard', CardType.VICTORY);

    cards.gain(handGain, CardLocation.HAND);
    cards.gain(deckGain, CardLocation.DECK);
    cards.gain(discardGain, CardLocation.DISCARD);

    expect(cards.getHand().contains(handGain)).toBe(true);
    expect(cards.getDeck().contains(deckGain)).toBe(true);
    expect(cards.getDiscard().contains(discardGain)).toBe(true);
  });

  it('calculates score across all zones and updates player statistics', () => {
    const { cards, statistics } = createPlayerCards();
    const handCard = createCard('Estate', 'estate-0', CardType.VICTORY);
    const deckCard = createCard('Duchy', 'duchy-0', CardType.VICTORY);
    vi.spyOn(handCard, 'score').mockReturnValue(1);
    vi.spyOn(deckCard, 'score').mockReturnValue(3);

    cards.addCardToHand(handCard);
    cards.addCardToDeck(deckCard);

    cards.calculatePoints();

    expect(statistics.setScore).toHaveBeenCalledWith(4);
  });

  it('supports native village and hand/deck matching helpers plus effect lookup', () => {
    const { cards } = createPlayerCards();
    const copper = createCard('Copper', 'copper-0', CardType.TREASURE);
    copper.markSimpleTreasureForTest();
    copper.setCoinsForTest(1);
    const village = createCard('Village', 'village-0', CardType.ACTION);
    const effect = {
      getTrigger: vi.fn(() => EffectTriggerType.TURN_START),
      getSource: vi.fn(),
    } as never;
    village.addEffect(effect);

    cards.addCardToHand(copper);
    cards.addCardToHand(village);
    cards.removeCardFromHand(village);
    cards.addCardToInPlay(village);
    cards.addCardToNativeVillageMat(copper);
    cards.removeCardFromHand(copper);

    const treasureEligibility = new CardEligibilityFunction((card) => card.hasType(CardType.TREASURE));
    const actionEligibility = new CardEligibilityFunction((card) => card.hasType(CardType.ACTION));

    expect(cards.calculateSimpleTreasureCoinsInHand()).toBe(0);
    cards.addCardsToHand(cards.removeAllCardsFromNativeVillageMat());
    expect(cards.calculateSimpleTreasureCoinsInHand()).toBe(1);
    expect(cards.hasMatchingCardInHand(treasureEligibility)).toBe(true);
    expect(cards.hasMatchingCardInPlay(actionEligibility)).toBe(true);
    expect(cards.numMatchingCardsInHand(treasureEligibility)).toBe(1);
    expect(cards.getMatchingCardsInHand(treasureEligibility).size()).toBe(1);
    expect(cards.getEffectsByType(EffectTriggerType.TURN_START)).toEqual([effect]);
    expect(cards.getDeckEffectsByType(EffectTriggerType.TURN_START)).toEqual([]);
  });

  it('retrieves cards by metadata across owned locations', () => {
    const { cards } = createPlayerCards();
    const handCard = createCard('Village', 'hand-0');
    const deckCard = createCard('Copper', 'deck-0', CardType.TREASURE);
    const inPlayCard = createCard('Smithy', 'inplay-0');

    cards.addCardToHand(handCard);
    cards.addCardToDeck(deckCard);
    cards.addCardToInPlay(inPlayCard);

    expect(cards.getCardByMetadata(handCard.getMetadata())).toBe(handCard);
    expect(cards.getCardByMetadata(deckCard.getMetadata())).toBe(deckCard);
    expect(cards.getCardByMetadata(inPlayCard.getMetadata())).toBe(inPlayCard);

    const combined = cards.getCardsByMetadata([
      handCard.getMetadata(),
      deckCard.getMetadata(),
      { ...inPlayCard.getMetadata(), id: 'missing-id' },
    ]);
    expect(combined.size()).toBe(2);
  });
});
