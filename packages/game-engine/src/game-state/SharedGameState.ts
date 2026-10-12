import {
  CardChoice,
  CardLocation,
  CardMetadata,
  CardSelectionPurpose,
  CardType,
  Choice,
  ChoiceType,
  GameResult,
  isCardChoice,
  isEndBuyPhaseChoice,
  isEndTreasurePhaseChoice,
  isEndTurnChoice,
  isSimpleTreasuresChoice,
  SimpleTreasuresChoice,
  StatusAction,
} from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardFactory } from '../card/CardFactory';
import { Cost } from '../card/Cost';
import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { CardPlayOptions } from '../CardPlayOptions';
import { CostChangeTrigger } from '../effects/CostChangeTrigger';
import { CostModifier } from '../effects/CostModifier';
import { Effect } from '../effects/Effect';
import { EffectContext, EffectContextBuilder } from '../effects/EffectContext';
import { EffectSource } from '../effects/EffectSource';
import { EffectTriggerType } from '../effects/EffectTriggerType';
import { TurnEligibility } from '../effects/TurnEligibility';
import { EndGameScorer } from '../EndGameScorer';
import { Game } from '../Game';
import { Logger } from '../logging/Logger';
import { ServerLogMessage } from '../logging/ServerLogMessage';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { PlayerNameStatus } from '../messaging/Status';
import { Piles } from '../piles/Piles';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { Player } from '../players/Player';
import { cardNameIs, isActionCard, isSupplyCard, isTreasureCard } from '../StandardCardEligibilityFunctions';
import { Trash } from '../Trash';
import { ExtraTurn } from '../turns/ExtraTurn';
import { Turn } from '../turns/Turn';
import { TurnPhase } from '../turns/TurnPhase';
import { TurnType } from '../turns/TurnType';
import { CardCostCache } from './CardCostCache';
import { Clock } from './Clock';
import { LocationExpectation } from './LocationExpectation';
import { MechanicsInUse } from './MechanicsInUse';
import { TimeStamp } from './TimeStamp';

export class SharedGameState {
  private readonly messageBroadcaster: GameMessageBroadcaster;
  private readonly logger: Logger;
  private readonly _clock: Clock = new Clock();
  private _turnPhase: TurnPhase = TurnPhase.ACTION;
  private previousTurns: Turn[] = [];
  private costModifiers: CostModifier[] = [];
  private extraCards: CardCollection = new CardCollection();
  private _trash: Trash;
  private gameResult: GameResult | undefined = undefined;
  private _piles: Piles = new Piles();
  private _cardCostCache: CardCostCache = new CardCostCache();
  private readonly mechanicsInUse: MechanicsInUse;
  private readonly numEffectsBlockingCardMoveById: Map<string, number> = new Map<string, number>();

  constructor(private readonly game: Game) {
    this.messageBroadcaster = game.getMessageBroadcaster();
    this.logger = game.getLogger();
    this._trash = new Trash(this.messageBroadcaster);
    this.mechanicsInUse = new MechanicsInUse(this.messageBroadcaster);
  }

  public getCurrentTimeStamp(): TimeStamp {
    return this._clock.createTimeStamp();
  }

  // The clock ticks every time something happens (a card moves, or something triggers effects), so a location
  // expectation created at one moment can tell whether a card has moved since
  public advanceTime(): void {
    this._clock.advanceTime();
  }

  public get piles(): Piles {
    return this._piles;
  }

  public registerCardMechanics(card: Card): void {
    card.registerUsedMechanics(this.mechanicsInUse);
  }

  public async prepareForStartOfGame(): Promise<void> {
    await this.drawInitialHands();
  }

  public async startGame(): Promise<void> {
    // Every later turn starts with these values because they are reset at the end of the previous turn
    for (const player of this.game.getPlayers()) {
      player.getStatistics().reset();
    }
    await this.startTurn(TurnType.STANDARD);
  }

  public communicateInitialState(): void {
    this.mechanicsInUse.forceBroadcast();
    this.communicatePlayersToClients();
    this.communicatePilesToClients();
  }

  private communicatePlayersToClients(): void {
    this.messageBroadcaster.sendPlayerNames();
  }

  private communicatePilesToClients(): void {
    this.piles.communicateInitialState();
  }

