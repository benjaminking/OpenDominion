import {
  CardCategory,
  CardInfo,
  CardLocation,
  CardType,
  ChoiceType,
  Expansion,
  NamedChoice,
  NumberType,
} from '@dominion/common';
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
  RestOfTurnEffectExpiration,
  StartOfPlayersNextTurnEffectExpiration,
} from '../../src/effects/StandardEffectExpirations';
import { NextTurnEligibility, ThisTurnEligibility } from '../../src/effects/StandardTurnEligibilityFunctions';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { Pile } from '../../src/piles/Pile';
import { Piles } from '../../src/piles/Piles';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';
import { Player } from '../../src/players/Player';
import { PlayerCards } from '../../src/players/PlayerCards';
import { Statistics } from '../../src/players/Statistics';
import { TurnTracker } from '../../src/players/TurnTracker';
import {
  anyCard,
  cardNameIs,
  isActionCard,
  isCurseCard,
  isTheSameCardAs,
  isTreasureCard,
  isVictoryCard,
  noCard,
} from '../../src/StandardCardEligibilityFunctions';
import { Turn } from '../../src/turns/Turn';
import { TurnPhase } from '../../src/turns/TurnPhase';

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

class LeaveInPlaceOptions extends CardPlayOptions {
  public constructor() {
    super(false, true, true);
  }
}

const createCard = (
  name: string,
  id: string,
  type: CardType = CardType.ACTION,
  options: { cost?: Cost; pileNameOverride?: string } = {},
): TestCard => {
  const cost = options.cost ?? Cost.Simple(0);
  const sharedGameState = {
    cost: vi.fn(() => cost),
    registerEffectTrigger: vi.fn(),
  };

  const cardInfo: CardInfo = {
    category: CardCategory.CARD,
    name,
    text: `${name} text`,
    font_size: 'small',
    cost: cost.toCommonCost(),
    types: [type],
    expansion: Expansion.TESTING,
    mechanics: [],
    pileNameOverride: options.pileNameOverride,
  };

  const card = new TestCard(sharedGameState as unknown as SharedGameState, cardInfo);
  card.setId(id);
  return card;
};

// Real pile; the last card in the array is the top card of the pile.
const createPile = (name: string, cardsBottomToTop: Card[]): Pile => {
  for (const card of cardsBottomToTop) {
    card.setLocation(CardLocation.PILE);
  }
  const broadcaster = {
    sendPileMetadata: vi.fn(),
    updateSharedCards: vi.fn(),
  } as unknown as GameMessageBroadcaster;
  return new Pile(name, CardCollection.fromCards(cardsBottomToTop), new Set(), new Set(), broadcaster);
};

