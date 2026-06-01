import {
  CardChoice,
  CardLocation,
  CardMetadata,
  CardSelectionPurpose,
  CardType,
  Choice,
  ChoiceType,
  EffectChoice,
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
import { Logger } from '../logging/Logger';
import { ServerLogMessage } from '../logging/ServerLogMessage';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { SharedGameState } from '../SharedGameState';
import { isSimpleTreasure } from '../StandardCardEligibilityFunctions';
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
    return this.player.getStatistics().hasPlayedMatchingCardThisTurn(cardEligibilityFunction);
  }

  public hasGainedMatchingCardThisTurn(cardEligibilityFunction: CardEligibilityFunction): boolean {
    return this.player.getStatistics().hasGainedMatchingCardThisTurn(cardEligibilityFunction);
  }

  public numMatchingCardsInHand(cardEligibilityFunction: CardEligibilityFunction): number {
    return this.player.getOwnedCards().numMatchingCardsInHand(cardEligibilityFunction);
  }

  public numMatchingCardsPlayedThisTurn(cardEligibilityFunction: CardEligibilityFunction): number {
    return this.player.getStatistics().numMatchingCardsPlayedThisTurn(cardEligibilityFunction);
  }

  public getMatchingCardsInHand(cardEligibilityFunction: CardEligibilityFunction): CardCollection {
    return this.player.getOwnedCards().getMatchingCardsInHand(cardEligibilityFunction);
  }

  public getCardsFromLocation(location: CardLocation): CardCollection {
    if (this.sharedGameState.isSharedLocation(location)) {
      return this.sharedGameState.getCardsFromArea(location);
    }
    return this.player.getOwnedCards().getCardsFromArea(location);
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

    await this.sharedGameState.triggerEffect(EffectTriggerType.ABOUT_TO_PLAY_CARD, CardCollection.fromCards([card]));
    this.registerPlayedCard(card);
    await card.play(this);
    await this.sharedGameState.triggerEffect(EffectTriggerType.PLAYED_CARD, CardCollection.fromCards([card]));
  }

  private registerPlayedCard(card: Card): void {
    this.sharedGameState.addPlayedCard(card);
    this.player.getStatistics().addPlayedCard(card);
    this.player.getOwnedCards();
  }

  public async drawCards(numToDraw: number): Promise<CardCollection> {
    return this.player.getOwnedCards().drawCards(numToDraw);
  }

  public async drawUpTo(size: number): Promise<void> {
    return this.player.getOwnedCards().drawUpTo(size);
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
    this.player.getStatistics().useBuy();

    this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'buys %c', card));

    // TODO: does anything rely on passing the pile name here?
    await this.sharedGameState.triggerEffect(EffectTriggerType.BUY);
    return this.gainFromPile(pileName);
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
    return this.gainFromPile(pileName, gainLocation);
  }

  public async gainFromPile(
    pileName: string,
    gainLocation: CardLocation = CardLocation.DISCARD,
  ): Promise<Card | undefined> {
    if (this.sharedGameState.piles.isPileEmpty(pileName)) {
      return undefined;
    }

    const card: Card | undefined = this.sharedGameState.piles.removeTopCardFromPile(pileName);
    if (card === undefined) {
      return;
    }
    await this.gain(card, gainLocation);
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

    this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'gains %c', card));
    this.player.calculateScore();

    await this.player
      .getGame()
      .getGameState()
      .triggerEffect(EffectTriggerType.GAIN, CardCollection.fromCards([card]));
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

    await this.sharedGameState.triggerEffect(EffectTriggerType.DISCARD, cards);
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

  public async revealCards(cards: CardCollection): Promise<void> {
    if (cards.size() > 0) {
      this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'reveals %c', cards));
      await this.sharedGameState.triggerEffect(EffectTriggerType.REVEAL, cards);
    }
  }

  public async revealCard(card: Card): Promise<void> {
    this.logger.gameMessage(this.player, ServerLogMessage.publicMessage(this.player, 'reveals %c', card));
    await this.sharedGameState.triggerEffect(EffectTriggerType.REVEAL, CardCollection.fromCards([card]));
  }

  public async revealHand() {
    return this.revealCards(this.player.getOwnedCards().getHand());
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
    await this.sharedGameState.triggerEffect(EffectTriggerType.ATTACK, new CardCollection(attackCard));
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

  public async processEffectsByType(
    triggerType: EffectTriggerType,
    targetCards: Card | CardCollection | undefined,
    extraInformation = '',
    usedEffectIDs: Set<string> = new Set<string>(),
  ): Promise<void> {
    const allEffects = this.getApplicableEffectsByType(triggerType, targetCards);
    const optionalEffects = allEffects.filter((e: Effect) => !e.isMandatory() && !usedEffectIDs.has(e.getId()));
    const mandatoryEffects = allEffects.filter((e: Effect) => e.isMandatory() && !usedEffectIDs.has(e.getId()));

    const uniqueMandatoryEffectCardNames = new Set<string>(
      mandatoryEffects.map((value: Effect) => value.getOwner().getName()),
    );
    if (optionalEffects.length === 0 && uniqueMandatoryEffectCardNames.size === 1) {
      await mandatoryEffects[0].doAction(this, targetCards);
      usedEffectIDs.add(mandatoryEffects[0].getId());
      if (mandatoryEffects.length === 1) {
        return;
      } else {
        return this.processEffectsByType(triggerType, targetCards, extraInformation, usedEffectIDs);
      }
    }

    if (allEffects.length > 0) {
      let extraMessage = '';
      if (triggerType === EffectTriggerType.WOULD_GAIN && targetCards !== undefined) {
        extraMessage =
          'You would gain ' +
          (targetCards instanceof CardCollection
            ? targetCards.print()
            : CardCollection.fromCards([targetCards]).print()) +
          '.';
      } else if (triggerType === EffectTriggerType.GAIN && targetCards !== undefined) {
        extraMessage =
          'You gained ' +
          (targetCards instanceof CardCollection
            ? targetCards.print()
            : CardCollection.fromCards([targetCards]).print()) +
          '.';
      } else if (triggerType === EffectTriggerType.ATTACK && targetCards !== undefined) {
        extraMessage =
          'An opponent played ' +
          (targetCards instanceof CardCollection
            ? targetCards.print()
            : CardCollection.fromCards([targetCards]).print()) +
          '.';
      }
      const effectsById: Map<string, Effect> = this.createEffectIdMap(optionalEffects, mandatoryEffects);

      const effectChoice: Choice = await this.player
        .getDecisionService()
        .chooseFromMultipleEvents(
          extraMessage,
          this.createEffectChoices(optionalEffects),
          this.createEffectChoices(mandatoryEffects),
        );
      if (effectChoice.type === ChoiceType.Effect) {
        const effect: Effect = effectsById.get((effectChoice as EffectChoice).effectId)!;
        usedEffectIDs.add(effect.getId());

        this.sharedGameState.pushActiveEffectOntoStack(effect);
        await effect.doAction(this, targetCards);
        this.sharedGameState.popActiveEffectOffOfStack();
        return this.processEffectsByType(triggerType, targetCards, extraInformation, usedEffectIDs);
      }
    }
  }

  private createEffectChoices(effects: Effect[]): EffectChoice[] {
    const effectChoices: EffectChoice[] = [];
    for (const effect of effects) {
      effectChoices.push({
        type: ChoiceType.Effect,
        effectName: effect.getOwner().getName(),
        effectId: effect.getId(),
      });
    }
    return effectChoices;
  }

  private createEffectIdMap(optionalEffects: Effect[], mandatoryEffects: Effect[]): Map<string, Effect> {
    const effectIdMap: Map<string, Effect> = new Map<string, Effect>();
    for (const optionalEffect of optionalEffects) {
      effectIdMap.set(optionalEffect.getId(), optionalEffect);
    }
    for (const mandatoryEffect of mandatoryEffects) {
      effectIdMap.set(mandatoryEffect.getId(), mandatoryEffect);
    }
    return effectIdMap;
  }

  private getApplicableEffectsByType(
    trigger: EffectTriggerType,
    targetCards: Card | CardCollection | undefined,
  ): Effect[] {
    const allEffects: Effect[] = [];
    allEffects.push(...this.filterEffectsToApplicable(this.player.getEffects().getEffectsByType(trigger), targetCards));
    allEffects.push(
      ...this.filterEffectsToApplicable(this.player.getOwnedCards().getEffectsByType(trigger), targetCards),
    );
    if (targetCards !== undefined && targetCards instanceof CardCollection) {
      allEffects.push(...this.filterEffectsToApplicable(targetCards.getEffectsByType(trigger), targetCards, true));
    } else if (targetCards !== undefined) {
      allEffects.push(
        ...this.filterEffectsToApplicable(
          CardCollection.fromCards([targetCards]).getEffectsByType(trigger),
          targetCards,
          true,
        ),
      );
    }

    if (trigger === EffectTriggerType.SHUFFLE) {
      allEffects.push(
        ...this.filterEffectsToApplicable(this.player.getOwnedCards().getDeckEffectsByType(trigger), targetCards),
      );
    }

    return allEffects;
  }

  private filterEffectsToApplicable(
    effects: Effect[],
    targetCards: Card | CardCollection | undefined,
    allowSelf = false,
  ): Effect[] {
    const applicableEffects: Effect[] = [];
    for (const effect of effects) {
      if (
        (!effect.isSelf() || (allowSelf && effect.isSelf())) &&
        (targetCards === undefined ||
          (targetCards instanceof CardCollection && targetCards.size() === 0) ||
          (targetCards instanceof CardCollection && effect.getCardEligibility().matchesAny(targetCards)) ||
          (targetCards instanceof Card && effect.getCardEligibility().matches(targetCards))) &&
        this.sharedGameState.isTurnEligibilitySatisfied(effect.getTurnEligibility()) &&
        !effect.hasExpired() &&
        effect.areOtherConditionsSatisfied(this)
      ) {
        applicableEffects.push(effect);
      }
    }

    return applicableEffects;
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
      } as CardChoice);
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
        } as CardChoice);
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
        } as MultiCardChoice);
      }
    }

    return potentialChoices;
  }

  public getAllExtraCards(): CardCollection {
    return this.sharedGameState.getAllExtraCards();
  }

  public setNumCardsToDrawInCleanup(numCardsToDrawInCleanup: number): void {
    this.player.getStatistics().setNumCardsToDrawInCleanup(numCardsToDrawInCleanup);
  }

  public forceFullBroadcastOfDiscard(): void {
    this.player.getOwnedCards().forceFullBroadcastOfDiscard();
  }

  public getNumEmptySupplyPiles(): number {
    return this.sharedGameState.piles.numEmptySupplyPiles;
  }

  public async gainHorse(n = 1, gainLocation: CardLocation = CardLocation.DISCARD): Promise<void> {
    for (let i = 0; i < n; i++) {
      await this.gainFromPile('Horse', gainLocation);
    }
  }

  /** Stub: exile support is not yet modeled separately from set-aside. */
  public async exileCardFromLocation(card: Card, location: CardLocation): Promise<void> {
    await this.setCardAsideFromLocation(card, location);
  }

  /** Stub: exile a card from supply (removes from pile, sets aside on current player). */
  public async exileFromSupply(cardChoice: Card | string): Promise<void> {
    const pileName = typeof cardChoice === 'string' ? cardChoice : cardChoice.getPileName();
    const card = this.sharedGameState.piles.removeTopCardFromPile(pileName);
    if (card !== undefined) {
      this.setCardAside(card, true);
    }
  }

  /** Stub: does not track true Exile zone, always false for now. */
  public hasExiledCopy(_cardName: string): boolean {
    return false;
  }

  /** Stub: no true Exile zone, no-op. */
  public async discardExiledCurses(): Promise<void> {
    //
  }

  /** Stub: no true Exile zone, no-op. */
  public async putExiledActionOntoDeck(): Promise<void> {
    //
  }

  /** Stub: track cards trashed by player to the right last turn. */
  public getNumCardsPlayerToRightTrashedOnLastTurn(): number {
    return 0;
  }

  /** Stub: Snowy Village behavior. */
  public ignoreFurtherAddedActionsThisTurn(): void {
    //
  }

  /** Stub: Mastermind behavior helper. */
  public async playActionFromHandNTimes(_n: number): Promise<void> {
    //
  }

  /** Replay a card currently in play without moving it. */
  public async replayCardInPlay(card: Card): Promise<void> {
    await card.play(this);
  }

  /** Stub: return card to its supply pile. */
  public returnCardToPile(_card: Card): void {
    //
  }

  /** Stub: once-per-game flag helper for events like Seize the Day. */
  public canUseOncePerGame(_key: string): boolean {
    return true;
  }

  /** Stub: once-per-game flag helper for events like Seize the Day. */
  public markUsedOncePerGame(_key: string): void {
    //
  }

  /** Stub: once-per-turn marker helper. */
  public canUseOncePerTurn(_key: string): boolean {
    return true;
  }

  /** Stub: once-per-turn marker helper. */
  public markUsedOncePerTurn(_key: string): void {
    //
  }

  /** Stub: number of differently named cards gained this turn. */
  public getNumDifferentlyNamedCardsGainedThisTurn(): number {
    return 0;
  }

  public getTopSupplyCards(): CardCollection {
    return this.sharedGameState.piles.getTopCardsOfSupplyPiles();
  }

  /** Stub: Invest tracking is not implemented yet. */
  public async investInActionFromSupply(_card: Card): Promise<void> {
    //
  }
}