  private forceFullBroadcast(): void {
    this.piles.forceFullBroadcast();
    for (const player of this.game.getPlayers()) {
      player.getOwnedCards().forceFullBroadcast();
    }
  }

  private _currentPlayerIndex = 0;
  public switchCurrentPlayer(): void {
    this._currentPlayerIndex = (this._currentPlayerIndex + 1) % this.game.getPlayers().numTotalPlayers();
  }

  public switchToPlayer(player: Player): void {
    this._currentPlayerIndex = this.game.getPlayerIndex(player);
  }

  public getCurrentPlayer(): Player {
    return this.game.getPlayers().getPlayerAtIndex(this._currentPlayerIndex);
  }

  public getPlayerLeftOfCurrent(): Player {
    return this.game.getPlayers().getPlayerToTheLeftByName(this.getCurrentPlayer().getName());
  }

  public getPlayerRightOfCurrent(): Player {
    return this.game.getPlayers().getPlayerToTheRightByName(this.getCurrentPlayer().getName());
  }

  public getPlayerLeftOfPlayer(player: Player): Player {
    return this.game.getPlayers().getPlayerToTheLeftByName(player.getName());
  }

  public getCurrentTurn(): Turn {
    return this.getCurrentPlayer().getTurnTracker().getCurrentTurn();
  }

  public getNumPlayers(): number {
    return this.game.getPlayers().numTotalPlayers();
  }

  // this is one round of the turn order starting with the current player
  public getCurrentTurnOrder(): Player[] {
    const turnOrder: Player[] = [];
    for (let k = 0; k < this.game.getPlayers().numTotalPlayers(); ++k) {
      turnOrder.push(
        this.game
          .getPlayers()
          .getPlayerAtIndex((this._currentPlayerIndex + k) % this.game.getPlayers().numTotalPlayers()),
      );
    }
    return turnOrder;
  }

  public getPreviousTurns(): Turn[] {
    return this.previousTurns;
  }

  public blockCardFromMoving(card: Card): void {
    if (!this.numEffectsBlockingCardMoveById.has(card.getId())) {
      this.numEffectsBlockingCardMoveById.set(card.getId(), 0);
    }
    this.numEffectsBlockingCardMoveById.set(card.getId(), this.numEffectsBlockingCardMoveById.get(card.getId())! + 1);
  }

  public releaseCardToMoveAgain(card: Card): void {
    const numEffectsBlockingCardMove = this.numEffectsBlockingCardMoveById.get(card.getId());
    if (numEffectsBlockingCardMove === undefined || numEffectsBlockingCardMove <= 0) {
      return;
    }
    this.numEffectsBlockingCardMoveById.set(card.getId(), numEffectsBlockingCardMove - 1);
  }

  public isCardAbleToMove(card: Card): boolean {
    return (
      !this.numEffectsBlockingCardMoveById.has(card.getId()) ||
      this.numEffectsBlockingCardMoveById.get(card.getId())! <= 0
    );
  }

  private async drawInitialHands(): Promise<void> {
    await this.executeForEachPlayer(async (ie: InstructionExecutor) => {
      await ie.drawCards(this.numCardsToDrawAtEndOfTurn);
    });
  }

  private async switchToNextTurn(): Promise<void> {
    for (const player of this.getCurrentTurnOrder()) {
      // An extra turn that can't happen (e.g. a 3rd turn in a row) fails now, in between turns, so the card
      // that gave it has nothing left to do and is discarded in the next Clean-up
      for (const failedExtraTurn of player.getEffects().removeExtraTurnsThatCannotHappen(this.previousTurns)) {
        failedExtraTurn.getInitiator().markAsFinished();
      }
      if (!player.getEffects().hasExtraTurnsQueued()) {
        continue;
      }
      const extraTurn: ExtraTurn | undefined = await player.getInstructionExecutor().chooseExtraTurn();
      if (extraTurn === undefined) {
        player.getEffects().clearExtraTurns();
        continue;
      }
      if (player.getName() !== this.getCurrentPlayer().getName()) {
        this.switchToPlayer(player);
      }
      player.getEffects().removeExtraTurnFromQueue(extraTurn);
      return this.startTurn(TurnType.EXTRA);
    }

    this.switchCurrentPlayer();
    return this.startTurn(TurnType.STANDARD);
  }

