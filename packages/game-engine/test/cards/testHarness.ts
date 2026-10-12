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
import { Effect } from '../../src/effects/Effect';
import { EffectTriggerType } from '../../src/effects/EffectTriggerType';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';
import { Player } from '../../src/players/Player';
import { PlayerCards } from '../../src/players/PlayerCards';
import { TurnTracker } from '../../src/players/TurnTracker';
import { Turn } from '../../src/turns/Turn';
import { createTestClock } from '../testClock';

// ---------------------------------------------------------------------------
// Accumulating statistics so tests can inspect stats.coins, stats.actions etc.
// ---------------------------------------------------------------------------

export class TrackingStats {
  coins = 0;
  potions = 0;
  actions = 0;
  buys = 0;
  vp = 0;
  coffers = 0;

  addCoins = async (n: number): Promise<void> => {
    this.coins += n;
  };
  subtractCoins = (n: number): void => {
    this.coins = Math.max(0, this.coins - n);
  };
  addPotions = (n: number): void => {
    this.potions += n;
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
  addCoffers = (n: number): void => {
    this.coffers += n;
  };
  removeCoffers = (n: number): number => {
    const removed = Math.min(n, this.coffers);
    this.coffers -= removed;
    return removed;
  };
  spendCoins = (n: number): void => {
    this.coins -= n;
  };
  spendPotions = (n: number): void => {
    this.potions -= n;
  };
  spendAmount = (amount: { coins: number; potions: number }): void => {
    this.coins -= amount.coins;
    this.potions -= amount.potions;
  };
  useBuy = (): void => {
    this.buys -= 1;
  };
  useAction = (): void => {
    this.actions -= 1;
  };
  getCoins = (): number => this.coins;
  getPotions = (): number => this.potions;
  getActions = (): number => this.actions;
  getBuys = (): number => this.buys;
  getCoffers = (): number => this.coffers;

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

  // Pile arrays are ordered top-first: index 0 is the top card.
  const piles = {
    getTopCardOfPile: vi.fn((pileName: string) => pileCards.get(pileName)?.[0]),
    isPileEmpty: vi.fn((pileName: string) => (pileCards.get(pileName)?.length ?? 0) === 0),
    isPile: vi.fn((pileName: string) => pileCards.has(pileName)),
    // Every pile a test registers is a Supply pile (see addSupplyPile)
    isSupplyPile: vi.fn((pileName: string) => pileCards.has(pileName)),
    getPileSizeByName: vi.fn((pileName: string) => pileCards.get(pileName)?.length ?? 0),
    removeTopCardFromPile: vi.fn((pileName: string) => pileCards.get(pileName)?.shift()),
    removeCardFromPile: vi.fn((card: Card) => {
      const pile = pileCards.get(card.getPileName());
      const index = pile?.indexOf(card) ?? -1;
      if (pile === undefined || index < 0) return undefined;
      return pile.splice(index, 1)[0];
    }),
    isCardInPile: vi.fn((card: Card, pileName: string) => pileCards.get(pileName)?.includes(card) ?? false),
    returnCardToPile: vi.fn((card: Card) => {
      const pile = pileCards.get(card.getPileName());
      if (pile === undefined) return;
      card.setLocation(CardLocation.PILE);
      pile.unshift(card);
    }),
    getUniqueCardsFromPile: vi.fn((pileName: string) => {
      const unique = new CardCollection();
      const seenNames = new Set<string>();
      for (const card of pileCards.get(pileName) ?? []) {
        if (!seenNames.has(card.getName())) {
          seenNames.add(card.getName());
          unique.addCard(card);
        }
      }
      return unique;
    }),
    getTopCardsOfSupplyPiles: vi.fn(() => topCardsOfSupplyPiles),
  };

  // Mirrors SharedGameState's reference-counted "leave it in place" blocking.
  const numBlocksById = new Map<string, number>();

  // Forward reference so the sharedGameState closure can reference executor.
  // The executor is assigned below after it is created.
  // eslint-disable-next-line prefer-const
  let executor: InstructionExecutor;

  const sharedGameState = {
    piles,
    trash: sharedTrash,
    triggerEffect: vi.fn(async () => undefined),
    registerEffectTrigger: vi.fn(),
    ...createTestClock(),
    cost: vi.fn((card: Card) => card.getOriginalCost()),
    addCostModifier: vi.fn(),
    isSharedLocation: vi.fn(
      (location: CardLocation) => location === CardLocation.PILE || location === CardLocation.TRASH,
    ),
    getCardByMetadata: vi.fn((metadata) => sharedCardsById.get(metadata.id)),
    getCardsFromArea: vi.fn((location: CardLocation) => sharedAreas.get(location) ?? new CardCollection()),
    getPreviousTurns: vi.fn(() => []),
    getCurrentTurn: vi.fn(() => ({}) as never),
    // "All cards used in this game": the Supply's cards plus any extra cards a test registers
    getAllExtraCards: vi.fn(() => CardCollection.fromCards([...topCardsOfSupplyPiles, ...sharedExtraCards])),
    getCurrentPlayer: vi.fn(() => player),
    getPlayerLeftOfCurrent: vi.fn(() => player),
    getPlayerRightOfCurrent: vi.fn(() => player),
    getPlayerLeftOfPlayer: vi.fn(() => player),
    getCurrentTurnOrder: vi.fn(() => [player]),
    getNumPlayers: vi.fn(() => 2),
    blockCardFromMoving: vi.fn((card: Card) => {
      numBlocksById.set(card.getId(), (numBlocksById.get(card.getId()) ?? 0) + 1);
    }),
    releaseCardToMoveAgain: vi.fn((card: Card) => {
      numBlocksById.set(card.getId(), (numBlocksById.get(card.getId()) ?? 0) - 1);
    }),
    isCardAbleToMove: vi.fn((card: Card) => (numBlocksById.get(card.getId()) ?? 0) <= 0),
    isCardInPile: vi.fn((card: Card, pileName: string) => piles.isCardInPile(card, pileName)),
    isTurnEligibilitySatisfied: vi.fn(() => true),
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
      for (const card of cards) {
        card.setLocation(CardLocation.TRASH);
      }
      return cards;
    }),
    isCopyOfCardOnTopOfPile: vi.fn((card: Card | string, pileName: string) => {
      const topCard = piles.getTopCardOfPile(pileName);
      if (topCard === undefined) return false;
      if (typeof card === 'string') return topCard.getName() === card || topCard.getDisplayName() === card;
      return topCard.getName() === card.getName();
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
    getBotStatistics: () => ({
      addCardToStatistics: vi.fn(),
      removeCardFromStatistics: vi.fn(),
    }),
    calculateScore: vi.fn(),
  } as unknown as Player;

  const ownedCards = new PlayerCards(player);
  player.getOwnedCards = () => ownedCards;

  const turnTracker = new TurnTracker(new Turn(player, 0, 0));
  player.getTurnTracker = () => turnTracker;

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
    // Pile names are case-sensitive, as in the real Piles.
    pileCards.set(pileName, existing);
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

  /**
   * Makes `ie.performAttack(...)` run the attack against each target harness's
   * player (in order), with this harness's player as the attacker.
   */
  const routeAttacksTo = (...targets: { player: Player }[]): void => {
    vi.mocked(sharedGameState.performAttack).mockImplementation(
      async (
        _attackingPlayer: Player,
        _attackCard: Card,
        sharedInstruction: (attackedPlayer: Player, attackingPlayer: Player) => Promise<void>,
      ) => {
        for (const target of targets) {
          await sharedInstruction(target.player, player);
        }
      },
    );
  };

  /**
   * Makes `ie.eachOtherPlayer(...)` run against each target harness's executor
   * instead of this harness's own executor.
   */
  const routeOtherPlayersTo = (...targets: { executor: InstructionExecutor }[]): void => {
    vi.mocked(sharedGameState.executeForEachOtherPlayer).mockImplementation(
      async (sharedInstruction: (ie: InstructionExecutor) => Promise<void>) => {
        for (const target of targets) {
          await sharedInstruction(target.executor);
        }
      },
    );
  };

  /**
   * Returns the effects a card registered on itself (e.g. "when you trash this")
   * for the given trigger type. Call `.doAction(executor, card)` to fire one.
   */
  const getCardEffects = (card: Card, trigger: EffectTriggerType): Effect[] =>
    card.getEffects().filter((effect: Effect) => effect.getTrigger() === trigger);

  /**
   * Returns the effects added to this player via `ie.addEffect(...)`, optionally
   * filtered to one trigger type.
   */
  const getAddedEffects = (trigger?: EffectTriggerType): Effect[] =>
    effects.addEffect.mock.calls
      .map((call: unknown[]) => call[0] as Effect)
      .filter((effect: Effect) => trigger === undefined || effect.getTrigger() === trigger);

  return {
    executor,
    player,
    ownedCards,
    stats,
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
    routeAttacksTo,
    routeOtherPlayersTo,
    getCardEffects,
    getAddedEffects,
  };
};

export type CardHarness = ReturnType<typeof createCardHarness>;
