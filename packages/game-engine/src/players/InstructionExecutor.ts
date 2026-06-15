import {
  CardChoice,
  CardLocation,
  CardMetadata,
  CardSelectionPurpose,
  CardType,
  Choice,
  ChoiceType,
  ExtraTurnChoice,
  MultiCardChoice,
} from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardGroup } from '../card/CardGroup';
import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { CardPlayOptions } from '../CardPlayOptions';
import { TreasureCoinSortingFunction } from '../CardSortingFunctions';
import { ActionChoice } from '../decisions/ActionChoice';
import { CardChoiceBuilder } from '../decisions/CardChoiceBuilder';
import { CardMultiChoiceBuilder } from '../decisions/CardMultiChoiceBuilder';
import { CardSelectionLocation } from '../decisions/CardSelectionLocation';
import { ChooseMultipleOptionsBuilder } from '../decisions/ChooseMultipleOptionsBuilder';
import { ChooseOneOptionBuilder } from '../decisions/ChooseOneOptionBuilder';
import { Effect } from '../effects/Effect';
import { EffectExpiration } from '../effects/EffectExpiration';
import { EffectTriggerType } from '../effects/EffectTriggerType';
import {
  EndOfPlayersNextTurnEffectExpiration,
  OnceThisTurnEffectExpiration,
  StartOfPlayersNextTurnEffectExpiration,
} from '../effects/StandardEffectExpirations';
import { NextTurnEligibility, ThisTurnEligibility } from '../effects/StandardTurnEligibilityFunctions';
import { TurnEligibility } from '../effects/TurnEligibility';
import { SharedGameState } from '../game-state/SharedGameState';
import { Logger } from '../logging/Logger';
import { ServerLogMessage } from '../logging/ServerLogMessage';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { isSimpleTreasure, noCard } from '../StandardCardEligibilityFunctions';
import { exactlyNChecked } from '../StandardNumberEligibilityFunctions';
import { ExtraTurn } from '../turns/ExtraTurn';
import { ExtraTurnPrecondition } from '../turns/ExtraTurnPreconditions';
import { Player } from './Player';

export class InstructionExecutor {
  private readonly logger: Logger;
  private readonly messageBroadcaster: GameMessageBroadcaster;

  constructor(
    private readonly sharedGameState: SharedGameState,
    private readonly player: Player,
  ) {
    this.logger = this.player.getGame().getLogger();
    this.messageBroadcaster = this.player.getGame().getMessageBroadcaster();
  }

  public getSharedGameState(): SharedGameState {
    return this.sharedGameState;
  }

  public addActions(additionalActions: number): void {
    this.player.getStatistics().addActions(additionalActions);
  }

  public addBuys(additionalBuys: number): void {
    this.player.getStatistics().addBuys(additionalBuys);
  }

  public async addCoins(additionalCoins: number): Promise<void> {
    await this.player.getStatistics().addCoins(additionalCoins);
  }

  public subtractCoins(coinsToSubtract: number): void {
    this.player.getStatistics().subtractCoins(coinsToSubtract);
  }

  public addPotions(additionalPotions: number): void {
    this.player.getStatistics().addPotions(additionalPotions);
  }

  public addVP(vp: number): void {
    this.player.getStatistics().addVP(vp);
  }

  public chooseCard(prompt: string): CardChoiceBuilder {
    return new CardChoiceBuilder(this.player, prompt);
  }

  public chooseCards(prompt: string): CardMultiChoiceBuilder {
    return new CardMultiChoiceBuilder(this.player, prompt);
  }

  public chooseOneOption(prompt: string): ChooseOneOptionBuilder {
    return new ChooseOneOptionBuilder(this.player, prompt);
  }

  public chooseMultipleOptions(prompt: string): ChooseMultipleOptionsBuilder {
    return new ChooseMultipleOptionsBuilder(this.player, prompt);
  }

  public async chooseExtraTurn(): Promise<ExtraTurn | undefined> {
    const validExtraTurns: ExtraTurn[] = this.player
      .getEffects()
      .findValidExtraTurns(this.sharedGameState.getPreviousTurns());

    const choice: ExtraTurnChoice = await this.player
      .getDecisionService()
      .chooseExtraTurns(this.toExtraTurnChoices(validExtraTurns));
    for (const extraTurn of validExtraTurns) {
      if (extraTurn.doesChoiceMatch(choice)) {
        return extraTurn;
      }
    }
    return undefined;
  }