  public getTurnPhase(): TurnPhase {
    return this._turnPhase;
  }
  public setTurnPhase(value: TurnPhase): void {
    this._turnPhase = value;
    for (const player of this.getCurrentTurnOrder()) {
      player.getTurnTracker().updateTurnPhase(value);
    }
  }

  private async startTurn(turnType: TurnType): Promise<void> {
    this.messageBroadcaster.sendTurnStartMessage(this.getCurrentPlayer());
    this.messageBroadcaster.sendStatus(new PlayerNameStatus('%q turn', this.getCurrentPlayer()), StatusAction.REPLACE);

    if (turnType === TurnType.STANDARD) {
      this.getCurrentPlayer().getTurnTracker().startNewStandardTurn();
    } else {
      this.getCurrentPlayer().getTurnTracker().startNewExtraTurn();
    }
    this.logger.gameMessage(
      this.getCurrentPlayer(),
      ServerLogMessage.turnStartMessage(
        this.getCurrentPlayer(),
        this.getCurrentPlayer().getTurnTracker().getCurrentTurn().getNumber(),
      ),
    );

    this.recalculateCosts();

    for (const player of this.getCurrentTurnOrder()) {
      player.getEffects().registerStartOfPlayersTurn(this.getCurrentPlayer(), this.getCurrentTurn());
    }

    this.setTurnPhase(TurnPhase.ACTION);
    await this.triggerEffect(EffectTriggerType.TURN_START, this.getCurrentPlayer());
    return this.startActionPhase();
  }

  private async startActionPhase(): Promise<void> {
    this.setTurnPhase(TurnPhase.ACTION);
    return this.actionPhaseLoop();
  }

  private async actionPhaseLoop(): Promise<void> {
    if (
      this.getCurrentPlayer().getStatistics().getActions() >
        0 /*|| this.gameState.villagers > 0 && numMatchingCardsInCollection(gameState.hand, cardNameIs('mimic')) > 0*/ &&
      this.getCurrentPlayer().getOwnedCards().hasMatchingCardInHand(isActionCard)
    ) {
      const choices: CardChoice[] = this.getCurrentPlayer()
        .getInstructionExecutor()
        .getEligibleCardChoices(new Set<CardLocation>([CardLocation.HAND]), isActionCard);
      const choice: Choice = await this.getCurrentPlayer().getDecisionService().makeActionPhaseChoice(choices);
      if (choice.type === ChoiceType.Card) {
        const card: Card | undefined = this.getCardByMetadata((choice as CardChoice).card);
        if (card !== undefined) {
          await this.getCurrentPlayer().getInstructionExecutor().playCardFromHand(card);
        }
        return this.actionPhaseLoop();
      } else if (choice.type === ChoiceType.EndTurn) {
        return this.performCleanup();
      } else if (choice.type === ChoiceType.EndActionPhase) {
        return this.startBuyPhase();
      }
    } else {
      return this.startBuyPhase();
    }
  }

  private async startBuyPhase(): Promise<void> {
    this.setTurnPhase(TurnPhase.BUY);

    await this.triggerEffect(EffectTriggerType.BUY_START, this.getCurrentPlayer());
    return this.buyPhaseLoop();
  }

  private async startBuyPhaseIfNecessary(): Promise<void> {
    if (this.getTurnPhase() === TurnPhase.ACTION) {
      return this.startBuyPhase();
    }
  }

  private async buyPhaseLoop(): Promise<void> {
    if (this.isBuyPhaseOver()) {
      return this.performCleanup();
    } else if (this.isTreasurePhase()) {
      return this.makeTreasurePhaseChoice();
    } else {
      return this.makeBuyPhaseChoice();
    }
  }

  private isBuyPhaseOver(): boolean {
    return this.getCurrentPlayer().getStatistics().getBuys() === 0;
  }

  // Once a card has been bought, no more Treasures can be played this turn
  private isTreasurePhase(): boolean {
    return (
      this.getTurnPhase() === TurnPhase.BUY &&
      !this.getCurrentPlayer().getTurnTracker().hasBoughtCardThisTurn() &&
      this.getCurrentPlayer().getOwnedCards().hasMatchingCardInHand(isTreasureCard)
      // originally both(isTreasureCard, not(hasPlayRestriction))
    );
  }

