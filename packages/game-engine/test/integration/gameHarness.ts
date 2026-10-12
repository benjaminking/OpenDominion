/**
 * Integration test harness: runs a real game (real SharedGameState, players, piles, effects,
 * triggers and turn loop) where every player decision is answered by the test.
 *
 * The game runs in the background and pauses whenever a player has to make a decision. Each
 * answer method (playAction, chooseCard, chooseEffect, ...) checks that the pending decision is
 * the expected kind and that the requested choice was actually offered, answers it, and then
 * waits until the game pauses at the next decision (or ends). In between, tests can inspect the
 * real game state.
 *
 * Because the engine is real, triggered effects (reactions, "when you gain/trash/discard",
 * start/end of turn, Durations, Attacks and their blocking) all fire exactly as in a game.
 *
 * Usage example:
 *   const game = createGame({ kingdom: ['Militia', 'Moat'] });
 *   game.alice.setHand(['Militia', 'Copper', 'Copper', 'Copper', 'Copper']);
 *   game.bob.setHand(['Moat', 'Estate', 'Estate', 'Estate', 'Estate']);
 *   await game.start();                    // paused at Alice's action phase
 *   await game.playAction('Militia');      // paused at Bob's reaction prompt
 *   expect(game.pending.playerName).toBe('Bob');
 *   await game.chooseEffect('Moat');       // Bob reveals Moat
 *   ...
 *
 * Players are seated in the order given (default Alice then Bob), and Alice takes the first turn.
 */

import { Client } from '@dominion/client-common';
import {
  CardChoice,
  CardLocation,
  CardSelectionPurpose,
  Choice,
  ChoiceType,
  DecisionService,
  EffectChoice,
  EndActionPhaseChoice,
  EndBuyPhaseChoice,
  EndTreasurePhaseChoice,
  EndTurnChoice,
  ExtraTurnChoice,
  GameMessageTransmitter,
  GameResult,
  LogMessage,
  LogMessageTransmitter,
  MultiCardChoice,
  MultiNamedChoice,
  NamedChoice,
  NoneChoice,
  SimpleTreasuresChoice,
} from '@dominion/common';

import { Card } from '../../src/card/Card';
import { CardCollection } from '../../src/card/CardCollection';
import { CardFactory } from '../../src/card/CardFactory';
import { Cost } from '../../src/card/Cost';
import { Game } from '../../src/Game';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { convertToClassName } from '../../src/NameUtils';
import { InstructionExecutor } from '../../src/players/InstructionExecutor';
import { Player } from '../../src/players/Player';
import { PlayerSpecification } from '../../src/players/PlayerSpecification';
import { GameInitializer } from '../../src/setup/GameInitializer';

// ---------------------------------------------------------------------------
// Pending decisions
// ---------------------------------------------------------------------------

export type DecisionKind =
  | 'actionPhase'
  | 'treasurePhase'
  | 'buyPhase'
  | 'chooseCard'
  | 'chooseCards'
  | 'chooseOneOption'
  | 'chooseMultipleOptions'
  | 'chooseFromMultipleEvents'
  | 'chooseExtraTurns';

export interface PendingDecision {
  kind: DecisionKind;
  playerName: string;
  prompt: string;
  /** Cards offered (action/treasure/buy phases, chooseCard, chooseCards). */
  cardChoices: CardChoice[];
  /** chooseCard: whether a "none" answer was offered. */
  noneAllowed: boolean;
  /** chooseCards: the allowed numbers of selected cards. */
  numSelectedEligibility: number[];
  /** chooseOneOption / chooseMultipleOptions: the option names offered. */
  options: string[];
  /** chooseMultipleOptions: how many options must be chosen. */
  numToSelect: number;
  /** chooseFromMultipleEvents: the effects that may / must be resolved now. */
  optionalEffects: EffectChoice[];
  mandatoryEffects: EffectChoice[];
  /** chooseFromMultipleEvents: context such as "An opponent played Militia." */
  extraMessage: string;
  /** chooseExtraTurns */
  extraTurns: ExtraTurnChoice[];
  /** treasurePhase */
  simpleTreasures: SimpleTreasuresChoice | undefined;
  /** buyPhase */
  numBuys: number;
  numCoins: number;
  numPotions: number;
  /** chooseCard / chooseCards: the purpose of the selection (TRASH, GAIN, ...). */
  selectionPurpose: CardSelectionPurpose | undefined;
  resolve: (choice: Choice) => void;
}

