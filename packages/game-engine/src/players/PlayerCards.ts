import { CardLocation, CardMetadata, CardScoringElement, ScoringElementType } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardFactory } from '../card/CardFactory';
import { PrivacyType } from '../card/PrivacyType';
import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { Effect } from '../effects/Effect';
import { EffectTriggerType } from '../effects/EffectTriggerType';
import { CardCostCache } from '../game-state/CardCostCache';
import { Logger } from '../logging/Logger';
import { ServerLogMessage } from '../logging/ServerLogMessage';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { StartingDeckConfiguration } from '../setup/StartingDeckConfiguration';
import { canBeDiscardedInCleanup, isActionCard } from '../StandardCardEligibilityFunctions';
import { Deck } from './Deck';
import { Discard } from './Discard';
import { Hand } from './Hand';
import { InPlay } from './InPlay';
import { IslandMat } from './IslandMat';
import { Limbo } from './Limbo';
import { NativeVillageMat } from './NativeVillageMat';
import { Player } from './Player';
import { SetAside } from './SetAside';

export class PlayerCards {
  private readonly deck: Deck;
  private readonly hand: Hand;
  private readonly discard: Discard;
  private readonly inPlay: InPlay;
  private readonly limbo: Limbo;
  private readonly setAside: SetAside;
  private readonly islandMat: IslandMat;
  private readonly nativeVillageMat: NativeVillageMat;

  private readonly messageBroadcaster: GameMessageBroadcaster;
  private readonly logger: Logger;

  constructor(private readonly player: Player) {
    this.messageBroadcaster = this.player.getGame().getMessageBroadcaster();
    this.logger = this.player.getGame().getLogger();

    this.deck = new Deck(player, this.messageBroadcaster);
    this.hand = new Hand(player, this.messageBroadcaster);
    this.discard = new Discard(player, this.messageBroadcaster);
    this.inPlay = new InPlay(player, this.messageBroadcaster);
    this.limbo = new Limbo(player, this.messageBroadcaster);
    this.setAside = new SetAside(player, this.messageBroadcaster);
    this.islandMat = new IslandMat(player, this.messageBroadcaster);
    this.nativeVillageMat = new NativeVillageMat(player, this.messageBroadcaster);
  }

  public initialize(startingDeckConfiguration: StartingDeckConfiguration) {
    const cardFactory: CardFactory = new CardFactory(this.player.getGame().getGameState());
    for (const cardNameAndId of startingDeckConfiguration.getCardNamesAndIds('deck')) {
      const card = cardFactory.createCard(cardNameAndId.name, cardNameAndId.id, CardLocation.DECK);
      this.addCardToDeck(card);
      this.player.getBotStatistics().addCardToStatistics(card);
    }
    this.deck.shuffle();
  }

  public communicateInitialState(): void {
    this.deck.forceBroadcast();
    this.hand.forceBroadcast();
    this.discard.forceBroadcast();
    this.inPlay.forceBroadcast();
    this.limbo.forceBroadcast();
    this.setAside.forceBroadcast();
    this.islandMat.forceBroadcast();
    this.nativeVillageMat.forceBroadcast();
  }

  public getDeck(): Deck {
    return this.deck;
  }

  public getHand(): Hand {
    return this.hand;
  }

  public getDiscard(): Discard {
    return this.discard;
  }

  public getInPlay(): InPlay {
    return this.inPlay;
  }

  public getCardsFromArea(area: CardLocation): CardCollection {
    switch (area) {
      case CardLocation.HAND: {
        return this.hand;
      }
      case CardLocation.IN_PLAY: {
        return this.inPlay;
      }
      case CardLocation.DECK: {
        return this.deck;
      }
      case CardLocation.DISCARD: {
        return this.discard;
      }
      case CardLocation.SET_ASIDE: {
        return this.setAside;
      }
      case CardLocation.REVEAL_LIMBO: {
        return this.limbo;
      }
      default: {
        throw new Error('Requested cards from ' + area + ' from a player, but this is not owned by the player');
      }
    }
  }

  public removeCardFromLocation(card: Card, location: CardLocation): void {
    this.getCardsFromArea(location).removeCard(card);
  }

  public removeCardsFromLocation(cards: CardCollection, location: CardLocation): void {
    this.getCardsFromArea(location).removeCards(cards);
  }