  private async makeTreasurePhaseChoice(): Promise<void> {
    const cardChoices: CardChoice[] = this.getTreasurePhaseCardChoices();
    const simpleTreasureChoice = {
      type: ChoiceType.SimpleTreasures,
      coins: this.getCurrentPlayer().getOwnedCards().calculateSimpleTreasureCoinsInHand(),
      potions: this.getCurrentPlayer().getOwnedCards().calculateSimpleTreasurePotionsInHand(),
    } as SimpleTreasuresChoice;

    const treasurePhaseChoice: Choice = await this.getCurrentPlayer()
      .getDecisionService()
      .makeTreasurePhaseChoice(cardChoices, simpleTreasureChoice);
    return this.buyPhaseLoopCallback(treasurePhaseChoice);
  }

  private getTreasurePhaseCardChoices(): CardChoice[] {
    const handCardChoices: CardChoice[] = this.getCurrentPlayer()
      .getInstructionExecutor()
      .getEligibleCardChoices(new Set<CardLocation>([CardLocation.HAND]), isTreasureCard);
    const supplyCardChoices: CardChoice[] = this.getAffordableSupplyChoices();

    return [...handCardChoices, ...supplyCardChoices];
  }

  private async makeBuyPhaseChoice(): Promise<void> {
    const supplyChoices: CardChoice[] = this.getAffordableSupplyChoices();
    const buyPhaseChoice: Choice = await this.getCurrentPlayer()
      .getDecisionService()
      .makeBuyPhaseChoice(
        supplyChoices,
        this.getCurrentPlayer().getStatistics().getBuys(),
        this.getCurrentPlayer().getStatistics().getCoins(),
        this.getCurrentPlayer().getStatistics().getPotions(),
      );
    return this.buyPhaseLoopCallback(buyPhaseChoice);
  }

  private getAffordableSupplyChoices(): CardChoice[] {
    return this.piles.getEligibleCardChoicesToBuy().filter((choice) => this.canBuyCard(choice.card));
  }

  private async buyPhaseLoopCallback(choice: Choice): Promise<void> {
    if (isSimpleTreasuresChoice(choice)) {
      await this.startBuyPhaseIfNecessary();
      await this.getCurrentPlayer().getInstructionExecutor().playSimpleTreasures();
      return this.buyPhaseLoop();
    } else if (isEndTurnChoice(choice)) {
      return this.performCleanup();
    } else if (isEndBuyPhaseChoice(choice)) {
      // eventually transition to night phase here
      return this.performCleanup();
    } else if (isEndTreasurePhaseChoice(choice)) {
      return this.makeBuyPhaseChoice();
    } else if (isCardChoice(choice) && choice.card.location === CardLocation.HAND) {
      const card: Card | undefined = this.getCardByMetadata(choice.card);
      if (card !== undefined) {
        await this.getCurrentPlayer().getInstructionExecutor().playCardFromHand(card, CardPlayOptions.DONT_USE_ACTION);
      }
      return this.buyPhaseLoop();
    } else if (isCardChoice(choice) && this.canBuyCard(choice.card)) {
      const card: Card | undefined = this.getCardByMetadata(choice.card);
      if (card !== undefined) {
        await this.buyFromPile(card.getPileName());
      }
      return this.buyPhaseLoop();
    } else {
      this.getCurrentPlayer().getStatistics().useBuy(); // To handle bots who keep sending cards they can't buy
      return this.buyPhaseLoop();
    }
  }

  private canBuyCard(cardMetadata: CardMetadata): boolean {
    if (cardMetadata.location !== CardLocation.PILE) {
      return false;
    }
    const card: Card | undefined = this.getCardByMetadata(cardMetadata);
    if (!card?.matches(isSupplyCard)) {
      return false;
    }
    /* || isEventName(choice.getName()) || isProjectName(choice.getName())*/
    return (
      card.canBeBought(this.getCurrentPlayer().getInstructionExecutor()) &&
      this.getCurrentPlayer().getStatistics().canAfford(this.cost(card))
    );
  }