const describeDecision = (decision: PendingDecision): string => {
  const parts = [`${decision.playerName}: ${decision.kind}`];
  if (decision.prompt !== '') parts.push(`"${decision.prompt}"`);
  if (decision.cardChoices.length > 0) {
    parts.push(`cards=[${decision.cardChoices.map((c) => `${c.card.name}@${c.card.location}`).join(', ')}]`);
  }
  if (decision.noneAllowed) parts.push('none allowed');
  if (decision.options.length > 0) parts.push(`options=[${decision.options.join(', ')}]`);
  if (decision.optionalEffects.length > 0) {
    parts.push(`optional effects=[${decision.optionalEffects.map((e) => e.effectName).join(', ')}]`);
  }
  if (decision.mandatoryEffects.length > 0) {
    parts.push(`mandatory effects=[${decision.mandatoryEffects.map((e) => e.effectName).join(', ')}]`);
  }
  if (decision.extraMessage !== '') parts.push(`message="${decision.extraMessage}"`);
  return parts.join(' ');
};

const emptyDecision = (kind: DecisionKind, playerName: string): Omit<PendingDecision, 'resolve'> => ({
  kind,
  playerName,
  prompt: '',
  cardChoices: [],
  noneAllowed: false,
  numSelectedEligibility: [],
  options: [],
  numToSelect: 0,
  optionalEffects: [],
  mandatoryEffects: [],
  extraMessage: '',
  extraTurns: [],
  simpleTreasures: undefined,
  numBuys: 0,
  numCoins: 0,
  numPotions: 0,
  selectionPurpose: undefined,
});

/** Holds the single decision the game is currently waiting on, and wakes up anyone waiting for one. */
class DecisionQueue {
  private pendingDecision: PendingDecision | undefined;
  private waiters: (() => void)[] = [];

  public get pending(): PendingDecision | undefined {
    return this.pendingDecision;
  }

  public push(decision: PendingDecision): void {
    if (this.pendingDecision !== undefined) {
      throw new Error(
        `The game asked for a decision while another was pending:\n  pending: ${describeDecision(this.pendingDecision)}\n  new: ${describeDecision(decision)}`,
      );
    }
    this.pendingDecision = decision;
    this.notify();
  }

  public take(): PendingDecision {
    const decision = this.pendingDecision;
    if (decision === undefined) {
      throw new Error('No decision is pending');
    }
    this.pendingDecision = undefined;
    return decision;
  }

  public notify(): void {
    const waiters = this.waiters;
    this.waiters = [];
    for (const waiter of waiters) {
      waiter();
    }
  }

  public async waitForChange(): Promise<void> {
    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }
}

/** A DecisionService that hands every decision to the test through the shared queue. */
class PuppetDecisionService implements DecisionService {
  public constructor(
    private readonly playerName: string,
    private readonly queue: DecisionQueue,
  ) {}

  private ask<T extends Choice>(decision: Omit<PendingDecision, 'resolve'>): Promise<T> {
    return new Promise<T>((resolve) => {
      this.queue.push({
        ...decision,
        resolve: (choice: Choice) => {
          resolve(choice as T);
        },
      });
    });
  }

  public chooseCards(
    prompt: string,
    selectionType: CardSelectionPurpose,
    _decisionName: string,
    numSelectedEligibility: number[],
    cardChoices: CardChoice[],
  ): Promise<MultiCardChoice> {
    return this.ask({
      ...emptyDecision('chooseCards', this.playerName),
      prompt,
      selectionPurpose: selectionType,
      numSelectedEligibility,
      cardChoices,
    });
  }

  public chooseCard(
    prompt: string,
    selectionType: CardSelectionPurpose,
    _decisionName: string,
    cardChoices: CardChoice[],
    noneChoice?: NoneChoice,
  ): Promise<CardChoice | NoneChoice> {
    return this.ask({
      ...emptyDecision('chooseCard', this.playerName),
      prompt,
      selectionPurpose: selectionType,
      cardChoices,
      noneAllowed: noneChoice !== undefined,
    });
  }