const createPiles = (...pileList: Pile[]): Piles => {
  const piles = new Piles();
  for (const pile of pileList) {
    piles.addKingdomPile(pile);
  }
  return piles;
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

const createHarness = (options: { piles?: Piles } = {}) => {
  const logger = {
    gameMessage: vi.fn(),
  };
  const broadcaster = {
    updatePlayerCards: vi.fn(),
    updateStatistic: vi.fn(),
    sendStatus: vi.fn(),
  };
  const decisionService = {
    chooseExtraTurns: vi.fn(async () => ({ type: ChoiceType.ExtraTurn })),
    chooseOneOption: vi.fn(
      async (_prompt: string, _decisionName: string, _choices: NamedChoice[]): Promise<NamedChoice> => ({
        type: ChoiceType.ChooseOne,
        name: '0',
      }),
    ),
    chooseCard: vi.fn(async (..._args: unknown[]): Promise<unknown> => ({ type: ChoiceType.None })),
    chooseFromMultipleEvents: vi.fn(async (..._args: unknown[]): Promise<unknown> => ({ type: ChoiceType.None })),
  };
  const statistics = {
    addActions: vi.fn(),
    addBuys: vi.fn(),
    addCoins: vi.fn(async () => undefined),
    addVP: vi.fn(),
    getUnofficialTurnNumber: vi.fn(() => 0),
    spendCoins: vi.fn(),
    spendPotions: vi.fn(),
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
  const sharedAreas = new Map<CardLocation, CardCollection>([[CardLocation.TRASH, sharedTrash]]);
  // Mock pile arrays are ordered top-first: index 0 is the top card.
  const pileCards = new Map<string, Card[]>();
  const topCardsOfSupplyPiles = new CardCollection();

  const piles = {
    getTopCardOfPile: vi.fn((pileName: string) => pileCards.get(pileName)?.[0]),
    isPileEmpty: vi.fn((pileName: string) => (pileCards.get(pileName)?.length ?? 0) === 0),
    removeTopCardFromPile: vi.fn((pileName: string) => pileCards.get(pileName)?.shift()),
    getTopCardsOfSupplyPiles: vi.fn(() => topCardsOfSupplyPiles),
    isPile: vi.fn((pileName: string) => pileCards.has(pileName)),
    isCardInPile: vi.fn((card: Card, pileName: string) => pileCards.get(pileName)?.includes(card) ?? false),
  };
  const currentPiles: Piles | typeof piles = options.piles ?? piles;

  // Mirrors SharedGameState's reference-counted card movement blocking.
  const numBlocksById = new Map<string, number>();

  const sharedGameState = {
    piles: currentPiles,
    trash: sharedTrash,
    triggerEffect: vi.fn(
      async (_trigger: EffectTriggerType, _player: unknown, _cards?: Card | CardCollection): Promise<void> => undefined,
    ),
    registerEffectTrigger: vi.fn(),
    // Matches SharedGameState: only the piles and the trash are shared locations.
    isSharedLocation: vi.fn(
      (location: CardLocation) => location === CardLocation.PILE || location === CardLocation.TRASH,
    ),
    getCardByMetadata: vi.fn((metadata: { id: string }) => sharedCardsById.get(metadata.id)),
    getCardsFromArea: vi.fn((location: CardLocation) => sharedAreas.get(location) ?? new CardCollection()),
    getPreviousTurns: vi.fn(() => []),
    getCurrentTurn: vi.fn(() => ({}) as never),
    getTurnPhase: vi.fn(() => TurnPhase.ACTION),
    getAllExtraCards: vi.fn(() => sharedExtraCards),
    getCurrentPlayer: vi.fn(() => player),
    getPlayerLeftOfCurrent: vi.fn((): Player => player),
    isTurnEligibilitySatisfied: vi.fn(() => true),
    blockCardFromMoving: vi.fn((card: Card) => {
      numBlocksById.set(card.getId(), (numBlocksById.get(card.getId()) ?? 0) + 1);
    }),
    releaseCardToMoveAgain: vi.fn((card: Card) => {
      numBlocksById.set(card.getId(), (numBlocksById.get(card.getId()) ?? 0) - 1);
    }),
    isCardAbleToMove: vi.fn((card: Card) => (numBlocksById.get(card.getId()) ?? 0) <= 0),
    isCopyOfCardOnTopOfPile: vi.fn((card: Card | string, pileName: string): boolean => {
      const topCard = currentPiles.getTopCardOfPile(pileName);
      if (topCard === undefined) {
        return false;
      }
      return typeof card === 'string' ? topCard.getName() === card : topCard.getName() === card.getName();
    }),
    isCardInPile: vi.fn((card: Card, pileName: string): boolean => currentPiles.isCardInPile(card, pileName)),
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
      for (const card of cards) {
        card.setLocation(CardLocation.TRASH);
      }
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

  const turnTracker = new TurnTracker(new Turn(player, 0, 0));
  player.getTurnTracker = () => turnTracker;

  const executor = new InstructionExecutor(sharedGameState as unknown as SharedGameState, player);
  // Required by the CardChoiceBuilder / ChooseOneOptionBuilder constructors.
  player.getInstructionExecutor = () => executor;

  // Swaps the statistics mock for a real Statistics instance.
  const useRealStatistics = (): Statistics => {
    const realStatistics = new Statistics(player);
    realStatistics.reset();
    player.getStatistics = () => realStatistics;
    return realStatistics;
  };

  const chooseOption = (name: string): string[] => {
    const offeredNames: string[] = [];
    decisionService.chooseOneOption.mockImplementationOnce(async (_prompt, _decisionName, choices) => {
      offeredNames.push(...choices.map((choice) => choice.name));
      return { type: ChoiceType.ChooseOne, name };
    });
    return offeredNames;
  };

  return {
    executor,
    player,
    ownedCards,
    statistics,
    turnTracker,
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
    useRealStatistics,
    chooseOption,
  };
};

const loggedTemplates = (logger: { gameMessage: ReturnType<typeof vi.fn> }): string[] =>
  logger.gameMessage.mock.calls.map((call) => JSON.stringify(call[1]));

describe('InstructionExecutor', () => {
  it('forwards stats, lookup, and eligibility helpers', () => {
    const { executor, player, ownedCards, statistics, turnTracker, sharedGameState, sharedExtraCards } =
      createHarness();
    const forceDiscardBroadcastSpy = vi
      .spyOn(ownedCards, 'forceFullBroadcastOfDiscard')
      .mockImplementation(() => undefined);
    const handCard = createCard('Village', 'hand-0');
    const playedCard = createCard('Smithy', 'played-0');
    const gainedCard = createCard('Copper', 'gained-0', CardType.TREASURE);
    const sharedCard = createCard('Province', 'shared-0', CardType.VICTORY);
    sharedCard.setLocation(CardLocation.TRASH);
    const matchingEligibility = new CardEligibilityFunction((card) => card.hasType(CardType.ACTION));

    ownedCards.addCardToHand(handCard);
    turnTracker.addPlayedCard(playedCard);
    turnTracker.addGainedCard(gainedCard);
    sharedExtraCards.addCard(sharedCard);
    sharedGameState.getCardByMetadata.mockReturnValue(sharedCard);

    executor.addActions(2);
    executor.addBuys(3);
    executor.addVP(4);

    expect(executor.getSharedGameState()).toBe(sharedGameState);
    expect(executor.handSize()).toBe(1);
    expect(executor.hasMatchingCardInHand(matchingEligibility)).toBe(true);
    expect(executor.hasMatchingCardInPlay(matchingEligibility)).toBe(false);

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
    expect(executor.createRestOfTurnEffectExpiration()).toBeInstanceOf(RestOfTurnEffectExpiration);
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
    expect(turnTracker.getNumCardsToDrawInCleanup(5)).toBe(2);
    expect(forceDiscardBroadcastSpy).toHaveBeenCalledTimes(1);
  });

  it('plays cards from hand and simple treasures through the owned card zones', async () => {
    const { executor, ownedCards, statistics, sharedGameState, logger, player } = createHarness();
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
    expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(
      EffectTriggerType.ABOUT_TO_PLAY_CARD,
      player,
      expect.any(CardCollection),
    );
    expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(
      EffectTriggerType.PLAYED_CARD,
      player,
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
    expect(player.getStatistics().spendPotions).toHaveBeenCalledWith(0);
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
    const { executor, effects, sharedGameState, player } = createHarness();
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
    expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(
      EffectTriggerType.ATTACK,
      player,
      expect.any(CardCollection),
    );
    expect(sharedGameState.performAttack).toHaveBeenCalledWith(expect.anything(), attackCard, expect.any(Function));
    expect(sharedGameState.executeForEachPlayer).toHaveBeenCalled();
    expect(sharedGameState.executeForEachOtherPlayer).toHaveBeenCalled();
    expect(sharedGameState.eachPlayerPassesACardToTheLeft).toHaveBeenCalled();
    expect(effectAction).toHaveBeenCalledWith(executor, attackCard);
  });

  it('builds eligible choice lists and deck-depth prompts', async () => {
    const { executor, statistics, ownedCards, sharedGameState, piles, topCardsOfSupplyPiles } = createHarness();
    const supplyMatch = createCard('Village', 'supply-0');
    const supplyDuplicate = createCard('Village', 'supply-1');
    const trashedCard = createCard('Smithy', 'trash-0');
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
      if (location === CardLocation.TRASH) {
        const collection = new CardCollection();
        collection.addCard(trashedCard);
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
      new Set([CardLocation.TRASH, CardLocation.HAND]),
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
    expect(statistics.setNumCardsToDrawInCleanup).not.toHaveBeenCalled();
  });

  describe('card movement blocking', () => {
    it('leaves a blocked card where it is for every single-card move', async () => {
      const { executor, ownedCards, sharedGameState, sharedTrash } = createHarness();
      const handCard = createCard('Village', 'blocked-hand');
      const setAsideCard = createCard('Smithy', 'blocked-set-aside');
      ownedCards.addCardToHand(handCard);
      ownedCards.addCardToSetAside(setAsideCard);
      sharedGameState.blockCardFromMoving(handCard);
      sharedGameState.blockCardFromMoving(setAsideCard);

      expect(await executor.topDeckCardFromLocation(handCard, CardLocation.HAND)).toBeUndefined();
      executor.putCardOnDeck(handCard);
      executor.putCardIntoDeck(handCard, 0);
      expect(await executor.trashCardFromLocation(handCard, CardLocation.HAND)).toBeUndefined();
      expect(await executor.setCardAsideFromLocation(handCard, CardLocation.HAND)).toBeUndefined();
      expect(executor.returnCardToPileFromLocation(handCard, CardLocation.HAND)).toBeUndefined();
      executor.putCardIntoHandFromLocation(setAsideCard, CardLocation.SET_ASIDE);

      expect(ownedCards.getHand().asCardArray()).toEqual([handCard]);
      expect(ownedCards.getCardsFromArea(CardLocation.SET_ASIDE).asCardArray()).toEqual([setAsideCard]);
      expect(ownedCards.getDeck().size()).toBe(0);
      expect(sharedTrash.size()).toBe(0);
      expect(sharedGameState.trashCards).not.toHaveBeenCalled();
      expect(handCard.getLocation()).toBe(CardLocation.HAND);
      expect(setAsideCard.getLocation()).toBe(CardLocation.SET_ASIDE);
    });

    it('moves a card again once its block has been released', async () => {
      const { executor, ownedCards, sharedGameState } = createHarness();
      const card = createCard('Village', 'released-0');
      ownedCards.addCardToHand(card);

      sharedGameState.blockCardFromMoving(card);
      expect(await executor.topDeckCardFromLocation(card, CardLocation.HAND)).toBeUndefined();

      sharedGameState.releaseCardToMoveAgain(card);
      expect(await executor.topDeckCardFromLocation(card, CardLocation.HAND)).toBe(card);
      expect(ownedCards.getHand().contains(card)).toBe(false);
      expect(ownedCards.getDeck().contains(card)).toBe(true);
    });

    it('blocks a card played with leave-in-place options for the duration of its play', async () => {
      const { executor, ownedCards, sharedGameState, statistics, sharedTrash } = createHarness();
      const card = createCard('Pillage', 'pillage-0');
      ownedCards.addCardToHand(card);
      let trashedDuringPlay: Card | undefined;
      vi.spyOn(card, 'play').mockImplementation(async (ie: InstructionExecutor) => {
        trashedDuringPlay = await ie.trashCardFromLocation(card, CardLocation.IN_PLAY);
      });

      await executor.playCardFromHand(card, new LeaveInPlaceOptions());

      expect(trashedDuringPlay).toBeUndefined();
      expect(sharedTrash.contains(card)).toBe(false);
      expect(ownedCards.getInPlay().contains(card)).toBe(true);
      expect(statistics.useAction).not.toHaveBeenCalled();
      expect(sharedGameState.blockCardFromMoving).toHaveBeenCalledWith(card);
      expect(sharedGameState.releaseCardToMoveAgain).toHaveBeenCalledWith(card);
      expect(sharedGameState.isCardAbleToMove(card)).toBe(true);
    });
  });

  describe('playing cards from other locations', () => {
    it('plays a card from another location, registering it as played and firing play triggers', async () => {
      const { executor, ownedCards, sharedGameState, turnTracker, player } = createHarness();
      const card = createCard('Village', 'vassal-target');
      ownedCards.addCardToDiscard(card);
      const playSpy = vi.spyOn(card, 'play');

      await executor.playCardFromLocation(card, CardLocation.DISCARD);

      expect(ownedCards.getDiscard().contains(card)).toBe(false);
      expect(playSpy).toHaveBeenCalledWith(executor);
      expect(turnTracker.numMatchingCardsPlayedThisTurn(isTheSameCardAs(card))).toBe(1);
      expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(
        EffectTriggerType.ABOUT_TO_PLAY_CARD,
        player,
        CardCollection.fromCards([card]),
      );
      expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(
        EffectTriggerType.PLAYED_CARD,
        player,
        CardCollection.fromCards([card]),
      );
    });

    // BUG: playCardFromLocation removes the card from its zone but never adds it to play, so the card vanishes
    it('puts a card played from another location into play', async () => {
      const { executor, ownedCards } = createHarness();
      const card = createCard('Village', 'vassal-target');
      ownedCards.addCardToDiscard(card);

      await executor.playCardFromLocation(card, CardLocation.DISCARD);

      expect(ownedCards.getInPlay().contains(card)).toBe(true);
      expect(card.getLocation()).toBe(CardLocation.IN_PLAY);
    });

    it('plays several revealed cards in the order the player chooses', async () => {
      const { executor, ownedCards, decisionService } = createHarness();
      const village = createCard('Village', 'village-0');
      const smithy = createCard('Smithy', 'smithy-0');
      ownedCards.addCardToDeck(village);
      ownedCards.addCardToDeck(smithy);
      const revealed = await executor.takeCardsOffDeck(2);
      const playOrder: string[] = [];
      vi.spyOn(village, 'play').mockImplementation(async () => {
        playOrder.push('Village');
      });
      vi.spyOn(smithy, 'play').mockImplementation(async () => {
        playOrder.push('Smithy');
      });
      decisionService.chooseCard.mockImplementationOnce(async () => ({
        type: ChoiceType.Card,
        card: village.getMetadata(),
      }));

      await executor.playMultipleCardsFromLocation(revealed, CardLocation.REVEAL_LIMBO);

      expect(playOrder).toEqual(['Village', 'Smithy']);
      expect(revealed.size()).toBe(0);
      expect(decisionService.chooseCard).toHaveBeenCalledTimes(1);
    });

    it('plays a supply card without using an action and leaves it on its pile', async () => {
      const pileCard = createCard('Village', 'village-pile-0');
      const pile = createPile('Village', [pileCard]);
      const { executor, statistics, turnTracker, sharedGameState, player } = createHarness({
        piles: createPiles(pile),
      });
      const playSpy = vi.spyOn(pileCard, 'play');

      await executor.playCardFromSupplyLeavingItThere(pileCard);

      expect(playSpy).toHaveBeenCalledWith(executor);
      expect(statistics.useAction).not.toHaveBeenCalled();
      expect(pile.getTopCard()).toBe(pileCard);
      expect(pile.size()).toBe(1);
      expect(pileCard.getLocation()).toBe(CardLocation.PILE);
      expect(turnTracker.numMatchingCardsPlayedThisTurn(isTheSameCardAs(pileCard))).toBe(1);
      expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(
        EffectTriggerType.PLAYED_CARD,
        player,
        CardCollection.fromCards([pileCard]),
      );
    });

    // BUG: CardPlayOptions.Builder.build() drops leaveInPlace, so LEAVING_IT_THERE never blocks the card from moving
    it('keeps a supply card from moving itself while it is played leaving it there', async () => {
      const pileCard = createCard('Pillage', 'pillage-pile-0');
      const pile = createPile('Pillage', [pileCard]);
      const { executor, sharedTrash } = createHarness({ piles: createPiles(pile) });
      let trashedDuringPlay: Card | undefined;
      vi.spyOn(pileCard, 'play').mockImplementation(async (ie: InstructionExecutor) => {
        trashedDuringPlay = await ie.trashCardFromLocation(pileCard, CardLocation.PILE);
      });

      await executor.playCardFromSupplyLeavingItThere(pileCard);

      expect(trashedDuringPlay).toBeUndefined();
      expect(sharedTrash.contains(pileCard)).toBe(false);
      expect(pile.getTopCard()).toBe(pileCard);
    });
  });

  describe('exchanging and returning cards', () => {
    const createExchangeHarness = () => {
      const hermitPile = createPile('Hermit', [createCard('Hermit', 'hermit-pile-0')]);
      const madmanTop = createCard('Madman', 'madman-pile-0');
      const madmanPile = createPile('Madman', [madmanTop]);
      const harness = createHarness({ piles: createPiles(hermitPile, madmanPile) });
      const hermit = createCard('Hermit', 'hermit-1');
      harness.ownedCards.addCardToInPlay(hermit);
      return { ...harness, hermitPile, madmanPile, madmanTop, hermit };
    };

    it('returns the card to its pile and puts the top card of the other pile into the discard pile', () => {
      const { executor, ownedCards, hermitPile, madmanPile, madmanTop, hermit, sharedGameState, turnTracker, logger } =
        createExchangeHarness();

      executor.exchangeCardFromLocation(hermit, CardLocation.IN_PLAY, 'Madman');

      expect(ownedCards.getInPlay().contains(hermit)).toBe(false);
      expect(hermitPile.getTopCard()).toBe(hermit);
      expect(hermitPile.size()).toBe(2);
      expect(madmanPile.size()).toBe(0);
      expect(ownedCards.getDiscard().asCardArray()).toEqual([madmanTop]);
      expect(madmanTop.getLocation()).toBe(CardLocation.DISCARD);
      // exchanging is not gaining
      expect(sharedGameState.triggerEffect).not.toHaveBeenCalled();
      expect(turnTracker.hasGainedMatchingCardThisTurn(anyCard)).toBe(false);
      expect(loggedTemplates(logger).some((message) => message.includes('exchanges'))).toBe(true);
    });

    it('does nothing when the card being returned has no pile', () => {
      const madmanPile = createPile('Madman', [createCard('Madman', 'madman-pile-0')]);
      const { executor, ownedCards } = createHarness({ piles: createPiles(madmanPile) });
      const hermit = createCard('Hermit', 'hermit-1');
      ownedCards.addCardToInPlay(hermit);

      executor.exchangeCardFromLocation(hermit, CardLocation.IN_PLAY, 'Madman');

      expect(ownedCards.getInPlay().contains(hermit)).toBe(true);
      expect(madmanPile.size()).toBe(1);
      expect(ownedCards.getDiscard().size()).toBe(0);
    });

    it('does nothing when the pile to take from is empty', () => {
      const hermitPile = createPile('Hermit', []);
      const madmanPile = createPile('Madman', []);
      const { executor, ownedCards } = createHarness({ piles: createPiles(hermitPile, madmanPile) });
      const hermit = createCard('Hermit', 'hermit-1');
      ownedCards.addCardToInPlay(hermit);

      executor.exchangeCardFromLocation(hermit, CardLocation.IN_PLAY, 'Madman');

      expect(ownedCards.getInPlay().contains(hermit)).toBe(true);
      expect(hermitPile.size()).toBe(0);
      expect(ownedCards.getDiscard().size()).toBe(0);
    });

    // BUG: the other pile's top card is removed before the movement check, so it vanishes when the returned card is blocked
    it('takes nothing from the other pile when the card being returned is blocked from moving', () => {
      const { executor, ownedCards, madmanPile, madmanTop, hermit, sharedGameState } = createExchangeHarness();
      sharedGameState.blockCardFromMoving(hermit);

      executor.exchangeCardFromLocation(hermit, CardLocation.IN_PLAY, 'Madman');

      expect(ownedCards.getInPlay().contains(hermit)).toBe(true);
      expect(madmanPile.getTopCard()).toBe(madmanTop);
      expect(madmanPile.size()).toBe(1);
    });

    it('moves a card from its location back onto its pile', () => {
      const spoilsPile = createPile('Spoils', [createCard('Spoils', 'spoils-pile-0', CardType.TREASURE)]);
      const { executor, ownedCards } = createHarness({ piles: createPiles(spoilsPile) });
      const spoils = createCard('Spoils', 'spoils-1', CardType.TREASURE);
      ownedCards.addCardToInPlay(spoils);

      expect(executor.returnCardToPileFromLocation(spoils, CardLocation.IN_PLAY)).toBe(spoils);

      expect(ownedCards.getInPlay().contains(spoils)).toBe(false);
      expect(spoilsPile.getTopCard()).toBe(spoils);
      expect(spoilsPile.size()).toBe(2);
    });

    it('leaves a card without a pile where it is', () => {
      const { executor, ownedCards } = createHarness({ piles: createPiles() });
      const card = createCard('Spoils', 'spoils-1', CardType.TREASURE);
      ownedCards.addCardToInPlay(card);

      executor.returnCardToPileFromLocation(card, CardLocation.IN_PLAY);

      expect(ownedCards.getInPlay().contains(card)).toBe(true);
      expect(card.getLocation()).toBe(CardLocation.IN_PLAY);
    });

    // BUG: returning a card to its pile never resets its location, so the pile's top card still reports IN_PLAY
    it('marks a returned card as being in its pile', () => {
      const spoilsPile = createPile('Spoils', []);
      const { executor, ownedCards } = createHarness({ piles: createPiles(spoilsPile) });
      const spoils = createCard('Spoils', 'spoils-1', CardType.TREASURE);
      ownedCards.addCardToInPlay(spoils);

      executor.returnCardToPileFromLocation(spoils, CardLocation.IN_PLAY);

      expect(spoils.getLocation()).toBe(CardLocation.PILE);
      expect(spoilsPile.getTopCard()?.getMetadata().location).toBe(CardLocation.PILE);
    });
  });

  describe('gaining cards', () => {
    it('gains the top card of a pile by pile name or by a copy of the top card', async () => {
      const bottomSilver = createCard('Silver', 'silver-pile-0', CardType.TREASURE);
      const topSilver = createCard('Silver', 'silver-pile-1', CardType.TREASURE);
      const pile = createPile('Silver', [bottomSilver, topSilver]);
      const { executor, ownedCards, sharedGameState, turnTracker, player } = createHarness({
        piles: createPiles(pile),
      });

      expect(await executor.gainCardFromPile('Silver')).toBe(topSilver);
      expect(await executor.gainCardFromPile(createCard('Silver', 'silver-elsewhere', CardType.TREASURE))).toBe(
        bottomSilver,
      );

      expect(pile.size()).toBe(0);
      expect(ownedCards.getDiscard().asCardArray()).toEqual([topSilver, bottomSilver]);
      expect(topSilver.getLocation()).toBe(CardLocation.DISCARD);
      expect(turnTracker.numMatchingCardsGainedThisTurn(cardNameIs('Silver'))).toBe(2);
      expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(EffectTriggerType.GAIN, player, topSilver);
      expect(player.calculateScore).toHaveBeenCalledTimes(2);
    });

    it('gains to hand or onto the deck when requested', async () => {
      const pile = createPile('Gold', [
        createCard('Gold', 'gold-pile-0', CardType.TREASURE),
        createCard('Gold', 'gold-pile-1', CardType.TREASURE),
      ]);
      const { executor, ownedCards } = createHarness({ piles: createPiles(pile) });

      const toHand = await executor.gainCardFromPile('Gold', CardLocation.HAND);
      const toDeck = await executor.gainCardFromPile('Gold', CardLocation.DECK);

      expect(ownedCards.getHand().asCardArray()).toEqual([toHand]);
      expect(ownedCards.getDeck().getTopCard()).toBe(toDeck);
      expect(toHand?.getLocation()).toBe(CardLocation.HAND);
      expect(toDeck?.getLocation()).toBe(CardLocation.DECK);
    });

    it('only gains a card from below the top of a pile when non-top gains are allowed', async () => {
      const coronet = createCard('Coronet', 'coronet-0', CardType.REWARD, { pileNameOverride: 'Rewards' });
      const courser = createCard('Courser', 'courser-0', CardType.REWARD, { pileNameOverride: 'Rewards' });
      const pile = createPile('Rewards', [coronet, courser]);
      const { executor, ownedCards } = createHarness({ piles: createPiles(pile) });

      expect(await executor.gainCardFromPile(coronet)).toBeUndefined();
      expect(pile.size()).toBe(2);

      expect(await executor.gainCardFromPile(coronet, CardLocation.HAND, true)).toBe(coronet);
      expect(ownedCards.getHand().asCardArray()).toEqual([coronet]);
      expect(pile.asCardArray()).toEqual([courser]);
    });

    it('gains nothing from a missing or empty pile or for a card that is not in the pile', async () => {
      const coronet = createCard('Coronet', 'coronet-0', CardType.REWARD, { pileNameOverride: 'Rewards' });
      const emptyPile = createPile('Gold', []);
      const rewards = createPile('Rewards', [createCard('Courser', 'courser-0', CardType.REWARD)]);
      const { executor, ownedCards, sharedGameState } = createHarness({ piles: createPiles(emptyPile, rewards) });

      expect(await executor.gainCardFromPile('Gold')).toBeUndefined();
      expect(await executor.gainCardFromPile('Platinum')).toBeUndefined();
      expect(await executor.gainCardFromPile(coronet, CardLocation.DISCARD, true)).toBeUndefined();
      expect(await executor.gainFromPile('Gold')).toBeUndefined();

      expect(ownedCards.getDiscard().size()).toBe(0);
      expect(rewards.size()).toBe(1);
      expect(sharedGameState.triggerEffect).not.toHaveBeenCalled();
    });

    it('gains a card repeatedly until its pile runs out', async () => {
      const pile = createPile('Curse', [
        createCard('Curse', 'curse-pile-0', CardType.CURSE),
        createCard('Curse', 'curse-pile-1', CardType.CURSE),
      ]);
      const { executor, ownedCards } = createHarness({ piles: createPiles(pile) });

      await executor.gainCardFromPileNTimes('Curse', 3);

      expect(ownedCards.getDiscard().numMatchingCards(isCurseCard)).toBe(2);
      expect(pile.size()).toBe(0);
    });

    it('gains a card from the trash to the requested location', async () => {
      const { executor, ownedCards, sharedTrash, sharedGameState, turnTracker, player } = createHarness();
      const card = createCard('Gold', 'gold-trash', CardType.TREASURE);
      sharedTrash.addCard(card);
      card.setLocation(CardLocation.TRASH);

      expect(await executor.gainCardFromTrash(card, CardLocation.HAND)).toBe(card);

      expect(sharedTrash.contains(card)).toBe(false);
      expect(ownedCards.getHand().contains(card)).toBe(true);
      expect(card.getLocation()).toBe(CardLocation.HAND);
      expect(turnTracker.hasGainedMatchingCardThisTurn(isTheSameCardAs(card))).toBe(true);
      expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(EffectTriggerType.GAIN, player, card);
    });

    it('does not gain a card that is no longer in the trash', async () => {
      const { executor, ownedCards, sharedTrash, logger } = createHarness();
      const notInTrash = createCard('Gold', 'gold-elsewhere', CardType.TREASURE);
      notInTrash.setLocation(CardLocation.TRASH);
      const movedOut = createCard('Silver', 'silver-moved', CardType.TREASURE);
      sharedTrash.addCard(movedOut);
      movedOut.setLocation(CardLocation.HAND);

      expect(await executor.gainCardFromTrash(notInTrash)).toBeUndefined();
      expect(await executor.gainCardFromTrash(movedOut)).toBeUndefined();

      expect(ownedCards.getDiscard().size()).toBe(0);
      expect(sharedTrash.contains(movedOut)).toBe(true);
      expect(loggedTemplates(logger).filter((message) => message.includes('lost track'))).toHaveLength(2);
    });

    it('lets the player choose any reward in the pile and gains it where requested', async () => {
      const coronet = createCard('Coronet', 'coronet-0', CardType.REWARD, { pileNameOverride: 'Rewards' });
      const secondCoronet = createCard('Coronet', 'coronet-1', CardType.REWARD, { pileNameOverride: 'Rewards' });
      const courser = createCard('Courser', 'courser-0', CardType.REWARD, { pileNameOverride: 'Rewards' });
      const pile = createPile('Rewards', [coronet, secondCoronet, courser]);
      const { executor, ownedCards, decisionService, sharedCardsById } = createHarness({
        piles: createPiles(pile),
      });
      for (const card of [coronet, secondCoronet, courser]) {
        sharedCardsById.set(card.getId(), card);
      }
      let offeredNames: string[] = [];
      decisionService.chooseCard.mockImplementationOnce(async (...args: unknown[]) => {
        offeredNames = (args[3] as { card: { name: string } }[]).map((choice) => choice.card.name);
        return { type: ChoiceType.Card, card: coronet.getMetadata() };
      });

      const gained = await executor.chooseRewardToGain(CardLocation.HAND);

      expect(offeredNames).toEqual(['Coronet', 'Courser']);
      expect(gained).toBe(coronet);
      expect(ownedCards.getHand().asCardArray()).toEqual([coronet]);
      expect(pile.asCardArray()).toEqual([secondCoronet, courser]);
    });

    it('gains no reward when the player does not choose one', async () => {
      const pile = createPile('Rewards', [
        createCard('Coronet', 'coronet-0', CardType.REWARD, { pileNameOverride: 'Rewards' }),
        createCard('Courser', 'courser-0', CardType.REWARD, { pileNameOverride: 'Rewards' }),
      ]);
      const { executor, ownedCards } = createHarness({ piles: createPiles(pile) });

      expect(await executor.chooseRewardToGain()).toBeUndefined();

      expect(pile.size()).toBe(2);
      expect(ownedCards.getDiscard().size()).toBe(0);
    });

    it('buys a card by spending its coins, potions, and a buy before gaining it', async () => {
      const alchemist = createCard('Alchemist', 'alchemist-pile-0', CardType.ACTION, { cost: Cost.Potion(3) });
      const pile = createPile('Alchemist', [alchemist]);
      const { executor, ownedCards, sharedGameState, player, useRealStatistics } = createHarness({
        piles: createPiles(pile),
      });
      const statistics = useRealStatistics();
      await statistics.addCoins(4);
      statistics.addPotions(1);

      expect(await executor.buyFromPile('Alchemist')).toBe(alchemist);

      expect(statistics.getCoins()).toBe(1);
      expect(statistics.getPotions()).toBe(0);
      expect(statistics.getBuys()).toBe(0);
      expect(ownedCards.getDiscard().contains(alchemist)).toBe(true);
      expect(executor.createBoughtCardEligibilityFunction().matches(alchemist)).toBe(true);
      expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(
        EffectTriggerType.BUY,
        player,
        CardCollection.fromCards([alchemist]),
      );
    });
  });

  describe('money, coffers, and overpaying', () => {
    it('adds potions and subtracts coins without going below zero', async () => {
      const { executor, useRealStatistics } = createHarness();
      const statistics = useRealStatistics();
      await executor.addCoins(2);

      executor.addPotions(2);
      executor.subtractCoins(1);
      expect(statistics.getCoins()).toBe(1);

      executor.subtractCoins(5);
      expect(statistics.getCoins()).toBe(0);
      expect(statistics.getPotions()).toBe(2);
    });

    it('spends coffers for coins without spending more coffers than the player has', async () => {
      const { executor, useRealStatistics, broadcaster, player } = createHarness();
      const statistics = useRealStatistics();

      executor.addCoffers(2);
      expect(executor.getCoffers()).toBe(2);

      await executor.spendCoffers(3);

      expect(executor.getCoffers()).toBe(0);
      expect(statistics.getCoins()).toBe(2);
      expect(executor.removeCoffers(1)).toBe(0);
      expect(broadcaster.updateStatistic).toHaveBeenCalledWith(player, NumberType.COFFERS, 0);
    });

    it('offers from zero up to the coffers held and returns the chosen number of coffers', async () => {
      const { executor, useRealStatistics, chooseOption } = createHarness();
      useRealStatistics();
      executor.addCoffers(2);
      const offered = chooseOption('2');

      expect(await executor.chooseCoffers()).toBe(2);

      expect(offered).toEqual(['0', '1', '2']);
      // choosing does not spend the coffers by itself
      expect(executor.getCoffers()).toBe(2);
    });

    it('offers each coin amount up to the coins available and spends the chosen overpay', async () => {
      const { executor, useRealStatistics, chooseOption } = createHarness();
      const statistics = useRealStatistics();
      await statistics.addCoins(3);
      const offered = chooseOption('$2');

      expect(await executor.chooseOverpayAmount()).toEqual({ coins: 2, potions: 0 });

      expect(offered).toEqual(['$0', '$1', '$2', '$3', "Don't overpay"]);
      expect(statistics.getCoins()).toBe(1);
    });

    it('offers potion overpays when the player has a potion and spends both coins and the potion', async () => {
      const { executor, useRealStatistics, chooseOption } = createHarness();
      const statistics = useRealStatistics();
      await statistics.addCoins(1);
      statistics.addPotions(1);
      const offered = chooseOption('$1P');

      expect(await executor.chooseOverpayAmount()).toEqual({ coins: 1, potions: 1 });

      expect(offered).toEqual(['$0', '$0P', '$1', '$1P', "Don't overpay"]);
      expect(statistics.getCoins()).toBe(0);
      expect(statistics.getPotions()).toBe(0);
    });

    it('spends nothing when the player declines to overpay', async () => {
      const { executor, useRealStatistics, chooseOption } = createHarness();
      const statistics = useRealStatistics();
      await statistics.addCoins(2);
      chooseOption("Don't overpay");

      expect(await executor.chooseOverpayAmount()).toBeUndefined();

      expect(statistics.getCoins()).toBe(2);
    });
  });

  describe('revealing, discarding, and trashing', () => {
    it('reveals until enough matching cards are found and discards the cards that did not match', async () => {
      const { executor, ownedCards, sharedGameState, player } = createHarness();
      const smithy = createCard('Smithy', 'smithy-0');
      const village = createCard('Village', 'village-0');
      const copper = createCard('Copper', 'copper-0', CardType.TREASURE);
      const festival = createCard('Festival', 'festival-0');
      const estate = createCard('Estate', 'estate-0', CardType.VICTORY);
      for (const card of [smithy, village, copper, festival, estate]) {
        ownedCards.addCardToDeck(card);
      }

      const found = await executor.revealUntil(isActionCard, 2);

      expect(found.asCardArray()).toEqual([festival, village]);
      expect(ownedCards.getDeck().asCardArray()).toEqual([smithy]);
      expect(ownedCards.getDiscard().asCardArray()).toEqual([estate, copper]);
      expect(village.getLocation()).toBe(CardLocation.REVEAL_LIMBO);
      expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(
        EffectTriggerType.REVEAL,
        player,
        CardCollection.fromCards([estate]),
      );
    });

    it('stops revealing when the deck and discard pile run out', async () => {
      const { executor, ownedCards } = createHarness();
      const copper = createCard('Copper', 'copper-0', CardType.TREASURE);
      ownedCards.addCardToDeck(copper);

      const found = await executor.revealUntil(isActionCard, 2);

      expect(found.size()).toBe(0);
      expect(ownedCards.getDiscard().asCardArray()).toEqual([copper]);
    });

    it('discards chosen cards out of a revealed set and keeps the rest in the set', async () => {
      const { executor, ownedCards } = createHarness();
      const cards = [
        createCard('Copper', 'copper-0', CardType.TREASURE),
        createCard('Estate', 'estate-0', CardType.VICTORY),
        createCard('Village', 'village-0'),
      ];
      for (const card of cards) {
        ownedCards.addCardToDeck(card);
      }
      const revealed = await executor.takeCardsOffDeck(3);
      const toDiscard = revealed.getMatchingCards(isActionCard);

      const discarded = await executor.discardCardsFromRevealedSet(toDiscard, revealed);

      expect(discarded.asCardArray()).toEqual([cards[2]]);
      expect(ownedCards.getDiscard().asCardArray()).toEqual([cards[2]]);
      expect(revealed.contains(cards[2])).toBe(false);
      expect(revealed.size()).toBe(2);
      expect(ownedCards.getCardsFromArea(CardLocation.REVEAL_LIMBO).contains(cards[2])).toBe(false);
    });

    // BUG: with no separate set, `cards ??= discardedCards` makes removeCards empty discardedCards before discarding
    it('discards every revealed card when no separate set is given', async () => {
      const { executor, ownedCards } = createHarness();
      ownedCards.addCardToDeck(createCard('Copper', 'copper-0', CardType.TREASURE));
      ownedCards.addCardToDeck(createCard('Estate', 'estate-0', CardType.VICTORY));
      const revealed = await executor.takeCardsOffDeck(2);

      await executor.discardCardsFromRevealedSet(revealed);

      expect(ownedCards.getDiscard().size()).toBe(2);
      expect(ownedCards.getCardsFromArea(CardLocation.REVEAL_LIMBO).size()).toBe(0);
    });

    it('trashes a card out of a revealed set', async () => {
      const { executor, ownedCards, sharedTrash, sharedGameState, player } = createHarness();
      const copper = createCard('Copper', 'copper-0', CardType.TREASURE);
      const estate = createCard('Estate', 'estate-0', CardType.VICTORY);
      ownedCards.addCardToDeck(copper);
      ownedCards.addCardToDeck(estate);
      const revealed = await executor.takeCardsOffDeck(2);

      expect(await executor.trashCardFromSet(estate, revealed)).toBe(estate);

      expect(revealed.asCardArray()).toEqual([copper]);
      expect(sharedTrash.asCardArray()).toEqual([estate]);
      expect(ownedCards.getCardsFromArea(CardLocation.REVEAL_LIMBO).contains(estate)).toBe(false);
      expect(sharedGameState.trashCards).toHaveBeenCalledWith(player, CardCollection.fromCards([estate]));
    });

    it('trashes several cards out of a revealed set and does nothing for an empty selection', async () => {
      const { executor, ownedCards, sharedTrash, sharedGameState } = createHarness();
      const cards = [
        createCard('Copper', 'copper-0', CardType.TREASURE),
        createCard('Estate', 'estate-0', CardType.VICTORY),
        createCard('Curse', 'curse-0', CardType.CURSE),
      ];
      for (const card of cards) {
        ownedCards.addCardToDeck(card);
      }
      const revealed = await executor.takeCardsOffDeck(3);

      expect((await executor.trashCardsFromSet(new CardCollection(), revealed)).size()).toBe(0);
      expect(sharedGameState.trashCards).not.toHaveBeenCalled();

      const trashed = await executor.trashCardsFromSet(revealed.getMatchingCards(isVictoryCard), revealed);

      expect(trashed.asCardArray()).toEqual([cards[1]]);
      expect(sharedTrash.asCardArray()).toEqual([cards[1]]);
      expect(revealed.size()).toBe(2);
      expect(ownedCards.getCardsFromArea(CardLocation.REVEAL_LIMBO).size()).toBe(2);
    });

    it('discards the top card of the deck', async () => {
      const { executor, ownedCards } = createHarness();
      const bottom = createCard('Copper', 'copper-0', CardType.TREASURE);
      const top = createCard('Estate', 'estate-0', CardType.VICTORY);
      ownedCards.addCardToDeck(bottom);
      ownedCards.addCardToDeck(top);

      expect(await executor.discardTopCardOfDeck()).toBe(top);

      expect(ownedCards.getDiscard().asCardArray()).toEqual([top]);
      expect(ownedCards.getDeck().asCardArray()).toEqual([bottom]);
      expect(ownedCards.getCardsFromArea(CardLocation.REVEAL_LIMBO).size()).toBe(0);
    });

    it('shuffles the deck between the would-shuffle and shuffle triggers', async () => {
      const { executor, ownedCards, sharedGameState, player } = createHarness();
      const shuffleSpy = vi.spyOn(ownedCards, 'shuffleDeck');
      const order: string[] = [];
      sharedGameState.triggerEffect.mockImplementation(async (trigger: EffectTriggerType) => {
        order.push(trigger === EffectTriggerType.WOULD_SHUFFLE ? 'would-shuffle' : 'shuffle');
      });
      shuffleSpy.mockImplementation(() => {
        order.push('deck shuffled');
      });

      await executor.shuffleDeck();

      expect(order).toEqual(['would-shuffle', 'deck shuffled', 'shuffle']);
      expect(sharedGameState.triggerEffect).toHaveBeenCalledWith(EffectTriggerType.SHUFFLE, player);
    });
  });

  describe('setting aside and returning cards to hand', () => {
    it('sets aside a card from the given location', async () => {
      const { executor, ownedCards } = createHarness();
      const card = createCard('Province', 'province-0', CardType.VICTORY);
      ownedCards.addCardToHand(card);

      expect(await executor.setCardAsideFromLocation(card, CardLocation.HAND)).toBe(card);

      expect(ownedCards.getHand().contains(card)).toBe(false);
      expect(ownedCards.getCardsFromArea(CardLocation.SET_ASIDE).contains(card)).toBe(true);
      expect(card.getLocation()).toBe(CardLocation.SET_ASIDE);
    });

    it('does not set aside a card that is no longer at the given location', async () => {
      const { executor, ownedCards, logger } = createHarness();
      const card = createCard('Province', 'province-0', CardType.VICTORY);
      ownedCards.addCardToDiscard(card);

      expect(await executor.setCardAsideFromLocation(card, CardLocation.HAND)).toBeUndefined();

      expect(ownedCards.getDiscard().contains(card)).toBe(true);
      expect(ownedCards.getCardsFromArea(CardLocation.SET_ASIDE).size()).toBe(0);
      expect(loggedTemplates(logger).some((message) => message.includes('lost track'))).toBe(true);
    });

    // BUG: putCardIntoHandFromLocation's location check is inverted, so a card found there is never removed from it
    it('moves a card from the given location into hand', () => {
      const { executor, ownedCards } = createHarness();
      const card = createCard('Gold', 'gold-0', CardType.TREASURE);
      ownedCards.addCardToSetAside(card);

      executor.putCardIntoHandFromLocation(card, CardLocation.SET_ASIDE);

      expect(ownedCards.getHand().asCardArray()).toEqual([card]);
      expect(ownedCards.getCardsFromArea(CardLocation.SET_ASIDE).contains(card)).toBe(false);
    });

    // BUG: same inverted check; a card that has left the location is still put into hand after logging "lost track"
    it('does not put a card into hand when it is no longer at the given location', () => {
      const { executor, ownedCards, logger } = createHarness();
      const card = createCard('Gold', 'gold-0', CardType.TREASURE);
      ownedCards.addCardToDeck(card);

      executor.putCardIntoHandFromLocation(card, CardLocation.SET_ASIDE);

      expect(loggedTemplates(logger).some((message) => message.includes('lost track'))).toBe(true);
      expect(ownedCards.getHand().contains(card)).toBe(false);
      expect(ownedCards.getDeck().contains(card)).toBe(true);
    });

    // BUG: putCardsIntoHandFromLocation has the same inverted check, leaving each card in its source zone as well
    it('moves several cards from the given location into hand', async () => {
      const { executor, ownedCards } = createHarness();
      ownedCards.addCardToDeck(createCard('Copper', 'copper-0', CardType.TREASURE));
      ownedCards.addCardToDeck(createCard('Silver', 'silver-0', CardType.TREASURE));
      const revealed = await executor.takeCardsOffDeck(2);

      executor.putCardsIntoHandFromLocation(revealed, CardLocation.REVEAL_LIMBO);

      expect(ownedCards.getHand().size()).toBe(2);
      expect(ownedCards.getCardsFromArea(CardLocation.REVEAL_LIMBO).size()).toBe(0);
    });
  });

  describe('effect processing', () => {
    it('lets the player pick among optional effects until they decline, skipping effects already used', async () => {
      const { executor, effects, decisionService, sharedGameState } = createHarness();
      const silver = createCard('Silver', 'silver-0', CardType.TREASURE);
      const firstEffect = createEffect({ id: 'first', ownerName: 'Watchtower' });
      const secondEffect = createEffect({ id: 'second', ownerName: 'Trader' });
      effects.getEffectsByType.mockReturnValue([firstEffect, secondEffect]);
      decisionService.chooseFromMultipleEvents
        .mockResolvedValueOnce({ type: ChoiceType.Effect, effectName: 'Watchtower', effectId: 'first' })
        .mockResolvedValueOnce({ type: ChoiceType.None });
      const firstChoice = { type: ChoiceType.Effect, effectName: 'Watchtower', effectId: 'first' };
      const secondChoice = { type: ChoiceType.Effect, effectName: 'Trader', effectId: 'second' };

      await executor.processEffectsByType(EffectTriggerType.GAIN, silver);

      expect(firstEffect.doAction).toHaveBeenCalledTimes(1);
      expect(firstEffect.doAction).toHaveBeenCalledWith(executor, silver);
      expect(secondEffect.doAction).not.toHaveBeenCalled();
      expect(decisionService.chooseFromMultipleEvents).toHaveBeenNthCalledWith(
        1,
        'You gained a Silver.',
        [firstChoice, secondChoice],
        [],
      );
      expect(decisionService.chooseFromMultipleEvents).toHaveBeenNthCalledWith(
        2,
        'You gained a Silver.',
        [secondChoice],
        [],
      );
      expect(sharedGameState.pushActiveEffectOntoStack).toHaveBeenCalledWith(firstEffect);
      expect(sharedGameState.popActiveEffectOffOfStack).toHaveBeenCalledTimes(1);
    });

    it('only considers effects whose card eligibility matches the target cards', async () => {
      const { executor, effects, decisionService } = createHarness();
      const silver = createCard('Silver', 'silver-0', CardType.TREASURE);
      const goldOnlyEffect = createEffect({
        id: 'gold-only',
        ownerName: 'Trader',
        cardEligibility: cardNameIs('Gold'),
      });
      effects.getEffectsByType.mockReturnValue([goldOnlyEffect]);

      await executor.processEffectsByType(EffectTriggerType.GAIN, CardCollection.fromCards([silver]));

      expect(goldOnlyEffect.doAction).not.toHaveBeenCalled();
      expect(decisionService.chooseFromMultipleEvents).not.toHaveBeenCalled();
    });
  });

  describe('turn-based counts and eligibility functions', () => {
    it('counts matching cards across hand, play, trash, and the cards gained this turn', () => {
      const { executor, ownedCards, sharedTrash, turnTracker } = createHarness();
      ownedCards.addCardToHand(createCard('Copper', 'copper-0', CardType.TREASURE));
      ownedCards.addCardToHand(createCard('Copper', 'copper-1', CardType.TREASURE));
      ownedCards.addCardToHand(createCard('Silver', 'silver-0', CardType.TREASURE));
      ownedCards.addCardToInPlay(createCard('Village', 'village-0'));
      ownedCards.addCardToInPlay(createCard('Village', 'village-1'));
      sharedTrash.addCard(createCard('Estate', 'estate-0', CardType.VICTORY));
      sharedTrash.addCard(createCard('Estate', 'estate-1', CardType.VICTORY));
      sharedTrash.addCard(createCard('Curse', 'curse-0', CardType.CURSE));
      turnTracker.addGainedCard(createCard('Silver', 'silver-gained', CardType.TREASURE));
      turnTracker.updateTurnPhase(TurnPhase.BUY);
      turnTracker.addGainedCard(createCard('Gold', 'gold-gained', CardType.TREASURE));
      turnTracker.addGainedCard(createCard('Province', 'province-gained', CardType.VICTORY));

      expect(executor.numUniqueMatchingCardsInHand(isTreasureCard)).toBe(2);
      expect(executor.numMatchingCardsInPlay(anyCard)).toBe(2);
      expect(executor.numUniqueMatchingCardsInPlay(anyCard)).toBe(1);
      expect(executor.getMatchingCardsInPlay(isActionCard).size()).toBe(2);
      expect(executor.numMatchingCardsInTrash(isVictoryCard)).toBe(2);
      expect(executor.numUniqueMatchingCardsInTrash(anyCard)).toBe(2);
      expect(executor.getMatchingCardsInTrash(isCurseCard).size()).toBe(1);
      expect(executor.numMatchingCardsGainedThisTurn(isTreasureCard)).toBe(2);
      expect(executor.getNumCardsGainedInThisTurnsBuyPhase()).toBe(2);
    });

    // BUG: the played card is registered before PLAYED_CARD fires, so the first matching card already counts as played
    it('matches only the first matching card played this turn', async () => {
      const { executor, ownedCards, sharedGameState } = createHarness();
      const firstSilver = createCard('Silver', 'silver-0', CardType.TREASURE);
      const secondSilver = createCard('Silver', 'silver-1', CardType.TREASURE);
      ownedCards.addCardToHand(firstSilver);
      ownedCards.addCardToHand(secondSilver);
      const firstSilverPlayed = executor.createFirstMatchingCardPlayedThisTurnEligibilityFunction(cardNameIs('Silver'));
      const matchedWhenPlayed: boolean[] = [];
      sharedGameState.triggerEffect.mockImplementation(async (trigger, _player, cards) => {
        if (trigger === EffectTriggerType.PLAYED_CARD && cards instanceof CardCollection) {
          matchedWhenPlayed.push(firstSilverPlayed.matches(cards.getArbitraryCard()));
        }
      });

      await executor.playCardFromHand(firstSilver);
      await executor.playCardFromHand(secondSilver);

      expect(matchedWhenPlayed).toEqual([true, false]);
    });

    it('matches cards the player to the left gained on their last completed turn', () => {
      const { executor, sharedGameState } = createHarness();
      const leftPlayer = { getName: () => 'Bob' } as unknown as Player;
      const leftTracker = new TurnTracker(new Turn(leftPlayer, 0, 0));
      leftPlayer.getTurnTracker = () => leftTracker;
      sharedGameState.getPlayerLeftOfCurrent.mockReturnValue(leftPlayer);

      leftTracker.startNewStandardTurn();
      leftTracker.addGainedCard(createCard('Silver', 'silver-gained', CardType.TREASURE));
      leftTracker.endTurn();
      leftTracker.startNewStandardTurn();
      leftTracker.addGainedCard(createCard('Gold', 'gold-gained', CardType.TREASURE));

      const gainedLastTurn = executor.createPlayerToTheLeftGainedOnTheirLastTurnCardEligibilityFunction();

      expect(gainedLastTurn.matches(createCard('Silver', 'silver-supply', CardType.TREASURE))).toBe(true);
      expect(gainedLastTurn.matches(createCard('Gold', 'gold-supply', CardType.TREASURE))).toBe(false);
    });

    it('returns noCard when the player to the left has not completed a turn', () => {
      const { executor, sharedGameState } = createHarness();
      const leftPlayer = { getName: () => 'Bob' } as unknown as Player;
      const leftTracker = new TurnTracker(new Turn(leftPlayer, 0, 0));
      leftPlayer.getTurnTracker = () => leftTracker;
      sharedGameState.getPlayerLeftOfCurrent.mockReturnValue(leftPlayer);

      expect(executor.createPlayerToTheLeftGainedOnTheirLastTurnCardEligibilityFunction()).toBe(noCard);
    });

    // BUG: isDuplicateWith matches cards with no copy in the collection, so not(isDuplicateWith(...)) matches duplicates
    it('matches only cards that have no copy in hand or in play', () => {
      const { executor, ownedCards } = createHarness();
      ownedCards.addCardToHand(createCard('Copper', 'copper-hand', CardType.TREASURE));
      ownedCards.addCardToInPlay(createCard('Village', 'village-play'));
      const notInHand = executor.createIsNotDuplicateWithHandCardEligibilityFunction();
      const notInPlay = executor.createIsNotDuplicateWithInPlayCardEligibilityFunction();

      expect(notInHand.matches(createCard('Silver', 'silver-deck', CardType.TREASURE))).toBe(true);
      expect(notInHand.matches(createCard('Copper', 'copper-deck', CardType.TREASURE))).toBe(false);
      expect(notInPlay.matches(createCard('Smithy', 'smithy-hand'))).toBe(true);
      expect(notInPlay.matches(createCard('Village', 'village-hand'))).toBe(false);
    });

    it('groups matching cards in shared areas by name for multi-card choices', () => {
      const { executor, sharedTrash } = createHarness();
      sharedTrash.addCard(createCard('Estate', 'estate-0', CardType.VICTORY));
      sharedTrash.addCard(createCard('Estate', 'estate-1', CardType.VICTORY));
      sharedTrash.addCard(createCard('Copper', 'copper-0', CardType.TREASURE));

      const choices = executor.getEligibleCardMultiChoices(new Set([CardLocation.TRASH]), anyCard);

      expect(choices.map((choice) => choice.cards.map((card) => card.id))).toEqual([
        ['estate-0', 'estate-1'],
        ['copper-0'],
      ]);
      expect(choices.map((choice) => choice.type)).toEqual([ChoiceType.MultiCard, ChoiceType.MultiCard]);
    });
  });
});
