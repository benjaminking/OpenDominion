import {
  CardChoice,
  CardLocation,
  CardMetadata,
  CardSelectionPurpose,
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
import { CardPlayOptions } from '../CardPlayOptions';
import { CostChangeTrigger } from '../effects/CostChangeTrigger';
import { CostModifier } from '../effects/CostModifier';
import { Effect } from '../effects/Effect';
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
import { isActionCard, isSupplyCard, isTreasureCard } from '../StandardCardEligibilityFunctions';
import { Trash } from '../Trash';
import { ExtraTurn } from '../turns/ExtraTurn';
import { Turn } from '../turns/Turn';
import { TurnPhase } from '../turns/TurnPhase';
import { TurnType } from '../turns/TurnType';
import { CardCostCache } from './CardCostCache';
import { MechanicsInUse } from './MechanicsInUse';
import { SetupRule } from './SetupRule';

export class SharedGameState {
  private readonly messageBroadcaster: GameMessageBroadcaster;
  private readonly logger: Logger;
  private _turnPhase: TurnPhase = TurnPhase.ACTION;
  private previousTurns: Turn[] = [];
  private costModifiers: CostModifier[] = [];
  private extraCards: CardCollection = new CardCollection();
  private _trash: Trash;
  private gameResult: GameResult | undefined = undefined;
  private setupRules: Map<string, SetupRule> = new Map<string, SetupRule>();
  private _piles: Piles = new Piles();
  private _cardCostCache: CardCostCache = new CardCostCache();
  private readonly mechanicsInUse: MechanicsInUse;

  constructor(private readonly game: Game) {
    this.messageBroadcaster = game.getMessageBroadcaster();
    this.logger = game.getLogger();
    this._trash = new Trash(this.messageBroadcaster);
    this.mechanicsInUse = new MechanicsInUse(this.messageBroadcaster);
  }

  public get piles(): Piles {
    return this._piles;
  }

  public registerCardMechanics(card: Card): void {
    card.registerUsedMechanics(this.mechanicsInUse);
  }

  public addSetupRule(cardName: string, setupRule: SetupRule): void {
    this.setupRules.set(cardName, setupRule);
  }

  public async prepareForStartOfGame(): Promise<void> {
    this.applySetupRules();
    await this.drawInitialHands();
  }

  private applySetupRules(): void {
    for (const setupRule of this.setupRules.values()) {
      setupRule.applySetupRules(this);
    }
  }

  public async startGame(): Promise<void> {
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

  private async drawInitialHands(): Promise<void> {
    await this.executeForEachPlayer(async (ie: InstructionExecutor) => {
      await ie.drawCards(this.numCardsToDrawAtEndOfTurn);
    });
  }

  private async switchToNextTurn(): Promise<void> {
    if (this.doesAnyPlayerHaveExtraTurnsQueued()) {
      // TODO: if multiple players have extra turns, go in turn order
      for (const player of this.getCurrentTurnOrder()) {
        if (player.getEffects().hasExtraTurnsQueued()) {
          const extraTurn: ExtraTurn | undefined = await player.getInstructionExecutor().chooseExtraTurn();
          if (extraTurn === undefined) {
            player.getEffects().clearExtraTurns();
          } else {
            if (player.getName() !== this.getCurrentPlayer().getName()) {
              this.switchToPlayer(player);
            }
            player.getEffects().removeExtraTurnFromQueue(extraTurn);
            await this.startTurn(TurnType.EXTRA);
            break;
          }
        }
      }
    } else {
      this.switchCurrentPlayer();
      return this.startTurn(TurnType.STANDARD);
    }
  }

  private doesAnyPlayerHaveExtraTurnsQueued(): boolean {
    for (const player of this.game.getPlayers()) {
      if (player.getEffects().hasExtraTurnsQueued()) {
        return true;
      }
    }
    return false;
  }

  public getTurnPhase(): TurnPhase {
    return this._turnPhase;
  }
  public setTurnPhase(value: TurnPhase): void {
    this._turnPhase = value;
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

  private isTreasurePhase(): boolean {
    return (
      this.getTurnPhase() === TurnPhase.BUY &&
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

  public async performCleanup() {
    this.setTurnPhase(TurnPhase.CLEANUP);

    await this.triggerEffect(EffectTriggerType.BUY_END, this.getCurrentPlayer());
    await this.triggerEffect(EffectTriggerType.CLEANUP_START, this.getCurrentPlayer());
    await this.getCurrentPlayer().getOwnedCards().discardAllFromInPlay();
    await this.getCurrentPlayer().getOwnedCards().discardHand();
    await this.getCurrentPlayer().getOwnedCards().drawCards(this.numCardsToDrawAtEndOfTurn);
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
      this.cardsPlayedThisTurn.clear();
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

    this.getCurrentPlayer().getStatistics().spendCoins(card.getCost().coins);
    this.getCurrentPlayer().getStatistics().useBuy();

    this.logger.gameMessage(
      this.getCurrentPlayer(),
      ServerLogMessage.publicMessage(this.getCurrentPlayer(), 'buys %c', card),
    );

    // TODO: does anything rely on passing the pile name here?
    await this.triggerEffect(EffectTriggerType.BUY, this.getCurrentPlayer());
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

  public cardsPlayedThisTurn: CardCollection = new CardCollection();
  public addPlayedCard(card: Card): void {
    this.cardsPlayedThisTurn.addCard(card);
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
    return cost;
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

  public async triggerEffect(triggerType: EffectTriggerType, triggeringPlayer: Player, cards?: Card | CardCollection) {
    this.checkCostModifierTriggers(triggerType, cards);

    if (!this.usedEffectTypes.has(triggerType)) {
      return;
    }
    if (
      this.usedEffectTypes.get(triggerType)!.has(EffectSource.ANYONE) ||
      (this.usedEffectTypes.get(triggerType)!.has(EffectSource.SELF) &&
        this.usedEffectTypes.get(triggerType)!.has(EffectSource.OTHER_PLAYER))
    ) {
      await this.processEffectsForAllPlayers(triggerType, triggeringPlayer, cards);
    } else if (this.usedEffectTypes.get(triggerType)!.has(EffectSource.OTHER_PLAYER)) {
      await this.processEffectsForOtherPlayers(triggerType, triggeringPlayer, cards);
    } else {
      await this.processEffectsForCurrentPlayer(triggerType, triggeringPlayer, cards);
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
    cards: Card | CardCollection | undefined,
  ): Promise<void> {
    for (const player of this.getCurrentTurnOrder()) {
      await player.getEffects().processEffectsByType(triggerType, triggeringPlayer, cards);
    }
  }

  public async processEffectsForOtherPlayers(
    triggerType: EffectTriggerType,
    triggeringPlayer: Player,
    cards: Card | CardCollection | undefined,
  ): Promise<void> {
    for (const player of this.getCurrentTurnOrder()) {
      if (player.getName() === this.getCurrentPlayer().getName()) {
        continue;
      }
      await player.getEffects().processEffectsByType(triggerType, triggeringPlayer, cards);
    }
  }

  public async processEffectsForCurrentPlayer(
    triggerType: EffectTriggerType,
    triggeringPlayer: Player,
    cards: Card | CardCollection | undefined,
  ): Promise<void> {
    await this.getCurrentPlayer().getEffects().processEffectsByType(triggerType, triggeringPlayer, cards);
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
    const playerNamesWithCards = new Set<string>();
    const chosenCards: Card[] = [];
    for (const player of this.getCurrentTurnOrder()) {
      const ie = player.getInstructionExecutor();
      const chosenCard: Card | Choice = await ie
        .chooseCard('Choose a card to pass to the left.')
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.OTHER)
        .choose();
      if (chosenCard instanceof Card) {
        playerNamesWithCards.add(player.getName());
        chosenCards.push(chosenCard);
      }
    }

    let index = 0;
    for (const player of this.getCurrentTurnOrder()) {
      if (!playerNamesWithCards.has(player.getName())) {
        continue;
      }
      const cardToReceive = chosenCards[index > 0 ? index - 1 : chosenCards.length - 1];
      player.getInstructionExecutor().receivePassedCard(cardToReceive);
      index++;
    }
  }

  public async trashCards(player: Player, cards: CardCollection): Promise<CardCollection> {
    for (const card of cards) {
      this.putCardInTrash(card);
      player.getBotStatistics().removeCardFromStatistics(card);
    }

    this.logger.gameMessage(player, ServerLogMessage.publicMessage(player, 'trashes %c', cards));
    await this.triggerEffect(EffectTriggerType.TRASH, player, cards);
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
      return this.piles.getTopCardsOfSupplyPiles().getCardByMetadata(cardMetadata);
    }
    if (cardMetadata.location === CardLocation.TRASH) {
      return this.trash.getCardByMetadata(cardMetadata);
    }
    return this.getCurrentPlayer().getOwnedCards().getCardByMetadata(cardMetadata);
  }

  public getAllExtraCards(): CardCollection {
    return this.extraCards;
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