  public chooseOneOption(prompt: string, _decisionName: string, namedChoices: NamedChoice[]): Promise<NamedChoice> {
    return this.ask({
      ...emptyDecision('chooseOneOption', this.playerName),
      prompt,
      options: namedChoices.map((choice) => choice.name),
    });
  }

  public chooseMultipleOptions(
    prompt: string,
    _decisionName: string,
    choices: NamedChoice[],
    numToSelect: number,
  ): Promise<MultiNamedChoice> {
    return this.ask({
      ...emptyDecision('chooseMultipleOptions', this.playerName),
      prompt,
      options: choices.map((choice) => choice.name),
      numToSelect,
    });
  }

  public chooseFromMultipleEvents(
    extraMessage: string,
    optionalEffects: EffectChoice[],
    mandatoryEffects: EffectChoice[],
  ): Promise<EffectChoice | NoneChoice> {
    return this.ask({
      ...emptyDecision('chooseFromMultipleEvents', this.playerName),
      extraMessage,
      optionalEffects,
      mandatoryEffects,
    });
  }

  public chooseExtraTurns(extraTurns: ExtraTurnChoice[]): Promise<ExtraTurnChoice> {
    return this.ask({ ...emptyDecision('chooseExtraTurns', this.playerName), extraTurns });
  }

  public makeActionPhaseChoice(cardChoices: CardChoice[]): Promise<CardChoice | EndActionPhaseChoice | EndTurnChoice> {
    return this.ask({ ...emptyDecision('actionPhase', this.playerName), cardChoices });
  }

  public makeTreasurePhaseChoice(
    cardChoices: CardChoice[],
    simpleTreasuresOption: SimpleTreasuresChoice | undefined,
  ): Promise<CardChoice | SimpleTreasuresChoice | EndTreasurePhaseChoice | EndBuyPhaseChoice | EndTurnChoice> {
    return this.ask({
      ...emptyDecision('treasurePhase', this.playerName),
      cardChoices,
      simpleTreasures: simpleTreasuresOption,
    });
  }

  public makeBuyPhaseChoice(
    cardChoices: CardChoice[],
    numBuys: number,
    numCoins: number,
    numPotions: number,
  ): Promise<CardChoice | EndBuyPhaseChoice | EndTurnChoice> {
    return this.ask({ ...emptyDecision('buyPhase', this.playerName), cardChoices, numBuys, numCoins, numPotions });
  }
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

class RecordingLogTransmitter implements LogMessageTransmitter {
  public readonly messages: LogMessage[] = [];

  public sendLogMessage = (logMessage: LogMessage): void => {
    this.messages.push(logMessage);
  };
}

/** Renders a log message as plain text, e.g. "Alice plays Militia". Cards the player can't see show as "?". */
const renderLogMessage = (logMessage: LogMessage): string => {
  const known = logMessage.knownCards.map((card) => card.name);
  const unknown = Array<string>(logMessage.numUnknownCards).fill('?');
  return `${logMessage.playerName} ${logMessage.text.replace(/%c/g, [...known, ...unknown].join(', '))}`;
};

const noOpGameMessageTransmitter: GameMessageTransmitter = {
  sendMainPlayerName: () => undefined,
  sendOpponentNames: () => undefined,
  sendTurnStartMessage: () => undefined,
  sendStatisticUpdate: () => undefined,
  sendCardsUpdate: () => undefined,
  sendCardCountUpdate: () => undefined,
  sendTopCardUpdate: () => undefined,
  sendSharedCardsUpdate: () => undefined,
  sendPileMetadata: () => undefined,
  sendStatus: () => undefined,
  sendBotCoins: () => undefined,
  sendBotCardCounts: () => undefined,
  sendMechanics: () => undefined,
  sendGameConfiguration: () => undefined,
};

// ---------------------------------------------------------------------------
// Player view
// ---------------------------------------------------------------------------

let nextCardNumber = 0;

const cardNames = (cards: Card[]): string[] => cards.map((card) => card.getName());

export class TestPlayer {
  public constructor(
    public readonly name: string,
    private readonly harness: GameHarness,
    private readonly logTransmitter: RecordingLogTransmitter,
  ) {}