  private toExtraTurnChoices(extraTurns: ExtraTurn[]): ExtraTurnChoice[] {
    return extraTurns.map((et: ExtraTurn) => et.toExtraTurnChoice());
  }

  public async chooseDeckDepth(): Promise<number> {
    let choiceBuilder: ChooseOneOptionBuilder = this.chooseOneOption('How many cards down?');
    for (let depth = 0; depth <= this.handSize(); ++depth) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      choiceBuilder = choiceBuilder.from(new ActionChoice(depth.toFixed(), () => {}));
    }
    const choice: ActionChoice = await choiceBuilder.choose();
    return parseInt(choice.getName());
  }

  public handSize(): number {
    return this.player.getOwnedCards().getHand().size();
  }

  public hasMatchingCardInHand(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return this.player.getOwnedCards().hasMatchingCardInHand(cardEligibilityFunction);
  }

  public hasMatchingCardInPlay(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return this.player.getOwnedCards().hasMatchingCardInPlay(cardEligibilityFunction);
  }

  public hasPlayedMatchingCardThisTurn(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return this.player.getTurnTracker().hasPlayedMatchingCardThisTurn(cardEligibilityFunction);
  }

  public hasGainedMatchingCardThisTurn(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return this.player.getTurnTracker().hasGainedMatchingCardThisTurn(cardEligibilityFunction);
  }

  public numMatchingCardsInHand(cardEligibilityFunction: CardEligibilityFunction): number {
    return this.player.getOwnedCards().numMatchingCardsInHand(cardEligibilityFunction);
  }

  public numMatchingCardsInPlay(cardEligibilityFunction: CardEligibilityFunction): number {
    return this.player.getOwnedCards().numMatchingCardsInPlay(cardEligibilityFunction);
  }

  public numMatchingCardsPlayedThisTurn(cardEligibilityFunction: CardEligibilityFunction): number {
    return this.player.getTurnTracker().numMatchingCardsPlayedThisTurn(cardEligibilityFunction);
  }

  public numMatchingCardsGainedThisTurn(cardEligibilityFunction: CardEligibilityFunction): number {
    return this.player.getTurnTracker().numMatchingCardsGainedThisTurn(cardEligibilityFunction);
  }

  public getMatchingCardsInHand(cardEligibilityFunction: CardEligibilityFunction): CardCollection {
    return this.player.getOwnedCards().getMatchingCardsInHand(cardEligibilityFunction);
  }

  public getMatchingCardsInPlay(cardEligibilityFunction: CardEligibilityFunction): CardCollection {
    return this.player.getOwnedCards().getMatchingCardsInPlay(cardEligibilityFunction);
  }

  public getCardByMetadata(cardMetadata: CardMetadata): Card | undefined {
    if (this.sharedGameState.isSharedLocation(cardMetadata.location)) {
      return this.sharedGameState.getCardByMetadata(cardMetadata);
    }
    return this.player.getOwnedCards().getCardByMetadata(cardMetadata);
  }

  public getCardsByMetadata(cardsMetadata: CardMetadata[]): CardCollection {
    const cardCollection: CardCollection = new CardCollection();
    for (const cardMetadata of cardsMetadata) {
      const card: Card | undefined = this.getCardByMetadata(cardMetadata);
      if (card === undefined) {
        continue;
      }
      cardCollection.addCard(card);
    }
    return cardCollection;
  }

  public async playCardFromHand(card: Card, options: CardPlayOptions = CardPlayOptions.DEFAULT): Promise<void> {
    this.player.getOwnedCards().removeCardFromHand(card);

    if (options.shouldUseAction && card.hasType(CardType.ACTION) /* && card.getName() !== 'mimic'*/) {
      this.player.getStatistics().useAction();
    }
    this.player.getOwnedCards().addCardToInPlay(card);

    if (card.hasType(CardType.ATTACK)) {
      await this.announceAttackCard(card);
    }

    await this.playCard(this.player, card, options);
  }

  public async playCardFromLocation(card: Card, location: CardLocation): Promise<void> {
    this.removeCardFromLocation(card, location);
    return this.playCard(this.player, card);
  }

  private removeCardFromLocation(card: Card, location: CardLocation): void {
    if (this.sharedGameState.isSharedLocation(location)) {
      this.sharedGameState.getCardsFromArea(location).removeCard(card);
    } else {
      this.player.getOwnedCards().removeCardFromLocation(card, location);
    }
  }

  // TODO: see if this is actually used
  private removeCardsFromLocation(cards: CardCollection, location: CardLocation): void {
    if (this.sharedGameState.isSharedLocation(location)) {
      this.sharedGameState.getCardsFromArea(location).removeCards(cards);
    } else {
      this.player.getOwnedCards().removeCardsFromLocation(cards, location);
    }
  }

  private async playCard(
    player: Player,
    card: Card,
    options: CardPlayOptions = CardPlayOptions.DEFAULT,
  ): Promise<void> {
    /*this.messageBroadcaster.broadcastGameMessage({
      playerName: player.getName(),
      command: Command.PLAYED,
      visibility: GameMessageVisibility.PUBLIC,
      content: {
        type: MessageContentType.CARD_METADATA,
        value: card.getMetadata(),
      } as CardMetadataContent,
    });*/
    if (options.shouldLog) {
      this.logger.gameMessage(player, ServerLogMessage.publicMessage(player, 'plays %c', card));
    }

    await this.sharedGameState.triggerEffect(
      EffectTriggerType.ABOUT_TO_PLAY_CARD,
      this.player,
      CardCollection.fromCards([card]),
    );
    this.registerPlayedCard(card);
    await card.play(this);
    await this.sharedGameState.triggerEffect(
      EffectTriggerType.PLAYED_CARD,
      this.player,
      CardCollection.fromCards([card]),
    );
  }

  private registerPlayedCard(card: Card): void {
    this.sharedGameState.addPlayedCard(card);
    this.player.getTurnTracker().addPlayedCard(card);
    this.player.getOwnedCards();
  }

  public async drawCards(numToDraw: number): Promise<CardCollection> {
    return this.player.getOwnedCards().drawCards(numToDraw);
  }

  public async drawUpTo(size: number): Promise<void> {
    return this.player.getOwnedCards().drawUpTo(size);
  }

  public async revealUntil(cardEligibilityFunction: CardEligibilityFunction, count = 1): Promise<CardCollection> {
    const allCards: CardCollection = new CardCollection();
    const matchingCards: CardCollection = new CardCollection();
    const nonMatchingCards: CardCollection = new CardCollection();

    while (matchingCards.size() < count) {
      const topCard: Card | undefined = await this.takeCardOffDeck();
      if (topCard === undefined) {
        break;
      }

      await this.revealCard(topCard);
      allCards.addCard(topCard);
      if (cardEligibilityFunction.matches(topCard)) {
        matchingCards.addCard(topCard);
      } else {
        nonMatchingCards.addCard(topCard);
      }
    }

    await this.revealCards(allCards);
    await this.discardCardsFromLocation(nonMatchingCards, CardLocation.REVEAL_LIMBO);

    return matchingCards;
  }

  public async putTopCardOfDeckIntoHand(): Promise<Card | undefined> {
    const topCard: Card | undefined = await this.player.getOwnedCards().takeCardOffDeck();
    if (topCard instanceof Card) {
      this.player.getOwnedCards().addCardToHand(topCard);
    }
    return topCard;
  }

  public async playSimpleTreasures(): Promise<void> {
    const simpleTreasures: CardCollection = this.player.getOwnedCards().getMatchingCardsInHand(isSimpleTreasure);

    this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'plays %c', simpleTreasures));

    for (const nextCard of simpleTreasures.sorted(new TreasureCoinSortingFunction())) {
      await this.playCardFromHand(nextCard, CardPlayOptions.DONT_LOG);
    }
  }

  public async playCardFromHandNTimes(card: Card, n: number): Promise<void> {
    this.player.getOwnedCards().removeCardFromHand(card);
    this.player.getOwnedCards().addCardToInPlay(card);

    await this.playCardNTimesHelper(card, n);
  }

  private async playCardNTimesHelper(card: Card, n: number): Promise<void> {
    if (n > 0) {
      await this.chooseWayIfNecessary(card);
      await this.playCardNTimesHelper(card, n - 1);
    }
  }

  public async playMultipleCardsFromLocation(cards: CardCollection, location: CardLocation): Promise<void> {
    if (cards.size() === 0) {
      return;
    }
    const firstToPlay: Card | Choice = await this.chooseCard('Choose a card to play next')
      .from(cards)
      .to(CardSelectionPurpose.PLAY_ALT)
      .choose();
    if (firstToPlay instanceof Card) {
      await this.playCardFromLocation(firstToPlay, location);
      cards.removeCard(firstToPlay);
    }
    return this.playMultipleCardsFromLocation(cards, location);
  }

  private async chooseWayIfNecessary(card: Card): Promise<void> {
    // TODO: fill this out once we support ways
    await this.playCard(this.player, card);
  }

  public async buyFromPile(pileName: string): Promise<Card | undefined> {
    const card: Card | undefined = this.sharedGameState.piles.getTopCardOfPile(pileName);
    if (card === undefined) {
      return;
    }

    this.player.getStatistics().spendCoins(card.getCost().coins);
    this.player.getStatistics().spendPotions(card.getCost().potions);
    this.player.getStatistics().useBuy();
    this.player.getTurnTracker().addBoughtCard(card);

    this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'buys %c', card));

    const gainedCard = await this.gainFromPile(pileName);
    if (gainedCard !== undefined) {
      await this.sharedGameState.triggerEffect(
        EffectTriggerType.BUY,
        this.player,
        CardCollection.fromCards([gainedCard]),
      );
    }
    return gainedCard;
  }

  public async gainCardFromPile(
    cardChoice: Card | string,
    gainLocation: CardLocation = CardLocation.DISCARD,
  ): Promise<Card | undefined> {
    let pileName: string;
    if (typeof cardChoice === 'string' || cardChoice instanceof String) {
      pileName = cardChoice as string;
    } else {
      pileName = cardChoice.getPileName();
    }

    if (this.sharedGameState.isCopyOfCardOnTopOfPile(cardChoice, pileName)) {
      return this.gainFromPile(pileName, gainLocation);
    }
    return undefined;
  }

  public async gainFromPile(
    pileName: string,
    gainLocation: CardLocation = CardLocation.DISCARD,
  ): Promise<Card | undefined> {
    const card = this.removeTopCardFromPile(pileName);
    if (card === undefined) {
      return undefined;
    }
    await this.gain(card, gainLocation);
    return card;
  }

  private removeTopCardFromPile(pileName: string): Card | undefined {
    if (this.sharedGameState.piles.isPileEmpty(pileName)) {
      return undefined;
    }

    const card: Card | undefined = this.sharedGameState.piles.removeTopCardFromPile(pileName);
    return card;
  }

  private async gain(card: Card, gainLocation: CardLocation = CardLocation.DISCARD): Promise<void> {
    card.setLocation(gainLocation);
    if (gainLocation === CardLocation.DISCARD) {
      this.player.getOwnedCards().addCardToDiscard(card);
    } else if (gainLocation === CardLocation.DECK) {
      this.player.getOwnedCards().addCardToDeck(card);
    } else if (gainLocation === CardLocation.HAND) {
      this.player.getOwnedCards().addCardToHand(card);
    }

    this.player.getTurnTracker().addGainedCard(card);
    this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'gains %c', card));
    this.player.calculateScore();

    await this.player.getGame().getGameState().triggerEffect(EffectTriggerType.GAIN, this.player, card);
  }

  public async gainCardFromPileNTimes(cardChoice: Card | string, n: number): Promise<void> {
    for (let i = 0; i < n; i++) {
      await this.gainCardFromPile(cardChoice);
    }
  }

  public async gainCardFromTrash(card: Card, gainLocation = CardLocation.DISCARD): Promise<Card | undefined> {
    if (!this.sharedGameState.trash.contains(card) || card.getLocation() !== CardLocation.TRASH) {
      this.logger.gameMessage(
        this.player,
        ServerLogMessage.publicMessage(this.player, "has lost track of %c and can't gain it from the trash.", card),
      );
      return undefined;
    }

    this.sharedGameState.trash.removeCard(card);
    await this.gain(card, gainLocation);
    return card;
  }

  public exchangeCardFromLocation(cardToReturn: Card, location: CardLocation, pileName: string): void {
    // In order for the exchange to happen, the first card must be returnable
    // and the second card must be gainable
    if (!this.sharedGameState.piles.isPile(cardToReturn.getPileName())) {
      return;
    }
    const cardToReceive: Card | undefined = this.removeTopCardFromPile(pileName);
    if (cardToReceive === undefined) {
      return;
    }

    this.returnCardToPileFromLocation(cardToReturn, location);
    this.putCardInDiscard(cardToReceive);
    this.logger.gameMessage(
      this.player,
      ServerLogMessage.publicMessage(
        this.player,
        'exchanges %c',
        CardCollection.fromCards([cardToReturn, cardToReceive]),
      ),
    );
  }

  public returnCardToPileFromLocation(card: Card, location: CardLocation): void {
    if (this.sharedGameState.piles.isPile(card.getPileName())) {
      this.removeCardFromLocation(card, location);
      this.sharedGameState.piles.returnCardToPile(card);
    }
  }

  private putCardInDiscard(card: Card): void {
    this.player.getOwnedCards().addCardToDiscard(card);
  }

  public receivePassedCard(card: Card): void {
    this.player.getOwnedCards().addCardToHand(card);
  }

  public async takeCardOffDeck(): Promise<Card | undefined> {
    return this.player.getOwnedCards().takeCardOffDeck();
  }

  public topDeckCardFromLocation(card: Card, location: CardLocation, hidden = false): Promise<Card | undefined> {
    this.removeCardFromLocation(card, location);

    if (card.getLocation() === location) {
      this.putCardOnDeck(card, hidden);
      return Promise.resolve(card);
    } else {
      this.logger.gameMessage(
        this.player,
        ServerLogMessage.publicMessage(this.player, "has lost track of %c and can't topdeck it.", card),
      );
    }
    return Promise.resolve(undefined);
  }

  public putCardOnDeck(card: Card, hidden = false): void {
    this.player.getOwnedCards().addCardToDeck(card);
    if (hidden) {
      this.logger.gameMessage(this.player, ServerLogMessage.privateMessage(this.player, 'puts %c on the deck', card));
    } else {
      this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'puts %c on the deck', card));
    }
  }

  public topDeckCardFromSet(card: Card, set: CardCollection, hidden = false): void {
    set.removeCard(card);
    this.putCardOnDeck(card, hidden);
  }

  public async topDeckCardsFromRevealedSet(topCards: CardCollection): Promise<void> {
    const cardChoice: Card | Choice = await this.chooseCard('Choose a card to put on top of your deck')
      .from(topCards)
      .to(CardSelectionPurpose.TOPDECK)
      .choose();

    if (cardChoice instanceof Card) {
      this.removeCardFromLocation(cardChoice, cardChoice.getLocation());
      this.topDeckCardFromSet(cardChoice, topCards, true);
      if (topCards.size() > 0) {
        return this.topDeckCardsFromRevealedSet(topCards);
      }
    }
  }

  public putCardIntoDeck(card: Card, depth: number): void {
    this.player.getOwnedCards().putCardIntoDeck(card, depth);
  }

  public putCardIntoHandFromLocation(card: Card, location: CardLocation): void {
    if (card.getLocation() !== location) {
      this.removeCardFromLocation(card, location);
      this.logger.gameMessage(
        this.player,
        ServerLogMessage.publicMessage(this.player, "has lost track of %c and can't put it into hand", card),
      );
    }
    this.player.getOwnedCards().addCardToHand(card);
  }

  public putCardsIntoHand(cards: CardCollection): void {
    this.player.getOwnedCards().addCardsToHand(cards);
  }

  public putCardsIntoHandFromLocation(cards: CardCollection, location: CardLocation): void {
    for (const card of cards) {
      if (card.getLocation() !== location) {
        this.removeCardFromLocation(card, location);
        this.logger.gameMessage(
          this.player,
          ServerLogMessage.publicMessage(this.player, "has lost track of %c and can't put it into hand", card),
        );
      }
      this.player.getOwnedCards().addCardToHand(card);
    }
  }

  public putCardsIntoHandFromSet(cards: CardCollection, set: CardCollection): void {
    set.removeCards(cards);
    this.putCardsIntoHand(cards);
  }

  public async takeCardsOffDeck(numCards: number): Promise<CardCollection> {
    return this.player.getOwnedCards().takeCardsOffDeck(numCards);
  }

  public async lookAtTopCardOfDeck(): Promise<Card | undefined> {
    return this.player.getOwnedCards().lookAtTopCardOfDeck();
  }

  public async discardCard(card: Card): Promise<Card> {
    return this.player.getOwnedCards().discardCard(card);
  }

  public async discardCardFromLocation(card: Card, location: CardLocation): Promise<Card | undefined> {
    if (card.getLocation() !== location) {
      return undefined;
    }
    this.removeCardFromLocation(card, location);
    return this.discardCard(card);
  }

  public async discardCards(cards: CardCollection, expectedLocation: CardLocation): Promise<CardCollection> {
    if (cards.size() > 0) {
      this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'discards %c', cards));
    }

    await this.sharedGameState.triggerEffect(EffectTriggerType.DISCARD, this.player, cards);
    for (const card of cards) {
      if (card.getLocation() === expectedLocation) {
        this.player.getOwnedCards().addCardToDiscard(card);
      } else {
        this.logger.gameMessage(
          this.player,
          ServerLogMessage.publicMessage(this.player, "has lost track of %c and can't discard it", card),
        );
      }
    }
    return cards;
  }

  public async discardCardsFromLocation(cards: CardCollection, location: CardLocation): Promise<CardCollection> {
    if (cards.size() > 0) {
      this.removeCardsFromLocation(cards, location);
      return this.discardCards(cards, location);
    }
    return new CardCollection();
  }

  public async discardCardsFromRevealedSet(
    discardedCards: CardCollection,
    cards: CardCollection,
  ): Promise<CardCollection> {
    cards.removeCards(discardedCards);
    for (const card of discardedCards) {
      this.removeCardFromLocation(card, card.getLocation());
    }
    return this.discardCards(discardedCards, CardLocation.REVEAL_LIMBO);
  }

  public async discardHand(): Promise<CardCollection> {
    return this.player.getOwnedCards().discardHand();
  }

  public async discardAllFromInPlay(): Promise<void> {
    await this.player.getOwnedCards().discardAllFromInPlay();
  }

  public async discardDownTo(size: number): Promise<void> {
    if (this.player.getOwnedCards().getHand().size() > size) {
      const cards: CardCollection = await this.chooseCards(
        'Choose ' + (this.player.getOwnedCards().getHand().size() - size).toFixed() + ' cards to discard',
      )
        .from(CardLocation.HAND)
        .to(CardSelectionPurpose.DISCARD)
        .whereNumCardsIs(exactlyNChecked(this.player.getOwnedCards().getHand().size() - size))
        .choose();
      await this.discardCardsFromLocation(cards, CardLocation.HAND);
    }
  }

  public async trashCardFromLocation(card: Card, location: CardLocation): Promise<Card | undefined> {
    if (card.getLocation() === location) {
      const trashedCards = await this.trashCardsFromLocation(CardCollection.fromCards([card]), location);
      if (trashedCards.size() > 0) {
        return trashedCards.getArbitraryCard();
      }
      return undefined;
    } else {
      this.logger.gameMessage(
        this.player,
        ServerLogMessage.publicMessage(this.player, "has lost track of %c and can't trash it.", card),
      );
      return undefined;
    }
  }

  public async trashCardsFromLocation(cards: CardCollection, location: CardLocation): Promise<CardCollection> {
    if (cards.size() > 0) {
      this.removeCardsFromLocation(cards, location);
      return this.trashCards(cards);
    }
    return new CardCollection();
  }

  public async trashCardFromSet(card: Card, set: CardCollection): Promise<Card | undefined> {
    set.removeCard(card);
    this.removeCardFromLocation(card, card.getLocation());
    return this.trashCard(card);
  }

  public async trashCardsFromSet(cards: CardCollection, set: CardCollection): Promise<CardCollection> {
    if (cards.size() > 0) {
      set.removeCards(cards);
      for (const card of cards) {
        this.removeCardFromLocation(card, card.getLocation());
      }
      return this.trashCards(cards);
    }
    return new CardCollection();
  }

  public async trashCard(card: Card): Promise<Card | undefined> {
    return (await this.trashCards(CardCollection.fromCards([card]))).getArbitraryCard();
  }

  public async trashCards(cards: CardCollection): Promise<CardCollection> {
    return this.sharedGameState.trashCards(this.player, cards);
  }

  public async trashTopCardOfDeck(): Promise<Card | undefined> {
    const topCard = await this.takeCardOffDeck();
    if (topCard !== undefined) {
      return this.trashCard(topCard);
    }
    return undefined;
  }

  public setCardAsideFromLocation(card: Card, location: CardLocation): Promise<Card | undefined> {
    if (card.getLocation() === location) {
      this.removeCardFromLocation(card, location);
      this.setCardAside(card);
      return Promise.resolve(card);
    } else {
      this.logger.gameMessage(
        this.player,
        ServerLogMessage.publicMessage(this.player, "has lost track of %c and can't set it aside.", card),
      );
    }
    return Promise.resolve(undefined);
  }

  public setCardAside(card: Card, hidden = false): void {
    this.player.getOwnedCards().addCardToSetAside(card);
    if (hidden) {
      this.logger.gameMessage(this.player, ServerLogMessage.privateMessage(this.player, 'sets %c aside', card));
    } else {
      this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'sets %c aside', card));
    }
  }

  public putCardOnIslandMatFromHand(card: Card): void {
    if (card.getLocation() === CardLocation.HAND) {
      this.removeCardFromLocation(card, CardLocation.HAND);
      this.player.getOwnedCards().addCardToIslandMat(card);
    } else {
      this.logger.gameMessage(
        this.player,
        ServerLogMessage.publicMessage(this.player, "has lost track of %c and can't set it aside.", card),
      );
    }
  }

  public async putTopCardOfDeckOnNativeVillageMat(): Promise<void> {
    const topCard: Card | undefined = await this.player.getOwnedCards().takeCardOffDeck();
    if (topCard instanceof Card) {
      this.player.getOwnedCards().addCardToNativeVillageMat(topCard);
    }
  }

  public putCardsFromNativeVillageMatIntoHand(): void {
    const nativeVillageCards = this.player.getOwnedCards().removeAllCardsFromNativeVillageMat();
    this.player.getOwnedCards().addCardsToHand(nativeVillageCards);
  }

  public async shuffleDeck(): Promise<void> {
    await this.sharedGameState.triggerEffect(EffectTriggerType.WOULD_SHUFFLE, this.player);
    this.player.getOwnedCards().shuffleDeck();
    await this.sharedGameState.triggerEffect(EffectTriggerType.SHUFFLE, this.player);
  }

  public async revealCards(cards: CardCollection): Promise<void> {
    if (cards.size() > 0) {
      this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'reveals %c', cards));
      await this.sharedGameState.triggerEffect(EffectTriggerType.REVEAL, this.player, cards);
    }
  }

  public async revealCard(card: Card): Promise<void> {
    this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'reveals %c', card));
    await this.sharedGameState.triggerEffect(EffectTriggerType.REVEAL, this.player, CardCollection.fromCards([card]));
  }

  public async revealHand() {
    return this.revealCards(this.player.getOwnedCards().getHand());
  }

  public async nameCard(
    cardSelectionPurpose: CardSelectionPurpose = CardSelectionPurpose.OTHER,
  ): Promise<Card | Choice> {
    const choice = await this.chooseCard('Name a card')
      .from(CardSelectionLocation.ALL_CARDS)
      .to(cardSelectionPurpose)
      .choose();

    if (choice instanceof Card) {
      this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'names %c', choice));
    }

    return choice;
  }

  public addEffect(effect: Effect): void {
    this.player.getEffects().addEffect(effect);
    this.sharedGameState.registerEffectTrigger(effect.getTrigger(), effect.getSource());
  }

  public addExtraTurn(source: Card, preconditions: ExtraTurnPrecondition[]): void {
    this.player.getEffects().addExtraTurn(new ExtraTurn(this.player, source, preconditions));
  }

  public async announceAttackCard(attackCard: Card): Promise<void> {
    this.sharedGameState.clearBlocksForAttackCard(attackCard);
    await this.sharedGameState.triggerEffect(EffectTriggerType.ATTACK, this.player, new CardCollection(attackCard));
  }

  public blockAttack(attackCard: Card): void {
    this.player.getEffects().blockAttack(attackCard);
  }

  public async performAttack(
    attackCard: Card,
    sharedInstruction: (attackedPlayer: Player, attackingPlayer: Player) => Promise<void>,
  ) {
    await this.sharedGameState.performAttack(this.player, attackCard, sharedInstruction);
  }

  public async eachPlayer(sharedInstruction: (ie: InstructionExecutor) => Promise<void>): Promise<void> {
    await this.sharedGameState.executeForEachPlayer(sharedInstruction);
  }

  public async eachOtherPlayer(sharedInstruction: (ie: InstructionExecutor) => Promise<void>): Promise<void> {
    await this.sharedGameState.executeForEachOtherPlayer(sharedInstruction);
  }

  public async eachPlayerPassesACardToTheLeft(): Promise<void> {
    await this.sharedGameState.eachPlayerPassesACardToTheLeft();
  }

  public createThisTurnEligibilityFunction(): TurnEligibility {
    return new ThisTurnEligibility(this.sharedGameState);
  }

  public createNextTurnEligibilityFunction(): TurnEligibility {
    return new NextTurnEligibility(this.sharedGameState);
  }

  public createFirstMatchingCardPlayedThisTurnEligibilityFunction(
    cardEligibilityFunction: CardEligibilityFunction,
  ): CardEligibilityFunction {
    const firstMatchingCardFunction = (playedCard: Card) => {
      if (!cardEligibilityFunction.matches(playedCard)) {
        return false;
      }

      if (cardEligibilityFunction.numMatchingCards(this.sharedGameState.cardsPlayedThisTurn) > 1) {
        return false;
      }
      return true;
    };

    const eligiblityFunction =
      new (class FirstMatchingCardPlayedThisTurnEligibilityFunction extends CardEligibilityFunction {
        public constructor() {
          super(firstMatchingCardFunction);
        }
      })();

    return eligiblityFunction;
  }

  public createPlayerToTheLeftGainedOnTheirLastTurnCardEligibilityFunction(): CardEligibilityFunction {
    const playerToTheLeft = this.sharedGameState.getPlayerLeftOfCurrent();
    const lastTurn = playerToTheLeft.getTurnTracker().getLastCompletedTurn();

    if (lastTurn === undefined) {
      return noCard;
    }

    return playerToTheLeft.getTurnTracker().getCardsGainedOnTurnEligibilityFunction(lastTurn);
  }

  public createBoughtCardEligibilityFunction(): CardEligibilityFunction {
    return this.player.getTurnTracker().getCardsBoughtThisTurnEligibilityFunction();
  }

  public createOnceThisTurnEffectExpiration(): EffectExpiration {
    return new OnceThisTurnEffectExpiration(this.sharedGameState.getCurrentTurn());
  }

  public createStartOfMyNextTurnEffectExpiration(): EffectExpiration {
    return new StartOfPlayersNextTurnEffectExpiration(this.player, this.sharedGameState.getCurrentTurn());
  }

  public createStartOfPlayersNextTurnEffectExpiration(player: Player): EffectExpiration {
    return new StartOfPlayersNextTurnEffectExpiration(player, this.sharedGameState.getCurrentTurn());
  }

  public createEndOfMyNextTurnEffectExpiration(): EffectExpiration {
    return new EndOfPlayersNextTurnEffectExpiration(this.player, this.sharedGameState.getCurrentTurn());
  }

  public getEligibleSupplyChoices(cardEligibilityFunction: CardEligibilityFunction): CardChoice[] {
    const potentialChoices: CardChoice[] = [];
    for (const topCard of this.sharedGameState.piles
      .getTopCardsOfSupplyPiles()
      .getMatchingCardsUnique(cardEligibilityFunction)) {
      potentialChoices.push({
        type: ChoiceType.Card,
        card: topCard.getMetadata(),
      });
    }

    return potentialChoices;
  }

  public getEligibleCardChoices(
    areaEligibility: Set<CardLocation>,
    cardEligibilityFunction: CardEligibilityFunction,
  ): CardChoice[] {
    const potentialChoices: CardChoice[] = [];
    for (const area of areaEligibility) {
      let eligibleCards: CardCollection = new CardCollection();
      if (this.sharedGameState.isSharedLocation(area)) {
        eligibleCards = this.sharedGameState.getCardsFromArea(area).getMatchingCards(cardEligibilityFunction);
      } else {
        eligibleCards = this.player.getOwnedCards().getCardsFromArea(area).getMatchingCards(cardEligibilityFunction);
      }

      for (const card of eligibleCards) {
        potentialChoices.push({
          type: ChoiceType.Card,
          card: card.getMetadata(),
        });
      }
    }

    return potentialChoices;
  }

  public getEligibleCardMultiChoices(
    areaEligibility: Set<CardLocation>,
    cardEligibilityFunction: CardEligibilityFunction,
  ): MultiCardChoice[] {
    const potentialChoices: MultiCardChoice[] = [];
    for (const area of areaEligibility) {
      let eligibleCards: CardGroup[] = [];
      if (this.sharedGameState.isSharedLocation(area)) {
        eligibleCards = this.sharedGameState
          .getCardsFromArea(area)
          .getMatchingCards(cardEligibilityFunction)
          .cardGroups();
      } else {
        eligibleCards = this.player
          .getOwnedCards()
          .getCardsFromArea(area)
          .getMatchingCards(cardEligibilityFunction)
          .cardGroups();
      }

      for (const cardGroup of eligibleCards) {
        potentialChoices.push({
          type: ChoiceType.MultiCard,
          cards: cardGroup.toCardMetadataArray(),
        });
      }
    }

    return potentialChoices;
  }

  public getAllExtraCards(): CardCollection {
    return this.sharedGameState.getAllExtraCards();
  }

  public setNumCardsToDrawInCleanup(numCardsToDrawInCleanup: number): void {
    this.player.getTurnTracker().setNumCardsToDrawInCleanup(numCardsToDrawInCleanup);
  }

  public forceFullBroadcastOfDiscard(): void {
    this.player.getOwnedCards().forceFullBroadcastOfDiscard();
  }
}
