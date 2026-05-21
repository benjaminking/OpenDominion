/**
 * Shared test infrastructure for card tests.
 *
 * Use `createCardHarness()` to get a real InstructionExecutor backed by a real
 * PlayerCards instance and a TrackingStats accumulator.  State-based assertions
 * can then check observable outcomes rather than internal method calls.
 *
 * Usage example:
 *   const h = createCardHarness();
 *   for (let i = 0; i < 5; i++) h.addToDeck(new Copper(h.sharedGameState));
 *   await new Smithy(h.sharedGameState).play(h.executor);
 *   expect(h.hand.size()).toBe(3);
 *   expect(h.deck.size()).toBe(2);
 */

import { CardLocation, ChoiceType } from '@dominion/common';
import { vi } from 'vitest';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';
import { Player } from '../../src/players/Player';
import { PlayerCards } from '../../src/players/PlayerCards';
import { SharedGameState } from '../../src/SharedGameState';

// ---------------------------------------------------------------------------
// Accumulating statistics so tests can inspect stats.coins, stats.actions etc.
// ---------------------------------------------------------------------------

export class TrackingStats {
  coins = 0;
  actions = 0;
  buys = 0;
  vp = 0;

  addCoins = async (n: number): Promise<void> => {
    this.coins += n;
  };
  addActions = (n: number): void => {
    this.actions += n;
  };
  addBuys = (n: number): void => {
    this.buys += n;
  };
  addVP = (n: number): void => {
    this.vp += n;
  };
  spendCoins = (n: number): void => {
    this.coins -= n;
  };
  useBuy = (): void => {
    this.buys -= 1;
  };
  useAction = (): void => {
    this.actions -= 1;
  };

  // Rarely-called helpers – kept as spies for convenience
  setScore = vi.fn();
  hasPlayedMatchingCardThisTurn = vi.fn(() => false);
  hasGainedMatchingCardThisTurn = vi.fn(() => false);
  numMatchingCardsPlayedThisTurn = vi.fn(() => 0);
  addPlayedCard = vi.fn();
  addGainedCard = vi.fn();
  setNumCardsToDrawInCleanup = vi.fn();
  getUnofficialTurnNumber = vi.fn(() => 0);
}

// ---------------------------------------------------------------------------
// Main harness factory
// ---------------------------------------------------------------------------