  public get player(): Player {
    return this.harness.game.getPlayers().getPlayerByName(this.name)!;
  }

  public get ie(): InstructionExecutor {
    return this.player.getInstructionExecutor();
  }

  // --- zones ----------------------------------------------------------------

  /** Cards in a zone. The deck is listed top card first; other zones in the order the engine stores them. */
  public cards(location: CardLocation): Card[] {
    const cards = this.player.getOwnedCards().getCardsFromArea(location).asCardArray();
    return location === CardLocation.DECK ? [...cards].reverse() : cards;
  }

  public get hand(): string[] {
    return cardNames(this.cards(CardLocation.HAND));
  }

  /** Top card first. */
  public get deck(): string[] {
    return cardNames(this.cards(CardLocation.DECK));
  }

  public get discard(): string[] {
    return cardNames(this.cards(CardLocation.DISCARD));
  }

  public get inPlay(): string[] {
    return cardNames(this.cards(CardLocation.IN_PLAY));
  }

  public get setAside(): string[] {
    return cardNames(this.cards(CardLocation.SET_ASIDE));
  }

  /** Island mat contents. (PlayerCards.getCardsFromArea doesn't expose mats, so this reads the field.) */
  public get islandMat(): string[] {
    return cardNames((this.player.getOwnedCards() as unknown as { islandMat: CardCollection }).islandMat.asCardArray());
  }

  /** Native Village mat contents. */
  public get nativeVillageMat(): string[] {
    return cardNames(
      (this.player.getOwnedCards() as unknown as { nativeVillageMat: CardCollection }).nativeVillageMat.asCardArray(),
    );
  }

  // --- statistics -----------------------------------------------------------

  public get coins(): number {
    return this.player.getStatistics().getCoins();
  }

  public get potions(): number {
    return this.player.getStatistics().getPotions();
  }

  public get actions(): number {
    return this.player.getStatistics().getActions();
  }

  public get buys(): number {
    return this.player.getStatistics().getBuys();
  }

  public get coffers(): number {
    return this.player.getStatistics().getCoffers();
  }

  /** VP tokens. */
  public get vpTokens(): number {
    return this.player.getStatistics().getVPChipScoringElement().totalPoints;
  }

  /** Total score (cards plus VP tokens), recalculated now. */
  public get score(): number {
    this.player.calculateScore();
    return this.player.getStatistics().getScore();
  }

  // --- logs -----------------------------------------------------------------

  /** Everything this player has seen in the log, as plain text. */
  public get log(): string[] {
    return this.logTransmitter.messages.map(renderLogMessage);
  }

  // --- setup ------------------------------------------------------------------

  /** Creates a new card owned by nobody yet (not in any zone). */
  public createCard(cardName: string, location: CardLocation = CardLocation.HAND): Card {
    nextCardNumber++;
    const className = convertToClassName(cardName);
    return new CardFactory(this.harness.state).createCard(
      className,
      `${this.name}-${className}-${String(nextCardNumber)}`,
      location,
    );
  }

  /** Replaces the hand with new cards. Returns the created cards. */
  public setHand(names: string[]): Card[] {
    const ownedCards = this.player.getOwnedCards();
    this.removeAll(ownedCards.getHand());
    return names.map((name) => {
      const card = this.createCard(name);
      ownedCards.addCardToHand(card);
      this.player.getBotStatistics().addCardToStatistics(card);
      return card;
    });
  }

  /** Replaces the deck with new cards, listed top card first. Returns the created cards (top first). */
  public setDeck(names: string[]): Card[] {
    const ownedCards = this.player.getOwnedCards();
    this.removeAll(ownedCards.getDeck());
    const created = names.map((name) => this.createCard(name, CardLocation.DECK));
    for (const card of [...created].reverse()) {
      ownedCards.addCardToDeck(card);
      this.player.getBotStatistics().addCardToStatistics(card);
    }
    return created;
  }

  /** Replaces the discard pile with new cards. Returns the created cards. */
  public setDiscard(names: string[]): Card[] {
    const ownedCards = this.player.getOwnedCards();
    this.removeAll(ownedCards.getDiscard());
    return names.map((name) => {
      const card = this.createCard(name, CardLocation.DISCARD);
      ownedCards.addCardToDiscard(card);
      this.player.getBotStatistics().addCardToStatistics(card);
      return card;
    });
  }