  public async drawCards(numToDraw: number): Promise<CardCollection> {
    const cards: CardCollection = await this.drawCardsHelper(numToDraw, new CardCollection());
    if (cards.size() > 0) {
      this.logger.gameMessage(this.player, ServerLogMessage.privateMessage(this.player, 'draws %c', cards));
    }
    return cards;
  }

  private async drawCardsHelper(numToDraw: number, cardsDrawnSoFar: CardCollection): Promise<CardCollection> {
    if (numToDraw === 0) {
      return cardsDrawnSoFar;
    }

    const card: Card | undefined = await this.putTopCardOfDeckIntoHand();
    if (card instanceof Card) {
      cardsDrawnSoFar.addCard(card);
    }
    return this.drawCardsHelper(numToDraw - 1, cardsDrawnSoFar);
  }

  private async takeCardOffDeckHelper(): Promise<Card | undefined> {
    await this.checkIfShuffleRequired(); // TODO: add await and async to this
    if (this.deck.size() > 0) {
      const card: Card = this.deck.removeTopCard();
      card.setLocation(CardLocation.REVEAL_LIMBO);
      return card;
    }
  }

  public async takeCardOffDeck(): Promise<Card | undefined> {
    this.limbo.clear();
    const card = await this.takeCardOffDeckHelper();
    if (card !== undefined) {
      this.limbo.addCard(card);
    }
    return card;
  }

  public async takeCardsOffDeck(numCards: number): Promise<CardCollection> {
    return this.takeCardsOffDeckHelper(numCards, new CardCollection());
  }

  private async takeCardsOffDeckHelper(numCards: number, cardsSoFar: CardCollection): Promise<CardCollection> {
    if (cardsSoFar.size() === numCards) {
      this.limbo.addCards(cardsSoFar);
      return cardsSoFar;
    }

    const topCard: Card | undefined = await this.takeCardOffDeckHelper();

    if (topCard !== undefined) {
      topCard.setLocation(CardLocation.REVEAL_LIMBO);
      cardsSoFar.addCard(topCard);
      return this.takeCardsOffDeckHelper(numCards, cardsSoFar);
    } else {
      this.limbo.addCards(cardsSoFar);
      return cardsSoFar;
    }
  }

  private async checkIfShuffleRequired(): Promise<void> {
    if (this.deck.size() == 0 && this.discard.size() > 0) {
      return this.performShuffle();
    }
  }