  public isCopyOfCardOnTopOfPile(card: Card | string, pileName: string): boolean {
    const topCard: Card | undefined = this.piles.getTopCardOfPile(pileName);
    if (topCard === undefined) {
      return false;
    }
    if (typeof card === 'string') {
      return topCard.getName() === card || topCard.getDisplayName() === card;
    }
    return topCard.getName() === card.getName();
  }

  public isCardInPile(card: Card, pileName: string): boolean {
    return this.piles.isCardInPile(card, pileName);
  }

  public async performCleanup() {
    this.setTurnPhase(TurnPhase.CLEANUP);

    await this.triggerEffect(EffectTriggerType.BUY_END, this.getCurrentPlayer());
    await this.triggerEffect(EffectTriggerType.CLEANUP_START, this.getCurrentPlayer());

    // Cards other players played this turn (e.g. Guard Dog) are discarded too, unless they have more to do
    for (const player of this.getCurrentTurnOrder()) {
      await player.getOwnedCards().discardAllFromInPlay();
    }
    await this.getCurrentPlayer().getOwnedCards().discardHand();
    await this.getCurrentPlayer()
      .getOwnedCards()
      .drawCards(this.getCurrentPlayer().getTurnTracker().getNumCardsToDrawInCleanup(this.numCardsToDrawAtEndOfTurn));
    await this.triggerEffect(EffectTriggerType.TURN_END, this.getCurrentPlayer());
    await this.endTurn();
  }

  private async endTurn() {
    if (!this.isGameOver()) {
      for (const player of this.game.getPlayers().getAllPlayers()) {
        player.getTurnTracker().endTurn();
        player.getStatistics().reset();
        player.getEffects().registerEndOfPlayersTurn(this.getCurrentPlayer(), this.getCurrentTurn());
        player.getEffects().removeExpiredEffects();
      }
      this.getCurrentPlayer().getEffects().removeIneligibleEffectsByTurn(this.getCurrentTurn().nextUnofficialTurn());
      this.removeIneligibleCostModifiers();

      this.previousTurns.push(this.getCurrentTurn());
      await this.switchToNextTurn();
    } else {
      this.endGame();
    }
  }

  private removeIneligibleCostModifiers(): void {
    const nextTurn = this.getCurrentTurn().nextUnofficialTurn();
    this.costModifiers = this.costModifiers.filter((item) => item.isEligibleOnTurn(nextTurn));
  }

  public async buyFromPile(pileName: string) {
    const card: Card | undefined = this.piles.getTopCardOfPile(pileName);
    if (card === undefined) {
      return;
    }

    const cost = card.getCost();
    this.getCurrentPlayer().getStatistics().spendCoins(cost.coins);
    this.getCurrentPlayer().getStatistics().spendPotions(cost.potions);
    this.getCurrentPlayer().getStatistics().useBuy();
    this.getCurrentPlayer().getTurnTracker().addBoughtCard(card);

    this.logger.gameMessage(
      this.getCurrentPlayer(),
      ServerLogMessage.publicMessage(this.getCurrentPlayer(), 'buys %c', card),
    );

    await this.triggerEffect(
      EffectTriggerType.BUY,
      this.getCurrentPlayer(),
      new EffectContextBuilder().withTargetCard(card).build(),
    );
    return this.getCurrentPlayer().getInstructionExecutor().gainFromPile(pileName);
  }

  private isGameOver(): boolean {
    // TODO: update for Fleet
    return this.piles.areGameEndingConditionsMet();
  }

  public get trash(): Trash {
    return this._trash;
  }

  private numCardsToDrawAtEndOfTurn = 5;
  public getNumCardsToDrawAtEndOfTurn(): number {
    return this.numCardsToDrawAtEndOfTurn;
  }

  public isTurnEligibilitySatisfied(turnEligibility: TurnEligibility): boolean {
    return turnEligibility.matches(this.getCurrentTurn());
  }

  // A global effect is copied once to each player's list of effects
  public addGlobalEffect(effect: Effect): void {
    this.registerEffectTrigger(effect.getTrigger(), effect.getSource());
    for (const player of this.getCurrentTurnOrder()) {
      player.getEffects().addEffect(effect);
    }
  }