  /** Adds one new card to the hand. */
  public addToHand(name: string): Card {
    const card = this.createCard(name);
    this.player.getOwnedCards().addCardToHand(card);
    this.player.getBotStatistics().addCardToStatistics(card);
    return card;
  }

  private removeAll(collection: CardCollection): void {
    for (const card of collection.asCardArray()) {
      this.player.getBotStatistics().removeCardFromStatistics(card);
    }
    collection.clear();
  }
}

// ---------------------------------------------------------------------------
// Game harness
// ---------------------------------------------------------------------------

// Simple cards with no setup rules or triggers, used to fill the rest of the kingdom.
const FILLER_KINGDOM_CARDS = [
  'Village',
  'Smithy',
  'Market',
  'Festival',
  'Laboratory',
  'Council Room',
  'Workshop',
  'Cellar',
  'Chapel',
  'Moneylender',
  'Gardens',
  'Harbinger',
];

export interface CreateGameOptions {
  /** Kingdom cards that must be in the game. The rest of the 10 are filled with simple base cards. */
  kingdom?: string[];
  /** Player names, in seating order (each player's left neighbour is the next one). Default: Alice, Bob. */
  players?: string[];
  useShelters?: boolean;
  useColoniesPlatinum?: boolean;
  /**
   * Give every player 1 Action, 1 Buy and $0 before the first turn, as at the start of every later turn.
   * Default true. (The engine itself only does this at the end of each turn.)
   */
  resetStatisticsBeforeStart?: boolean;
}

export class GameHarness {
  public readonly queue = new DecisionQueue();
  private readonly initializer: GameInitializer;
  private readonly testPlayers: Map<string, TestPlayer> = new Map<string, TestPlayer>();
  private runError: unknown = undefined;
  private hasStarted = false;
  private hasFinished = false;

  public constructor(private readonly options: CreateGameOptions = {}) {
    const playerNames = options.players ?? ['Alice', 'Bob'];
    const kingdom = options.kingdom ?? [];
    const fillers = FILLER_KINGDOM_CARDS.filter((name) => !kingdom.includes(name));
    const requiredCardNames = [...kingdom, ...fillers.slice(0, Math.max(0, 10 - kingdom.length))];

    const logTransmitters = new Map<string, RecordingLogTransmitter>();
    const specifications = playerNames.map((name) => {
      const logTransmitter = new RecordingLogTransmitter();
      logTransmitters.set(name, logTransmitter);
      return new PlayerSpecification(
        name,
        new Client(new PuppetDecisionService(name, this.queue), logTransmitter, noOpGameMessageTransmitter),
      );
    });

    this.initializer = new GameInitializer(specifications, requiredCardNames, {
      useShelters: options.useShelters ?? false,
      useColoniesPlatinum: options.useColoniesPlatinum ?? false,
    });

    // Undo the random seating so tests know who sits where
    this.game
      .getPlayers()
      .getAllPlayers()
      .sort((a, b) => playerNames.indexOf(a.getName()) - playerNames.indexOf(b.getName()));

    for (const name of playerNames) {
      const testPlayer = new TestPlayer(name, this, logTransmitters.get(name)!);
      this.testPlayers.set(name, testPlayer);
      // Start with empty zones; tests set up exactly what they need
      testPlayer.setDeck([]);
    }
  }

  /** The real Game (players, logger, broadcaster). */
  public get game(): Game {
    return (this.initializer as unknown as { game: Game }).game;
  }

  /** The real SharedGameState (piles, trash, turns, effects). */
  public get state(): SharedGameState {
    return this.game.getGameState();
  }

  public player(name: string): TestPlayer {
    const testPlayer = this.testPlayers.get(name);
    if (testPlayer === undefined) {
      throw new Error(`No player named ${name}`);
    }
    return testPlayer;
  }

  public get alice(): TestPlayer {
    return this.player('Alice');
  }

  public get bob(): TestPlayer {
    return this.player('Bob');
  }