export const createCardHarness = () => {
  const logger = { gameMessage: vi.fn() };
  const broadcaster = { updatePlayerCards: vi.fn(), sendStatus: vi.fn(), sendMessage: vi.fn() };

  const decisionService = {
    chooseExtraTurns: vi.fn(async () => ({ type: ChoiceType.ExtraTurn })),
    chooseOneOption: vi.fn(async () => ({ name: '' })),
    chooseCard: vi.fn(async () => ({ type: ChoiceType.None })),
    chooseCards: vi.fn(async () => ({ cards: [] as ReturnType<Card['getMetadata']>[] })),
    chooseFromMultipleEvents: vi.fn(async () => ({ type: ChoiceType.None })),
    chooseMultipleOptions: vi.fn(async () => ({ names: [] as string[] })),
  };

  const stats = new TrackingStats();

  const effects = {
    addEffect: vi.fn(),
    addExtraTurn: vi.fn(),
    blockAttack: vi.fn(),
    findValidExtraTurns: vi.fn(() => []),
    getEffectsByType: vi.fn(() => []),
  };

  const sharedExtraCards = new CardCollection();
  const sharedTrash = new CardCollection();
  const sharedAreas = new Map<CardLocation, CardCollection>([
    [CardLocation.DISCARD, new CardCollection()],
    [CardLocation.TRASH, sharedTrash],
    [CardLocation.REVEAL_LIMBO, new CardCollection()],
  ]);

  const pileCards = new Map<string, Card[]>();
  const topCardsOfSupplyPiles = new CardCollection();
  const sharedCardsById = new Map<string, Card>();

  const piles = {
    getTopCardOfPile: vi.fn((pileName: string) => pileCards.get(pileName)?.[0]),
    isPileEmpty: vi.fn((pileName: string) => (pileCards.get(pileName)?.length ?? 0) === 0),
    removeTopCardFromPile: vi.fn((pileName: string) => pileCards.get(pileName)?.shift()),
    getTopCardsOfSupplyPiles: vi.fn(() => topCardsOfSupplyPiles),
  };

  // Forward reference so the sharedGameState closure can reference executor.
  // The executor is assigned below after it is created.
  // eslint-disable-next-line prefer-const
  let executor: InstructionExecutor;

  const sharedGameState = {
    piles,
    trash: sharedTrash,
    cardsPlayedThisTurn: new CardCollection(),
    triggerEffect: vi.fn(async () => undefined),
    registerEffectTrigger: vi.fn(),
    cost: vi.fn((card: Card) => card.getOriginalCost()),
    addCostModifier: vi.fn(),
    isSharedLocation: vi.fn(
      (location: CardLocation) => location === CardLocation.PILE || location === CardLocation.TRASH,
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
    executeForEachPlayer: vi.fn(async (fn: (ie: InstructionExecutor) => Promise<void>) => {
      await fn(executor);
    }),
    executeForEachOtherPlayer: vi.fn(async (fn: (ie: InstructionExecutor) => Promise<void>) => {
      await fn(executor);
    }),
    eachPlayerPassesACardToTheLeft: vi.fn(async () => undefined),
    pushActiveEffectOntoStack: vi.fn(),
    popActiveEffectOffOfStack: vi.fn(),
    trashCards: vi.fn(async (_player: unknown, cards: CardCollection) => {
      sharedTrash.addCards(cards);
      return cards;
    }),
  } as unknown as SharedGameState;

  const game = {
    getLogger: () => logger,
    getMessageBroadcaster: () => broadcaster,
    getGameState: () => sharedGameState,
  };

  const player = {
    getGame: () => game,
    getStatistics: () => stats,
    getEffects: () => effects,
    getDecisionService: () => decisionService,
    getName: () => 'Alice',
    getBotStatistics: () => ({ addCardToStatistics: vi.fn() }),
  } as unknown as Player;

  const ownedCards = new PlayerCards(player);
  player.getOwnedCards = () => ownedCards;

  executor = new InstructionExecutor(sharedGameState, player);
  // Required by CardChoiceBuilder / ChooseOneOptionBuilder constructors.
  player.getInstructionExecutor = () => executor;

  // ---------------------------------------------------------------------------
  // Setup helpers
  // ---------------------------------------------------------------------------

  /** Adds a card to the top of the player's deck. */
  const addToDeck = (card: Card): void => {
    ownedCards.addCardToDeck(card);
  };

  /** Adds a card to the player's hand. */
  const addToHand = (card: Card): void => {
    ownedCards.addCardToHand(card);
  };

  /** Adds a card to the player's discard pile. */
  const addToDiscard = (card: Card): void => {
    ownedCards.addCardToDiscard(card);
  };

  /** Adds a card to the player's in-play zone. */
  const addToInPlay = (card: Card): void => {
    ownedCards.addCardToInPlay(card);
  };

  /**
   * Registers a card as the top card of its supply pile.
   * After calling this the card will:
   *  - be eligible for supply-choice prompts (topCardsOfSupplyPiles)
   *  - be findable by `ie.getCardByMetadata()` (sharedCardsById)
   *  - be gainable via `ie.gainFromPile()` / `ie.gainCardFromPile()` (pileCards)
   */
  const addSupplyPile = (card: Card): void => {
    const pileName = card.getPileName();
    const existing = pileCards.get(pileName) ?? [];
    existing.push(card);
    pileCards.set(pileName, existing);
    // Also register by lowercase name so cards can be looked up by either case
    const lowerName = pileName.toLowerCase();
    if (lowerName !== pileName) {
      pileCards.set(lowerName, existing);
    }
    topCardsOfSupplyPiles.addCard(card);
    sharedCardsById.set(card.getId(), card);
  };

  /**
   * Configures `decisionService.chooseCard` to return `card` on the next call.
   * Metadata is resolved at invocation time so location reflects card state during play.
   * Stack multiple calls to `pickCard` for multi-step choice flows.
   */
  const pickCard = (card: Card): void => {
    decisionService.chooseCard.mockImplementationOnce(async () => ({
      type: ChoiceType.Card,
      card: card.getMetadata(),
      name: card.getName(),
    }));
  };

  /**
   * Configures `decisionService.chooseCards` to return the given cards on the next call.
   * Metadata is resolved at invocation time so locations reflect card state during play.
   * Used for multi-card choices (Cellar, Chapel, etc.).
   */
  const pickCards = (cards: Card[]): void => {
    decisionService.chooseCards.mockImplementationOnce(async () => ({
      cards: cards.map((c) => c.getMetadata()),
    }));
  };

  /**
   * Configures `decisionService.chooseOneOption` to return a named option on the next call.
   * The name must match exactly what the card registers (e.g. '+1 Card').
   */
  const pickOption = (name: string): void => {
    decisionService.chooseOneOption.mockResolvedValueOnce({ name });
  };

  /**
   * Configures `decisionService.chooseMultipleOptions` to return the named options on the next call.
   */
  const pickOptions = (names: string[]): void => {
    decisionService.chooseMultipleOptions.mockResolvedValueOnce({ names });
  };

  return {
    executor,
    player,
    ownedCards,
    stats,
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
    // Convenient zone accessors
    hand: ownedCards.getHand(),
    deck: ownedCards.getDeck(),
    discard: ownedCards.getDiscard(),
    inPlay: ownedCards.getInPlay(),
    // Setup helpers
    addToDeck,
    addToHand,
    addToDiscard,
    addToInPlay,
    addSupplyPile,
    pickCard,
    pickCards,
    pickOption,
    pickOptions,
  };
};

export type CardHarness = ReturnType<typeof createCardHarness>;