  private usedEffectTypes: Map<EffectTriggerType, Set<EffectSource>> = new Map<EffectTriggerType, Set<EffectSource>>();
  public registerEffectTrigger(trigger: EffectTriggerType, source: EffectSource): void {
    if (!this.usedEffectTypes.has(trigger)) {
      this.usedEffectTypes.set(trigger, new Set<EffectSource>());
    }
    this.usedEffectTypes.get(trigger)!.add(source);
  }

  private activeEffectIDStack: Effect[] = [];
  public pushActiveEffectOntoStack(effect: Effect): void {
    this.activeEffectIDStack.push(effect);
  }
  public popActiveEffectOffOfStack(): Effect {
    if (this.activeEffectIDStack.length === 0) {
      throw new Error('Tried to pop an effect off the global stack when it was empty.');
    }
    return this.activeEffectIDStack.pop()!;
  }

  private _attackWasBlocked = false;
  public get attackWasBlocked() {
    return this._attackWasBlocked;
  }
  public set attackWasBlocked(value) {
    this._attackWasBlocked = value;
  }

  public cost(card: Card): Cost {
    let cost = card.getOriginalCost();
    const currentTurn = this.getCurrentTurn();
    const currentTurnPhase = this.getTurnPhase();
    for (const costModifier of this.costModifiers) {
      cost = costModifier.apply(card, cost, currentTurn, currentTurnPhase);
    }
    return card.adjustCost(cost, this.getCurrentPlayer().getInstructionExecutor());
  }

  public getScoreByName(playerName: string): number {
    return this.game.getPlayers().getPlayerByName(playerName)?.getStatistics().getScore() ?? 0;
  }

  public isSharedLocation(location: CardLocation): boolean {
    if (location === CardLocation.PILE || location === CardLocation.TRASH) {
      return true;
    }
    return false;
  }

  public getCardsFromArea(area: CardLocation): CardCollection {
    switch (area) {
      case CardLocation.HAND: {
        throw new Error('Trying to get a player-owned card collection from the shared game state');
      }
      case CardLocation.IN_PLAY: {
        throw new Error('Trying to get a player-owned card collection from the shared game state');
      }
      case CardLocation.DECK: {
        throw new Error('Trying to get a player-owned card collection from the shared game state');
      }
      case CardLocation.DISCARD: {
        throw new Error('Trying to get a player-owned card collection from the shared game state');
      }
      case CardLocation.TRASH: {
        return this.trash;
      }
      default: {
        return new CardCollection();
      }
    }
  }

  public async triggerEffect(
    triggerType: EffectTriggerType,
    triggeringPlayer: Player,
    effectContext: EffectContext = new EffectContextBuilder().build(),
  ): Promise<void> {
    this.advanceTime();
    this.checkCostModifierTriggers(triggerType, effectContext.getTargetCards());

    if (!this.usedEffectTypes.has(triggerType)) {
      return;
    }
    if (
      this.usedEffectTypes.get(triggerType)!.has(EffectSource.ANYONE) ||
      (this.usedEffectTypes.get(triggerType)!.has(EffectSource.SELF) &&
        this.usedEffectTypes.get(triggerType)!.has(EffectSource.OTHER_PLAYER))
    ) {
      await this.processEffectsForAllPlayers(triggerType, triggeringPlayer, effectContext);
    } else if (this.usedEffectTypes.get(triggerType)!.has(EffectSource.OTHER_PLAYER)) {
      await this.processEffectsForOtherPlayers(triggerType, triggeringPlayer, effectContext);
    } else {
      await this.processEffectsForTriggeringPlayer(triggerType, triggeringPlayer, effectContext);
    }
  }

  private checkCostModifierTriggers(triggerType: EffectTriggerType, cards?: Card | CardCollection): void {
    if (!this.costModifierTriggers.has(triggerType)) {
      return;
    }
    for (const trigger of this.costModifierTriggers.get(triggerType)!) {
      if (
        cards === undefined ||
        (cards instanceof Card && trigger.getCardEligibility().matches(cards)) ||
        (cards instanceof CardCollection && trigger.getCardEligibility().matchesAny(cards))
      ) {
        this.recalculateCosts();
        break;
      }
    }
  }