  public get currentPlayerName(): string {
    return this.state.getCurrentPlayer().getName();
  }

  public get isFinished(): boolean {
    return this.hasFinished;
  }

  /** The final result, once the game has ended. */
  public get gameResult(): GameResult | undefined {
    return this.state.getGameResult();
  }

  // --- supply and trash -------------------------------------------------------

  public get trash(): string[] {
    return cardNames(this.state.trash.asCardArray());
  }

  /** Replaces the trash with new cards. Returns the created cards. */
  public setTrash(names: string[]): Card[] {
    for (const card of this.state.trash.asCardArray()) {
      this.state.trash.removeCard(card);
    }
    return names.map((name) => {
      nextCardNumber++;
      const className = convertToClassName(name);
      const card = new CardFactory(this.state).createCard(
        className,
        `trash-${className}-${String(nextCardNumber)}`,
        CardLocation.TRASH,
      );
      this.state.trash.addCard(card);
      return card;
    });
  }

  /** The current cost of the top card of a pile, including cost changes such as Bridge or Highway. */
  public costOf(pileName: string): Cost {
    const topCard = this.state.piles.getTopCardOfPile(pileName);
    if (topCard === undefined) {
      throw new Error(`Pile ${pileName} is empty or doesn't exist`);
    }
    return this.state.cost(topCard);
  }

  public pileSize(pileName: string): number {
    return this.state.piles.getPileSizeByName(pileName);
  }

  /** Removes cards from the top of a pile until it has `size` cards. */
  public setPileSize(pileName: string, size: number): void {
    while (this.pileSize(pileName) > size) {
      this.state.piles.removeTopCardFromPile(pileName);
    }
  }

  public hasPile(pileName: string): boolean {
    return this.state.piles.isPile(pileName);
  }

  /** The cards in a pile, top card first. */
  public pileCards(pileName: string): string[] {
    const pile = this.state.piles.allPiles.getPileByName(pileName);
    return pile === undefined ? [] : cardNames([...pile.asCardArray()].reverse());
  }

  /**
   * Replaces a pile's contents with new cards (top card first), e.g. to choose which Ruins or Knight is on top.
   * Returns the created cards (top first).
   */
  public setPile(pileName: string, names: string[]): Card[] {
    if (!this.hasPile(pileName)) {
      throw new Error(`No pile named ${pileName}`);
    }
    this.setPileSize(pileName, 0);
    const isSupplyPile = this.state.piles.isSupplyPile(pileName);
    const created = names.map((name) => {
      nextCardNumber++;
      const className = convertToClassName(name);
      const card = new CardFactory(this.state).createCard(
        className,
        `${pileName}-pile-${className}-${String(nextCardNumber)}`,
        CardLocation.PILE,
      );
      if (isSupplyPile) {
        card.markAsSupplyCard();
      }
      return card;
    });
    for (const card of [...created].reverse()) {
      this.state.piles.returnCardToPile(card);
    }
    return created;
  }

  // --- running the game -------------------------------------------------------

  /**
   * Starts the first turn (the first listed player's) and runs until the first decision.
   * `beforeFirstTurn` runs just before the turn starts (after the statistics reset), e.g. to give extra Actions.
   */
  public async start(beforeFirstTurn?: () => void): Promise<PendingDecision | undefined> {
    if (this.hasStarted) {
      throw new Error('The game has already started');
    }
    this.hasStarted = true;
    if (this.options.resetStatisticsBeforeStart ?? true) {
      for (const player of this.game.getPlayers().getAllPlayers()) {
        player.getStatistics().reset();
      }
    }
    if (beforeFirstTurn !== undefined) {
      // The engine resets every player's statistics when the game starts, so run the hook after the last reset
      const players = this.game.getPlayers().getAllPlayers();
      const lastStatistics = players[players.length - 1].getStatistics();
      const originalReset = lastStatistics.reset.bind(lastStatistics);
      lastStatistics.reset = () => {
        originalReset();
        lastStatistics.reset = originalReset;
        beforeFirstTurn();
      };
    }
    this.state.startGame().then(
      () => {
        this.hasFinished = true;
        this.queue.notify();
      },
      (error: unknown) => {
        this.runError = error;
        this.queue.notify();
      },
    );
    return this.settle();
  }