  private async performShuffle(): Promise<void> {
    await this.player.getGame().getGameState().triggerEffect(EffectTriggerType.WOULD_SHUFFLE);

    this.deck.addCards(this.discard);
    this.discard.clear();
    this.deck.shuffle();

    this.deck.updateLocationForAll(CardLocation.DECK);
    this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'shuffles.'));
    await this.player.getGame().getGameState().triggerEffect(EffectTriggerType.SHUFFLE);
  }

  public async drawUpTo(size: number): Promise<void> {
    return this.drawUpToHelper(size, new CardCollection());
  }

  private async drawUpToHelper(size: number, revealedDrawUpToCards: CardCollection): Promise<void> {
    if (this.hand.size() >= size) {
      return;
    }

    const card = await this.lookAtTopCardOfDeck();
    if (card !== undefined) {
      if (isActionCard.matches(card)) {
        await this.player.getGame().getGameState().triggerEffect(EffectTriggerType.REVEALED_ACTION_DURING_DTX, card);
        return this.drawUpToHelper(size, revealedDrawUpToCards);
      } else {
        await this.drawCards(1);
        return this.drawUpToHelper(size, revealedDrawUpToCards);
      }
    } else {
      await this.discardCards(revealedDrawUpToCards, CardLocation.REVEAL_LIMBO);
    }
  }

  public async putTopCardOfDeckIntoHand(): Promise<Card | undefined> {
    const card: Card | undefined = await this.takeCardOffDeckHelper();
    if (card instanceof Card) {
      this.addCardToHand(card);
    }
    return card;
  }

  public async lookAtTopCardOfDeck(): Promise<Card | undefined> {
    await this.checkIfShuffleRequired();
    if (this.deck.size() > 0) {
      return this.deck.getTopCard();
    }
  }

  public putCardIntoDeck(card: Card, depth: number): void {
    this.deck.insertCardAtPosition(card, this.deck.size() - depth);
  }

  public async discardCard(card: Card): Promise<Card> {
    this.addCardToDiscard(card);
    this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'discards %c', card));

    await this.player
      .getGame()
      .getGameState()
      .triggerEffect(EffectTriggerType.DISCARD, CardCollection.fromCards([card]));
    return card;
  }

  public async discardCards(cards: CardCollection, expectedLocation: CardLocation): Promise<CardCollection> {
    if (cards.size() > 0) {
      this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'discards %c', cards));
    }

    await this.player.getGame().getGameState().triggerEffect(EffectTriggerType.DISCARD, cards);
    for (const card of cards) {
      if (card.getLocation() === expectedLocation) {
        this.addCardToDiscard(card);
      } else {
        this.logger.gameMessage(
          this.player,
          ServerLogMessage.publicMessage(this.player, "has lost track of %c and can't discard it", card),
        );
      }
    }
    return cards;
  }

  public async discardHand(): Promise<CardCollection> {
    const cardsToDiscard = this.hand.clone();
    this.hand.clear();
    return this.discardCards(cardsToDiscard, CardLocation.HAND);
  }

  public async discardAllFromInPlay(): Promise<void> {
    const cardsToDiscard = this.inPlay.getMatchingCards(canBeDiscardedInCleanup).clone();
    this.inPlay.removeCards(cardsToDiscard);
    await this.discardCards(cardsToDiscard, CardLocation.IN_PLAY);
  }

  public gain(card: Card, gainLocation: CardLocation): void {
    switch (gainLocation) {
      case CardLocation.HAND: {
        this.hand.addCard(card);
        break;
      }
      case CardLocation.DECK: {
        this.deck.addCard(card);
        break;
      }
      default: {
        this.discard.addCard(card);
      }
    }
  }

  public getCardScoringElements(): CardScoringElement[] {
    const scoringElements: CardScoringElement[] = [];
    const allCardGroups = this.getCardGroupsForScoring();

    const cardsByName = new Map<string, CardCollection>();
    for (const group of allCardGroups) {
      for (const card of group) {
        const name = card.getName();
        if (!cardsByName.has(name)) {
          cardsByName.set(name, new CardCollection());
        }
        cardsByName.get(name)!.addCard(card);
      }
    }

    for (const cardName of cardsByName.keys()) {
      const cardCollection = cardsByName.get(cardName)!;
      const totalPoints = cardCollection.totalScore(allCardGroups);
      if (totalPoints !== 0) {
        scoringElements.push({
          type: ScoringElementType.CARD,
          cardName,
          count: cardCollection.size(),
          totalPoints,
        });
      }
    }
    return scoringElements;
  }

  public calculatePoints() {
    let playerPoints = 0;
    const allCardGroups = this.getCardGroupsForScoring();

    for (const cardGroup of allCardGroups) {
      playerPoints += cardGroup.totalScore(allCardGroups);
    }

    this.player.getStatistics().setScore(playerPoints);
  }

  private getCardGroupsForScoring(): CardCollection[] {
    return [this.discard, this.inPlay, this.deck, this.hand];
  }

  public removeCardFromHand(card: Card): void {
    this.hand.removeCard(card);
  }

  public removeAllCardsFromNativeVillageMat(): CardCollection {
    const nativeVillageCards = this.nativeVillageMat.clone();
    this.nativeVillageMat.clear();
    return nativeVillageCards;
  }

  public addCardToInPlay(card: Card): void {
    card.setLocation(CardLocation.IN_PLAY);
    this.inPlay.addCard(card);
  }

  public addCardToDeck(card: Card): void {
    card.setLocation(CardLocation.DECK);
    this.deck.addCard(card);
  }

  public addCardToDiscard(card: Card): void {
    card.setLocation(CardLocation.DISCARD);
    this.discard.addCard(card);
  }

  public addCardToSetAside(card: Card): void {
    card.setLocation(CardLocation.SET_ASIDE);
    this.setAside.addCard(card);
  }

  public addCardsToSetAside(cards: CardCollection): void {
    for (const card of cards) {
      card.setLocation(CardLocation.SET_ASIDE);
    }
    this.setAside.addCards(cards);
  }

  public addCardToHand(card: Card): void {
    card.setLocation(CardLocation.HAND);
    this.hand.addCard(card);
  }

  public addCardsToHand(cards: CardCollection): void {
    for (const card of cards) {
      card.setLocation(CardLocation.HAND);
    }
    this.hand.addCards(cards);
  }

  public addCardToIslandMat(card: Card): void {
    card.setLocation(CardLocation.ISLAND_MAT);
    this.islandMat.addCard(card);
  }

  public addCardToNativeVillageMat(card: Card): void {
    this.nativeVillageMat.addCard(card);
    card.setLocation(CardLocation.NATIVE_VILLAGE_MAT);
  }

  public calculateSimpleTreasureCoinsInHand() {
    let simpleCoins = 0;
    for (const card of this.hand) {
      if (card.isSimpleTreasure()) {
        simpleCoins += card.getCoins();
      }
    }
    return simpleCoins;
  }

  public hasMatchingCardInHand(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return this.hand.doesAnyMatch(cardEligibilityFunction);
  }

  public hasMatchingCardInPlay(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return this.inPlay.doesAnyMatch(cardEligibilityFunction);
  }

  public numMatchingCardsInHand(cardEligibilityFunction: CardEligibilityFunction): number {
    return this.hand.numMatchingCards(cardEligibilityFunction);
  }

  public numMatchingCardsInPlay(cardEligibilityFunction: CardEligibilityFunction): number {
    return this.inPlay.numMatchingCards(cardEligibilityFunction);
  }

  public getMatchingCardsInHand(cardEligibilityFunction: CardEligibilityFunction): CardCollection {
    return this.hand.getMatchingCards(cardEligibilityFunction);
  }

  public getMatchingCardsInPlay(cardEligibilityFunction: CardEligibilityFunction): CardCollection {
    return this.inPlay.getMatchingCards(cardEligibilityFunction);
  }

  public getEffectsByType(effectTrigger: EffectTriggerType): Effect[] {
    let effects: Effect[] = [];

    effects = effects.concat(this.hand.getEffectsByType(effectTrigger));
    effects = effects.concat(this.inPlay.getEffectsByType(effectTrigger));

    return effects;
  }

  public getDeckEffectsByType(effectTrigger: EffectTriggerType): Effect[] {
    return this.deck.getEffectsByType(effectTrigger);
  }

  public reportCardCosts(cardCostCache: CardCostCache): void {
    this.hand.reportCardCosts(cardCostCache);
    this.inPlay.reportCardCosts(cardCostCache);
    this.deck.reportCardCosts(cardCostCache);
    this.discard.reportCardCosts(cardCostCache);
    this.setAside.reportCardCosts(cardCostCache);
    this.limbo.reportCardCosts(cardCostCache);
    this.islandMat.reportCardCosts(cardCostCache);
    this.nativeVillageMat.reportCardCosts(cardCostCache);
  }

  public getCardByMetadata(cardMetadata: CardMetadata): Card | undefined {
    if (cardMetadata.location === CardLocation.DECK) {
      return this.deck.getCardByMetadata(cardMetadata);
    }
    if (cardMetadata.location === CardLocation.DISCARD) {
      return this.discard.getCardByMetadata(cardMetadata);
    }
    if (cardMetadata.location === CardLocation.HAND) {
      return this.hand.getCardByMetadata(cardMetadata);
    }
    if (cardMetadata.location === CardLocation.IN_PLAY) {
      return this.inPlay.getCardByMetadata(cardMetadata);
    }
    if (cardMetadata.location === CardLocation.REVEAL_LIMBO) {
      return this.limbo.getCardByMetadata(cardMetadata);
    }
    if (cardMetadata.location === CardLocation.SET_ASIDE) {
      return this.setAside.getCardByMetadata(cardMetadata);
    }
  }

  public getCardsByMetadata(cardsMetadata: CardMetadata[]): CardCollection {
    const cards: CardCollection = new CardCollection();
    for (const cardMetadata of cardsMetadata) {
      const card: Card | undefined = this.getCardByMetadata(cardMetadata);
      if (card !== undefined) {
        cards.addCard(card);
      }
    }
    return cards;
  }

  forceFullBroadcast(): void {
    this.hand.forceBroadcast();
    this.inPlay.forceBroadcast();
    this.deck.forceBroadcast();
    this.discard.forceBroadcast();
    this.setAside.forceBroadcast();
    this.limbo.forceBroadcast();
    this.islandMat.forceBroadcast();
    this.nativeVillageMat.forceBroadcast();
  }

  forceFullBroadcastOfDiscard(): void {
    this.discard.forceBroadcastWithPrivacyType(PrivacyType.SIZE_VISIBLE_TO_OPPONENTS);
  }
}