  public async processEffectsForAllPlayers(
    triggerType: EffectTriggerType,
    triggeringPlayer: Player,
    effectContext: EffectContext,
  ): Promise<void> {
    for (const player of this.getCurrentTurnOrder()) {
      await player.getEffects().processEffectsByType(triggerType, triggeringPlayer, effectContext);
    }
  }

  public async processEffectsForOtherPlayers(
    triggerType: EffectTriggerType,
    triggeringPlayer: Player,
    effectContext: EffectContext,
  ): Promise<void> {
    for (const player of this.getCurrentTurnOrder()) {
      if (player.getName() === triggeringPlayer.getName()) {
        continue;
      }
      await player.getEffects().processEffectsByType(triggerType, triggeringPlayer, effectContext);
    }
  }

  // The triggering player isn't always the current player, e.g. when an Attack makes another player trash a card
  public async processEffectsForTriggeringPlayer(
    triggerType: EffectTriggerType,
    triggeringPlayer: Player,
    effectContext: EffectContext,
  ): Promise<void> {
    await triggeringPlayer.getEffects().processEffectsByType(triggerType, triggeringPlayer, effectContext);
  }

  public addCostModifier(costModifier: CostModifier): void {
    this.costModifiers.push(costModifier);
    this.registerCostModifierTrigger(costModifier);
    this.recalculateCosts();
  }

  private costModifierTriggers = new Map<EffectTriggerType, CostChangeTrigger[]>();
  private registerCostModifierTrigger(costModifier: CostModifier): void {
    for (const trigger of costModifier.getCostRecalculationTriggers()) {
      if (!this.costModifierTriggers.has(trigger.getTriggerType())) {
        this.costModifierTriggers.set(trigger.getTriggerType(), []);
      }
      this.costModifierTriggers.get(trigger.getTriggerType())!.push(trigger);
    }
  }

  private recalculateCosts(): void {
    this._cardCostCache.startNewCostCheck();

    // TODO: consider keeping a list of all cards used in this game
    // so that we can iterate through that directly
    this.piles.reportCardCosts(this._cardCostCache);
    if (!this._cardCostCache.haveCostsChanged()) {
      for (const player of this.game.getPlayers().getAllPlayers()) {
        player.getOwnedCards().reportCardCosts(this._cardCostCache);
        if (this._cardCostCache.haveCostsChanged()) {
          break;
        }
      }
    }
    if (this._cardCostCache.haveCostsChanged()) {
      this.forceFullBroadcast();
    }
  }

  public clearBlocksForAttackCard(attackCard: Card): void {
    for (const player of this.getCurrentTurnOrder()) {
      player.getEffects().clearBlocksForAttackCard(attackCard);
    }
  }

  public async performAttack(
    attackingPlayer: Player,
    attackCard: Card,
    sharedInstruction: (attackedPlayer: Player, attackingPlayer: Player) => Promise<void>,
  ): Promise<void> {
    for (const player of this.getCurrentTurnOrder()) {
      if (player.getName() === attackingPlayer.getName()) {
        continue;
      }
      if (player.getEffects().isAttackBlocked(attackCard)) {
        continue;
      }
      await sharedInstruction(player, attackingPlayer);
    }
  }

  public async executeForEachPlayer(sharedInstruction: (ie: InstructionExecutor) => Promise<void>): Promise<void> {
    for (const player of this.getCurrentTurnOrder()) {
      await sharedInstruction(player.getInstructionExecutor());
    }
  }

  public async executeForEachOtherPlayer(sharedInstruction: (ie: InstructionExecutor) => Promise<void>): Promise<void> {
    for (const player of this.getCurrentTurnOrder()) {
      if (player.getName() === this.getCurrentPlayer().getName()) {
        continue;
      }
      await sharedInstruction(player.getInstructionExecutor());
    }
  }

  public async eachPlayerPassesACardToTheLeft(): Promise<void> {
    const passes: { passingPlayer: Player; card: Card }[] = [];
    for (const player of this.getCurrentTurnOrder()) {
      const ie = player.getInstructionExecutor();
      const chosenCard: Card | Choice = await ie
        .chooseCard('Choose a card to pass to the left.')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.OTHER)
        .choose();
      if (chosenCard instanceof Card) {
        passes.push({ passingPlayer: player, card: chosenCard });
      }
    }