  /** Waits until the game is paused at a decision or has ended. Rethrows any error the game threw. */
  private async settle(): Promise<PendingDecision | undefined> {
    while (this.queue.pending === undefined && !this.hasFinished && this.runError === undefined) {
      await this.queue.waitForChange();
    }
    if (this.runError !== undefined) {
      throw this.runError instanceof Error ? this.runError : new Error(JSON.stringify(this.runError));
    }
    return this.queue.pending;
  }

  /** The decision the game is waiting on. Throws if there is none. */
  public get pending(): PendingDecision {
    const decision = this.queue.pending;
    if (decision === undefined) {
      throw new Error(this.hasFinished ? 'The game is over' : 'No decision is pending');
    }
    return decision;
  }

  /** A readable description of the pending decision, for debugging. */
  public describePending(): string {
    return this.queue.pending === undefined ? '(no pending decision)' : describeDecision(this.queue.pending);
  }

  /** Answers the pending decision with any choice, then runs until the next decision. */
  public async respond(choice: Choice): Promise<PendingDecision | undefined> {
    this.queue.take().resolve(choice);
    return this.settle();
  }

  /** Checks the pending decision's kind (and optionally whose it is) and returns it. */
  public expectDecision(kinds: DecisionKind | DecisionKind[], playerName?: string): PendingDecision {
    const decision = this.pending;
    const allowedKinds = Array.isArray(kinds) ? kinds : [kinds];
    if (!allowedKinds.includes(decision.kind) || (playerName !== undefined && decision.playerName !== playerName)) {
      throw new Error(
        `Expected ${playerName ?? 'a player'} to face ${allowedKinds.join(' or ')}, but the pending decision is: ${describeDecision(decision)}`,
      );
    }
    return decision;
  }

  private findCardChoice(
    decision: PendingDecision,
    card: string | Card,
    location?: CardLocation,
    exclude: Set<string> = new Set<string>(),
  ): CardChoice {
    const match = decision.cardChoices.find(
      (choice) =>
        !exclude.has(choice.card.id) &&
        (typeof card === 'string'
          ? choice.card.name === card || choice.card.displayName === card
          : choice.card.id === card.getId()) &&
        (location === undefined || choice.card.location === location),
    );
    if (match === undefined) {
      const wanted = typeof card === 'string' ? card : `${card.getName()} (${card.getId()})`;
      throw new Error(
        `${wanted}${location === undefined ? '' : ` in ${location}`} was not offered. Pending decision: ${describeDecision(decision)}`,
      );
    }
    return match;
  }

  // --- action phase -----------------------------------------------------------

  /** Plays an Action card from hand during the action phase. */
  public async playAction(card: string | Card): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision('actionPhase');
    return this.respond(this.findCardChoice(decision, card));
  }

  public async endActionPhase(): Promise<PendingDecision | undefined> {
    this.expectDecision('actionPhase');
    return this.respond({ type: ChoiceType.EndActionPhase });
  }

  /** Ends the turn from the action, treasure or buy phase (clean-up still happens). */
  public async endTurn(): Promise<PendingDecision | undefined> {
    this.expectDecision(['actionPhase', 'treasurePhase', 'buyPhase']);
    return this.respond({ type: ChoiceType.EndTurn });
  }

  // --- buy phase --------------------------------------------------------------

