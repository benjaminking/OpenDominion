import { CardInfo, CardLocation, CardType, ChoiceType, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { Cost } from '../../src/card/Cost';
import { CardEligibilityFunction } from '../../src/CardEligibilityFunction';
import { CardPlayOptions } from '../../src/CardPlayOptions';
import { Effect } from '../../src/effects/Effect';
import { EffectTriggerType } from '../../src/effects/EffectTriggerType';
import {
  EndOfPlayersNextTurnEffectExpiration,
  OnceThisTurnEffectExpiration,
  StartOfPlayersNextTurnEffectExpiration,
} from '../../src/effects/StandardEffectExpirations';
import { NextTurnEligibility, ThisTurnEligibility } from '../../src/effects/StandardTurnEligibilityFunctions';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';
import { Player } from '../../src/players/Player';
import { PlayerCards } from '../../src/players/PlayerCards';
import { SharedGameState } from '../../src/SharedGameState';

class TestCard extends Card {
  public override async play(_instructionExecutor: InstructionExecutor): Promise<void> {
    return undefined;
  }

  public setCoinsForTest(value: number): void {
    this.setCoins(value);
  }

  public markSimpleTreasureForTest(): void {
    this.markAsSimpleTreasure();
  }
}

const createCard = (name: string, id: string, type: CardType = CardType.ACTION): TestCard => {
  const sharedGameState = {
    cost: vi.fn(() => Cost.Simple(0)),
    registerEffectTrigger: vi.fn(),
  };

  const cardInfo: CardInfo = {
    name,
    text: `${name} text`,
    font_size: 'small',
    cost: { coins: 0 },
    types: [type],
    expansion: Expansion.TESTING,
    mechanics: [],
  };

  const card = new TestCard(sharedGameState as unknown as SharedGameState, cardInfo);
  card.setId(id);
  return card;
};

const createEffect = (options: {
  id: string;
  ownerName: string;
  mandatory?: boolean;
  trigger?: EffectTriggerType;
  self?: boolean;
  cardEligibility?: CardEligibilityFunction;
  doAction?: ReturnType<typeof vi.fn>;
}) => {
  return {
    getId: () => options.id,
    getOwner: () => ({ getName: () => options.ownerName }),
    getTrigger: () => options.trigger ?? EffectTriggerType.GAIN,
    getSource: () => ({}) as never,
    getCardEligibility: () => options.cardEligibility ?? new CardEligibilityFunction(() => true),
    getTurnEligibility: () => ({}) as never,
    isSelf: () => options.self ?? false,
    hasExpired: () => false,
    areOtherConditionsSatisfied: () => true,
    isMandatory: () => options.mandatory ?? false,
    doAction: options.doAction ?? vi.fn(async () => undefined),
  } as unknown as Effect;
};

const createHarness = () => {
  const logger = {
    gameMessage: vi.fn(),
  };
  const broadcaster = {
    updatePlayerCards: vi.fn(),
  };
  const decisionService = {
    chooseExtraTurns: vi.fn(async () => ({ type: ChoiceType.ExtraTurn })),
    chooseOneOption: vi.fn(async () => ({ getName: () => '0' })),
    chooseCard: vi.fn(async () => ({ type: ChoiceType.None })),
    chooseFromMultipleEvents: vi.fn(async () => ({ type: ChoiceType.None })),
  };
  const statistics = {
    addActions: vi.fn(),
    addBuys: vi.fn(),
    addCoins: vi.fn(async () => undefined),
    addVP: vi.fn(),
    getUnofficialTurnNumber: vi.fn(() => 0),
    spendCoins: vi.fn(),
    useBuy: vi.fn(),
    useAction: vi.fn(),
    setScore: vi.fn(),
    hasPlayedMatchingCardThisTurn: vi.fn(() => false),
    hasGainedMatchingCardThisTurn: vi.fn(() => false),
    numMatchingCardsPlayedThisTurn: vi.fn(() => 0),
    addPlayedCard: vi.fn(),
    addGainedCard: vi.fn(),
    setNumCardsToDrawInCleanup: vi.fn(),
  };
  const effects = {
    addEffect: vi.fn(),
    addExtraTurn: vi.fn(),
    blockAttack: vi.fn(),
    findValidExtraTurns: vi.fn(() => []),
    getEffectsByType: vi.fn((): Effect[] => []),
  };
  const sharedExtraCards = new CardCollection();
  const sharedTrash = new CardCollection();
  const sharedCardsById = new Map<string, Card>();
  const sharedAreas = new Map<CardLocation, CardCollection>([
    [CardLocation.DISCARD, new CardCollection()],
    [CardLocation.TRASH, sharedTrash],
    [CardLocation.REVEAL_LIMBO, new CardCollection()],
  ]);
  const pileCards = new Map<string, Card[]>();
  const topCardsOfSupplyPiles = new CardCollection();

  const piles = {
    getTopCardOfPile: vi.fn((pileName: string) => pileCards.get(pileName)?.[0]),
    isPileEmpty: vi.fn((pileName: string) => (pileCards.get(pileName)?.length ?? 0) === 0),
    removeTopCardFromPile: vi.fn((pileName: string) => pileCards.get(pileName)?.shift()),
    getTopCardsOfSupplyPiles: vi.fn(() => topCardsOfSupplyPiles),
  };

  const sharedGameState = {
    piles,
    trash: sharedTrash,
    cardsPlayedThisTurn: new CardCollection(),
    triggerEffect: vi.fn(async () => undefined),
    registerEffectTrigger: vi.fn(),
    isSharedLocation: vi.fn(
      (location: CardLocation) =>
        location === CardLocation.DISCARD || location === CardLocation.TRASH || location === CardLocation.REVEAL_LIMBO,
    ),
    getCardByMetadata: vi.fn((metadata) => sharedCardsById.get(metadata.id)),
    getCardsFromArea: vi.fn((location: CardLocation) => sharedAreas.get(location) ?? new CardCollection()),
    getPreviousTurns: vi.fn(() => []),
    getCurrentTurn: vi.fn(() => ({}) as never),
    getAllExtraCards: vi.fn(() => sharedExtraCards),
    getCurrentPlayer: vi.fn(() => player),
    isTurnEligibilitySatisfied: vi.fn(() => true),
    addPlayedCard: vi.fn((card: Card) => {
      sharedGameState.cardsPlayedThisTurn.addCard(card);
    }),
    clearBlocksForAttackCard: vi.fn(),
    performAttack: vi.fn(async () => undefined),
    executeForEachPlayer: vi.fn(
      async (sharedInstruction: (instructionExecutor: InstructionExecutor) => Promise<void>) => {
        await sharedInstruction(executor);
      },
    ),
    executeForEachOtherPlayer: vi.fn(
      async (sharedInstruction: (instructionExecutor: InstructionExecutor) => Promise<void>) => {
        await sharedInstruction(executor);
      },
    ),
    eachPlayerPassesACardToTheLeft: vi.fn(async () => undefined),
    pushActiveEffectOntoStack: vi.fn(),
    popActiveEffectOffOfStack: vi.fn(),
    trashCards: vi.fn(async (_player: unknown, cards: CardCollection) => {
      sharedTrash.addCards(cards);
      return cards;
    }),
  };

  const game = {
    getLogger: () => logger,
    getMessageBroadcaster: () => broadcaster,
    getGameState: () => sharedGameState as unknown as SharedGameState,
  };

  const player = {
    getGame: () => game,
    getStatistics: () => statistics,
    getEffects: () => effects,
    getDecisionService: () => decisionService,
    getName: () => 'Alice',
    getBotStatistics: () => ({ addCardToStatistics: vi.fn() }),
    calculateScore: vi.fn(),
  } as unknown as Player;

  const ownedCards = new PlayerCards(player);
  player.getOwnedCards = () => ownedCards;

  const executor = new InstructionExecutor(sharedGameState as unknown as SharedGameState, player);

  return {
    executor,
    player,
    ownedCards,
    statistics,
    effects,
    logger,
    broadcaster,
    decisionService,
    sharedGameState,
    sharedCardsById,
    sharedAreas,
    sharedExtraCards,
    sharedTrash,
    piles,
    pileCards,
    topCardsOfSupplyPiles,
  };
};

describe('InstructionExecutor', () => {
  it('forwards stats, lookup, and eligibility helpers', () => {
    const { executor, player, ownedCards, statistics, sharedGameState, sharedExtraCards } = createHarness();
    const forceDiscardBroadcastSpy = vi
      .spyOn(ownedCards, 'forceFullBroadcastOfDiscard')
      .mockImplementation(() => undefined);
    const handCard = createCard('Village', 'hand-0');
    const playedCard = createCard('Smithy', 'played-0');
    const gainedCard = createCard('Copper', 'gained-0', CardType.TREASURE);
    const sharedCard = createCard('Province', 'shared-0', CardType.VICTORY);
    sharedCard.setLocation(CardLocation.DISCARD);
    const matchingEligibility = new CardEligibilityFunction((card) => card.hasType(CardType.ACTION));

    ownedCards.addCardToHand(handCard);
    player.getStatistics().addPlayedCard(playedCard);
    player.getStatistics().addGainedCard(gainedCard);
    sharedGameState.cardsPlayedThisTurn.addCard(playedCard);
    sharedExtraCards.addCard(sharedCard);
    sharedGameState.getCardByMetadata.mockReturnValue(sharedCard);

    executor.addActions(2);
    executor.addBuys(3);
    executor.addVP(4);

    expect(executor.getSharedGameState()).toBe(sharedGameState);
    expect(executor.handSize()).toBe(1);
    expect(executor.hasMatchingCardInHand(matchingEligibility)).toBe(true);
    expect(executor.hasMatchingCardInPlay(matchingEligibility)).toBe(false);
    statistics.hasPlayedMatchingCardThisTurn.mockReturnValue(true);
    statistics.hasGainedMatchingCardThisTurn.mockReturnValue(true);
    statistics.numMatchingCardsPlayedThisTurn.mockReturnValue(1);

    expect(executor.hasPlayedMatchingCardThisTurn(matchingEligibility)).toBe(true);
    expect(
      executor.hasGainedMatchingCardThisTurn(new CardEligibilityFunction((card) => card.getId() === 'gained-0')),
    ).toBe(true);
    expect(executor.numMatchingCardsInHand(matchingEligibility)).toBe(1);
    expect(executor.numMatchingCardsPlayedThisTurn(matchingEligibility)).toBe(1);
    expect(executor.getMatchingCardsInHand(matchingEligibility).size()).toBe(1);
    expect(executor.getCardByMetadata(sharedCard.getMetadata())).toBe(sharedCard);
    expect(executor.getCardsByMetadata([handCard.getMetadata(), sharedCard.getMetadata()]).size()).toBe(2);
    expect(executor.createThisTurnEligibilityFunction()).toBeInstanceOf(ThisTurnEligibility);
    expect(executor.createNextTurnEligibilityFunction()).toBeInstanceOf(NextTurnEligibility);
    expect(executor.createOnceThisTurnEffectExpiration()).toBeInstanceOf(OnceThisTurnEffectExpiration);
    expect(executor.createEndOfMyNextTurnEffectExpiration()).toBeInstanceOf(EndOfPlayersNextTurnEffectExpiration);
    expect(executor.createStartOfMyNextTurnEffectExpiration()).toBeInstanceOf(StartOfPlayersNextTurnEffectExpiration);
    expect(executor.createStartOfPlayersNextTurnEffectExpiration(player)).toBeInstanceOf(
      StartOfPlayersNextTurnEffectExpiration,
    );
    expect(executor.getAllExtraCards()).toBe(sharedExtraCards);
    executor.setNumCardsToDrawInCleanup(2);
    executor.forceFullBroadcastOfDiscard();

    expect(statistics.addActions).toHaveBeenCalledWith(2);
    expect(statistics.addBuys).toHaveBeenCalledWith(3);
    expect(statistics.addVP).toHaveBeenCalledWith(4);
    expect(statistics.setNumCardsToDrawInCleanup).toHaveBeenCalledWith(2);
    expect(forceDiscardBroadcastSpy).toHaveBeenCalledTimes(1);
  });

  it('plays cards from hand and simple treasures through the owned card zones', async () => {
    const { executor, ownedCards, statistics, sharedGameState, logger } = createHarness();
    const actionCard = createCard('Village', 'action-0', CardType.ACTION);
    const treasureLow = createCard('Copper', 'treasure-0', CardType.TREASURE);
    const treasureHigh = createCard('Silver', 'treasure-1', CardType.TREASURE);
    treasureLow.markSimpleTreasureForTest();
    treasureLow.setCoinsForTest(1);
    treasureHigh.markSimpleTreasureForTest();
    treasureHigh.setCoinsForTest(2);

    ownedCards.addCardToHand(actionCard);
    ownedCards.addCardToHand(treasureLow);
    ownedCards.addCardToHand(treasureHigh);

    const playSpy = vi.spyOn(actionCard, 'play');
    await executor.playCardFromHand(actionCard);

    expect(ownedCards.getHand().contains(actionCard)).toBe(false);
    expect(ownedCards.getInPlay().contains(actionCard)).toBe(true);
    expect(statistics.useAction).toHaveBeenCalledTimes(1);
    expect(sharedGameState.addPlayedCard).toHaveBeenCalledWith(actionCard);
    expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(
      EffectTriggerType.ABOUT_TO_PLAY_CARD,
      expect.any(CardCollection),
    );
    expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(
      EffectTriggerType.PLAYED_CARD,
      expect.any(CardCollection),
    );
    expect(playSpy).toHaveBeenCalledTimes(1);

    const playCardFromHandSpy = vi.spyOn(executor, 'playCardFromHand');
    logger.gameMessage.mockClear();
    await executor.playSimpleTreasures();

    expect(logger.gameMessage).toHaveBeenCalledTimes(1);
    expect(playCardFromHandSpy).toHaveBeenCalledTimes(2);
    expect(playCardFromHandSpy.mock.calls.every((call) => call[1] === CardPlayOptions.DONT_LOG)).toBe(true);
    expect(ownedCards.getInPlay().contains(treasureLow)).toBe(true);
    expect(ownedCards.getInPlay().contains(treasureHigh)).toBe(true);

    const repeatCard = createCard('Smithy', 'repeat-0', CardType.ACTION);
    ownedCards.addCardToHand(repeatCard);
    const repeatSpy = vi.spyOn(repeatCard, 'play');
    await executor.playCardFromHandNTimes(repeatCard, 2);

    expect(repeatSpy).toHaveBeenCalledTimes(2);
    expect(ownedCards.getInPlay().contains(repeatCard)).toBe(true);
  });

  it('moves cards through piles, discard, trash, and special mats', async () => {
    const { executor, ownedCards, player, logger, sharedTrash, pileCards } = createHarness();
    const deckCard = createCard('Copper', 'deck-0', CardType.TREASURE);
    const otherDeckCard = createCard('Silver', 'deck-1', CardType.TREASURE);
    const pileCard = createCard('Gold', 'pile-0', CardType.TREASURE);
    const gainCard = createCard('Duchy', 'gain-0', CardType.VICTORY);
    const trashCard = createCard('Estate', 'trash-0', CardType.VICTORY);
    const islandCard = createCard('Village', 'island-0');
    const nativeVillageCard = createCard('Market', 'native-0');
    const handDiscardCard = createCard('Remodel', 'discard-0');
    const discardFromLocationCard = createCard('Cellar', 'discard-location-0');

    ownedCards.addCardToDeck(nativeVillageCard);
    ownedCards.addCardToDeck(deckCard);
    ownedCards.addCardToDeck(otherDeckCard);
    pileCards.set('gold-pile', [pileCard]);
    sharedTrash.addCard(trashCard);
    trashCard.setLocation(CardLocation.TRASH);
    ownedCards.addCardToHand(islandCard);
    ownedCards.addCardToHand(handDiscardCard);
    ownedCards.addCardToHand(discardFromLocationCard);
    ownedCards.addCardToDiscard(gainCard);

    expect(await executor.putTopCardOfDeckIntoHand()).toBe(otherDeckCard);
    expect(ownedCards.getHand().contains(otherDeckCard)).toBe(true);

    expect(await executor.takeCardOffDeck()).toBe(deckCard);

    expect(await executor.buyFromPile('gold-pile')).toBe(pileCard);
    expect(player.getStatistics().spendCoins).toHaveBeenCalledWith(0);
    expect(player.getStatistics().useBuy).toHaveBeenCalled();

    pileCards.set('gain-pile', [gainCard]);
    expect(await executor.gainFromPile('gain-pile')).toBe(gainCard);
    expect(ownedCards.getDiscard().contains(gainCard)).toBe(true);

    expect(await executor.gainCardFromTrash(trashCard)).toBe(trashCard);
    expect(ownedCards.getDiscard().contains(trashCard)).toBe(true);

    expect(await executor.topDeckCardFromLocation(islandCard, CardLocation.HAND)).toBe(islandCard);
    expect(ownedCards.getDeck().contains(islandCard)).toBe(true);

    executor.putCardIntoDeck(nativeVillageCard, 0);
    expect(ownedCards.getDeck().contains(nativeVillageCard)).toBe(true);

    executor.putCardIntoHandFromLocation(nativeVillageCard, CardLocation.DECK);
    expect(ownedCards.getHand().contains(nativeVillageCard)).toBe(true);

    const topCard = createCard('Estate', 'top-0', CardType.VICTORY);
    ownedCards.addCardToDeck(topCard);
    expect(await executor.lookAtTopCardOfDeck()).toBe(topCard);
    expect((await executor.takeCardsOffDeck(1)).size()).toBe(1);

    await executor.discardCard(handDiscardCard);
    expect(ownedCards.getDiscard().contains(handDiscardCard)).toBe(true);

    const discardFromLocation = await executor.discardCardFromLocation(discardFromLocationCard, CardLocation.HAND);
    expect(discardFromLocation).toBe(discardFromLocationCard);

    const discardSetCard = createCard('Workshop', 'discard-set-0');
    ownedCards.addCardToHand(discardSetCard);
    const discardSet = CardCollection.fromCards([discardSetCard]);
    await executor.discardCards(discardSet, CardLocation.HAND);
    await executor.discardCardsFromLocation(discardSet, CardLocation.DISCARD);
    await executor.discardCardsFromRevealedSet(discardSet, discardSet);
    await executor.discardHand();
    await executor.discardAllFromInPlay();
    await executor.discardDownTo(0);

    await executor.trashCardFromLocation(deckCard, CardLocation.DISCARD);
    await executor.trashCardsFromLocation(CardCollection.fromCards([pileCard]), CardLocation.DECK);
    await executor.trashCardFromSet(pileCard, CardCollection.fromCards([pileCard]));
    await executor.trashCardsFromSet(CardCollection.fromCards([pileCard]), CardCollection.fromCards([pileCard]));
    await executor.trashCard(pileCard);
    await executor.trashCards(CardCollection.fromCards([pileCard]));
    await executor.trashTopCardOfDeck();

    await executor.setCardAsideFromLocation(deckCard, CardLocation.DISCARD);
    executor.setCardAside(deckCard);
    executor.putCardOnIslandMatFromHand(islandCard);
    await executor.putTopCardOfDeckOnNativeVillageMat();
    executor.putCardsFromNativeVillageMatIntoHand();
    await executor.revealCards(CardCollection.fromCards([deckCard]));
    await executor.revealCard(deckCard);
    await executor.revealHand();

    expect(logger.gameMessage).toHaveBeenCalled();
  });

  it('routes effects, attacks, turns, and effect processing', async () => {
    const { executor, effects, sharedGameState } = createHarness();
    const attackCard = createCard('Militia', 'attack-0', CardType.ATTACK);
    const extraTurnCard = createCard('Outpost', 'extra-0');
    const effectAction = vi.fn(async () => undefined);
    const matchingEffect = createEffect({
      id: 'effect-0',
      ownerName: 'Village Green',
      mandatory: true,
      trigger: EffectTriggerType.GAIN,
      cardEligibility: new CardEligibilityFunction(() => true),
      doAction: effectAction,
    });
    effects.getEffectsByType.mockReturnValue([matchingEffect]);

    executor.addEffect(matchingEffect);
    executor.addExtraTurn(extraTurnCard, []);
    await executor.announceAttackCard(attackCard);
    executor.blockAttack(attackCard);
    await executor.performAttack(
      attackCard,
      vi.fn(async () => undefined),
    );
    await executor.eachPlayer(vi.fn(async () => undefined));
    await executor.eachOtherPlayer(vi.fn(async () => undefined));
    await executor.eachPlayerPassesACardToTheLeft();
    await executor.processEffectsByType(EffectTriggerType.GAIN, attackCard);

    expect(effects.addEffect).toHaveBeenCalledWith(matchingEffect);
    expect(effects.addExtraTurn).toHaveBeenCalled();
    expect(effects.blockAttack).toHaveBeenCalledWith(attackCard);
    expect(sharedGameState.clearBlocksForAttackCard).toHaveBeenCalledWith(attackCard);
    expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(EffectTriggerType.ATTACK, expect.any(CardCollection));
    expect(sharedGameState.performAttack).toHaveBeenCalledWith(expect.anything(), attackCard, expect.any(Function));
    expect(sharedGameState.executeForEachPlayer).toHaveBeenCalled();
    expect(sharedGameState.executeForEachOtherPlayer).toHaveBeenCalled();
    expect(sharedGameState.eachPlayerPassesACardToTheLeft).toHaveBeenCalled();
    expect(effectAction).toHaveBeenCalledWith(executor, attackCard);
  });

  it('builds eligible choice lists and deck-depth prompts', async () => {
    const { executor, player, ownedCards, sharedGameState, piles, topCardsOfSupplyPiles } = createHarness();
    const supplyMatch = createCard('Village', 'supply-0');
    const supplyDuplicate = createCard('Village', 'supply-1');
    const discardCard = createCard('Smithy', 'discard-0');
    const handCard = createCard('Copper', 'hand-0', CardType.TREASURE);
    const multiA = createCard('Estate', 'multi-0', CardType.VICTORY);
    const multiB = createCard('Estate', 'multi-1', CardType.VICTORY);
    const fakeBuilder = {
      from: vi.fn().mockReturnThis(),
      choose: vi.fn(async () => ({ getName: () => '2' })),
    };

    topCardsOfSupplyPiles.addCard(supplyMatch);
    topCardsOfSupplyPiles.addCard(supplyDuplicate);
    ownedCards.addCardToHand(handCard);
    ownedCards.addCardToHand(multiA);
    ownedCards.addCardToHand(multiB);
    sharedGameState.getCardsFromArea.mockImplementation((location: CardLocation) => {
      if (location === CardLocation.DISCARD) {
        const collection = new CardCollection();
        collection.addCard(discardCard);
        return collection;
      }
      return new CardCollection();
    });

    piles.getTopCardsOfSupplyPiles.mockReturnValue(topCardsOfSupplyPiles);
    vi.spyOn(executor, 'chooseOneOption').mockReturnValue(fakeBuilder as never);

    const supplyChoices = executor.getEligibleSupplyChoices(
      new CardEligibilityFunction((card) => card.getName() === 'Village'),
    );
    const areaChoices = executor.getEligibleCardChoices(
      new Set([CardLocation.DISCARD, CardLocation.HAND]),
      new CardEligibilityFunction((card) => card.getName() !== 'none'),
    );
    const multiChoices = executor.getEligibleCardMultiChoices(
      new Set([CardLocation.HAND]),
      new CardEligibilityFunction((card) => card.getName() === 'Estate'),
    );

    expect(supplyChoices).toHaveLength(1);
    expect(supplyChoices[0].card.id).toBe('supply-0');
    expect(areaChoices).toHaveLength(4);
    expect(multiChoices).toHaveLength(1);
    expect(multiChoices[0].cards).toHaveLength(2);
    expect(await executor.chooseDeckDepth()).toBe(2);
    expect(player.getStatistics().setNumCardsToDrawInCleanup).not.toHaveBeenCalled();
  });
});