    // All the cards are passed at once; players with no card in hand are skipped
    for (const pass of passes) {
      pass.passingPlayer.getOwnedCards().removeCardFromHand(pass.card);
      pass.passingPlayer.getBotStatistics().removeCardFromStatistics(pass.card);
    }
    for (let index = 0; index < passes.length; index++) {
      const receivingPlayer = passes[(index + 1) % passes.length].passingPlayer;
      receivingPlayer.getInstructionExecutor().receivePassedCard(passes[index].card);
    }
  }

  public async trashCards(player: Player, cards: CardCollection): Promise<CardCollection> {
    for (const card of cards) {
      this.putCardInTrash(card);
      player.getBotStatistics().removeCardFromStatistics(card);
    }

    this.logger.gameMessage(player, ServerLogMessage.publicMessage(player, 'trashes %c', cards));
    await this.triggerEffect(
      EffectTriggerType.TRASH,
      player,
      new EffectContextBuilder()
        .withTargetCards(cards)
        .withLocationExpectation(new LocationExpectation(CardLocation.TRASH, this.getCurrentTimeStamp()))
        .build(),
    );
    return cards;
  }

  private putCardInTrash(card: Card): void {
    this.trash.addCard(card);
    card.setLocation(CardLocation.TRASH);
  }

  public replaceCardsInPiles(cardName: string, replacementCardName: string): void {
    this.piles.replaceCardsInPiles(cardName, replacementCardName, new CardFactory(this));
  }

  public getCardByMetadata(cardMetadata: CardMetadata): Card | undefined {
    if (cardMetadata.location === CardLocation.PILE) {
      if (cardMetadata.types.includes(CardType.REWARD)) {
        return this.piles.getCardFromMetadata(cardMetadata, 'Rewards');
      }
      if (cardMetadata.types.includes(CardType.PRIZE)) {
        return this.piles.getCardFromMetadata(cardMetadata, 'Prizes');
      }
      return this.piles.getTopCardsOfSupplyPiles().getCardByMetadata(cardMetadata);
    }
    if (cardMetadata.location === CardLocation.TRASH) {
      return this.trash.getCardByMetadata(cardMetadata);
    }
    return this.getCurrentPlayer().getOwnedCards().getCardByMetadata(cardMetadata);
  }

  // One example of every card used in this game (in any pile, including empty ones, owned by a player, or in
  // the trash), e.g. for naming a card. The examples aren't in any zone; they are created once per name.
  public getAllExtraCards(): CardCollection {
    const cardNames = new Set<string>();
    for (const pile of this.piles.allPiles) {
      if (pile.size() === 0) {
        cardNames.add(pile.name);
      }
      for (const card of pile) {
        cardNames.add(card.getName());
      }
    }
    for (const player of this.game.getPlayers()) {
      for (const card of player.getOwnedCards().getAllCards()) {
        cardNames.add(card.getName());
      }
    }
    for (const card of this.trash) {
      cardNames.add(card.getName());
    }

    const cardFactory = new CardFactory(this);
    for (const cardName of cardNames) {
      if (this.extraCards.hasMatchingCard(cardNameIs(cardName))) {
        continue;
      }
      try {
        this.extraCards.addCard(cardFactory.createCard(cardName, 'example-' + cardName, CardLocation.PILE));
      } catch {
        // An empty special pile (e.g. Knights) is named after its randomizer, which isn't a card
      }
    }
    return this.extraCards.getMatchingCards(new CardEligibilityFunction((card: Card) => cardNames.has(card.getName())));
  }

  public getHighestScore(): number {
    return this.game.getPlayers().getHighestScore();
  }

  public getWinningPlayerName(): string {
    return this.game.getPlayers().getWinningPlayer().getName();
  }

  public endGame(): void {
    this.gameResult = this.createGameResult();
  }

  private createGameResult(): GameResult {
    const endGameScorer = new EndGameScorer();
    for (const player of this.game.getPlayers().getAllPlayers()) {
      const scoreReport = player.calculateScore();
      endGameScorer.addPlayerScoreReport(
        player.getName(),
        scoreReport,
        player.getTurnTracker().getCurrentTurn().getNumber(),
      );
    }

    return endGameScorer.getGameResult();
  }

  public getGameResult(): GameResult | undefined {
    return this.gameResult;
  }
}