  /** Plays one Treasure from hand. */
  public async playTreasure(card: string | Card): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision('treasurePhase');
    return this.respond(this.findCardChoice(decision, card, CardLocation.HAND));
  }

  /** Plays all simple Treasures (Copper, Silver, ...) from hand at once. */
  public async playAllTreasures(): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision('treasurePhase');
    if (decision.simpleTreasures === undefined) {
      throw new Error(`No simple-treasures option was offered: ${describeDecision(decision)}`);
    }
    return this.respond(decision.simpleTreasures);
  }

  /** Stops playing Treasures and moves on to buying. */
  public async endTreasurePhase(): Promise<PendingDecision | undefined> {
    this.expectDecision('treasurePhase');
    return this.respond({ type: ChoiceType.EndTreasurePhase });
  }

  /** Buys a card from the Supply (from the treasure or buy phase decision). */
  public async buy(cardName: string): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision(['treasurePhase', 'buyPhase']);
    return this.respond(this.findCardChoice(decision, cardName, CardLocation.PILE));
  }

  public async endBuyPhase(): Promise<PendingDecision | undefined> {
    this.expectDecision(['treasurePhase', 'buyPhase']);
    return this.respond({ type: ChoiceType.EndBuyPhase });
  }

  // --- card choices -----------------------------------------------------------

  /** Answers a single-card choice with a card (by name or exact instance), optionally from a given zone. */
  public async chooseCard(card: string | Card, location?: CardLocation): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision('chooseCard');
    return this.respond(this.findCardChoice(decision, card, location));
  }

  /** Declines a single-card choice or a "resolve which effect" prompt. Fails if declining wasn't offered. */
  public async chooseNone(): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision(['chooseCard', 'chooseFromMultipleEvents']);
    if (decision.kind === 'chooseCard' && !decision.noneAllowed) {
      throw new Error(`Choosing none was not offered: ${describeDecision(decision)}`);
    }
    return this.respond({ type: ChoiceType.None });
  }

  /** Answers a multi-card choice with these cards (by name or exact instance). */
  public async chooseCards(cards: (string | Card)[], location?: CardLocation): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision('chooseCards');
    const used = new Set<string>();
    const chosen = cards.map((card) => {
      const choice = this.findCardChoice(decision, card, location, used);
      used.add(choice.card.id);
      return choice.card;
    });
    if (decision.numSelectedEligibility.length > 0 && !decision.numSelectedEligibility.includes(chosen.length)) {
      throw new Error(`Choosing ${String(chosen.length)} cards is not allowed: ${describeDecision(decision)}`);
    }
    const choice: MultiCardChoice = { type: ChoiceType.MultiCard, cards: chosen };
    return this.respond(choice);
  }

  // --- named options ----------------------------------------------------------

  public async chooseOption(name: string): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision('chooseOneOption');
    if (!decision.options.includes(name)) {
      throw new Error(`Option "${name}" was not offered: ${describeDecision(decision)}`);
    }
    const choice: NamedChoice = { type: ChoiceType.ChooseOne, name };
    return this.respond(choice);
  }

  public async chooseOptions(names: string[]): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision('chooseMultipleOptions');
    for (const name of names) {
      if (!decision.options.includes(name)) {
        throw new Error(`Option "${name}" was not offered: ${describeDecision(decision)}`);
      }
    }
    const choice: MultiNamedChoice = { type: ChoiceType.ChooseMultiple, names };
    return this.respond(choice);
  }

  // --- triggered effects ------------------------------------------------------

  /**
   * Resolves a triggered effect (reaction, "when you gain", Duration, ...) by the name of the card
   * that owns it. Works for both optional and mandatory effects.
   */
  public async chooseEffect(ownerCardName: string): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision('chooseFromMultipleEvents');
    const effect = [...decision.optionalEffects, ...decision.mandatoryEffects].find(
      (choice) => choice.effectName === ownerCardName,
    );
    if (effect === undefined) {
      throw new Error(`No effect from ${ownerCardName} was offered: ${describeDecision(decision)}`);
    }
    return this.respond(effect);
  }

  /** Declines all remaining optional effects. Fails if any mandatory effect is still waiting. */
  public async declineEffects(): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision('chooseFromMultipleEvents');
    if (decision.mandatoryEffects.length > 0) {
      throw new Error(`Mandatory effects can't be declined: ${describeDecision(decision)}`);
    }
    return this.respond({ type: ChoiceType.None });
  }

  /** Takes a queued extra turn (e.g. Outpost) by its source card name. */
  public async chooseExtraTurn(sourceCardName: string): Promise<PendingDecision | undefined> {
    const decision = this.expectDecision('chooseExtraTurns');
    const extraTurn = decision.extraTurns.find((choice) => choice.card.name === sourceCardName);
    if (extraTurn === undefined) {
      throw new Error(`No extra turn from ${sourceCardName} was offered: ${describeDecision(decision)}`);
    }
    return this.respond(extraTurn);
  }
}

export const createGame = (options: CreateGameOptions = {}): GameHarness => new GameHarness(options);
