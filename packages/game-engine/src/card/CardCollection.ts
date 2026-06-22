import { CardMetadata, Expansion } from '@dominion/common';

import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { CardSortingFunction } from '../CardSortingFunctions';
import { ChangeListener } from '../ChangeListener';
import { Effect } from '../effects/Effect';
import { EffectTriggerType } from '../effects/EffectTriggerType';
import { CardCostCache } from '../game-state/CardCostCache';
import { ArrayIterator } from '../Iterator';
import { Card } from './Card';
import { CardGroup } from './CardGroup';
import { isFromExpansion } from '../StandardCardEligibilityFunctions';

export class CardCollection implements Iterable<Card> {
  protected cards: Card[] = [];

  public constructor(cardCollection?: Card | CardCollection) {
    if (cardCollection === undefined) {
      this.cards = [];
    } else if (cardCollection instanceof Card) {
      this.cards = [cardCollection];
    } else {
      this.cards = [...cardCollection.cards];
    }
  }

  public size(): number {
    return this.cards.length;
  }

  public isEmpty(): boolean {
    return this.cards.length === 0;
  }

  private changeListeners: ChangeListener[] = [];

  public static fromCards(cards: Card[]): CardCollection {
    const cardCollection: CardCollection = new CardCollection();
    cardCollection.cards = cards;
    return cardCollection;
  }

  public static emptyCollection(): CardCollection {
    return new CardCollection();
  }

  public asCardArray(): Card[] {
    return this.cards;
  }

  public clone(): CardCollection {
    return CardCollection.fromCards([...this.cards]);
  }

  public clear(): void {
    this.cards = [];
  }

  public contains(card: Card): boolean {
    return this.cards.find((c: Card) => c.getId() === card.getId()) !== undefined;
  }

  public onChange(changeListener: ChangeListener): void {
    this.changeListeners.push(changeListener);
  }

  private triggerChangeListeners(): void {
    for (const listener of this.changeListeners) {
      listener.trigger(this);
    }
  }

  public cardGroups(): CardGroup[] {
    const groupMap: Map<string, Card[]> = new Map<string, Card[]>();
    for (const card of this.cards) {
      if (!groupMap.has(card.getName())) {
        groupMap.set(card.getName(), []);
      }
      groupMap.get(card.getName())!.push(card);
    }

    const cardGroups: CardGroup[] = [];
    for (const cardGroup of groupMap.values()) {
      cardGroups.push(new CardGroup(cardGroup));
    }
    return cardGroups;
  }

  public cardCounts(): Map<string, number> {
    const cardCounts: Map<string, number> = new Map<string, number>();
    for (const card of this.cards) {
      if (!cardCounts.has(card.getName())) {
        cardCounts.set(card.getName(), 0);
      }
      cardCounts.set(card.getName(), cardCounts.get(card.getName())! + 1);
    }
    return cardCounts;
  }

  public addCard(additionalCard: Card): void {
    this.cards.push(additionalCard);
    this.triggerChangeListeners();
  }

  public addCards(additionalCards: Card[] | CardCollection): void {
    if (additionalCards instanceof CardCollection) {
      this.cards = this.cards.concat(additionalCards.cards);
    } else {
      this.cards = this.cards.concat(additionalCards);
    }
    this.triggerChangeListeners();
  }

  public removeCard(card: Card): Card | undefined {
    for (let index2 = 0; index2 < this.cards.length; ++index2) {
      if (card.getId() === this.cards[index2].getId()) {
        const removedCard = this.cards.splice(index2, 1)[0];
        this.triggerChangeListeners();
        return removedCard;
      }
    }
  }

  public removeCards(toRemove: CardCollection): CardCollection {
    this.cards = this.cards.filter(
      (card) => !toRemove.cards.some((toRemoveCard) => toRemoveCard.getId() === card.getId()),
    );
    this.triggerChangeListeners();
    return toRemove;
  }

  public totalScore(allCardGroups: CardCollection[]): number {
    let score = 0;
    for (const card of this.cards) {
      score += card.score(allCardGroups);
    }
    return score;
  }

  public getEffectsByType(trigger: EffectTriggerType): Effect[] {
    const effects: Effect[] = [];
    for (const card of this.cards) {
      for (const effect of card.getEffects()) {
        if (effect.getTrigger() === trigger) {
          effects.push(effect);
        }
      }
    }
    return effects;
  }

  public doesAnyMatch(cardEligibilityFunction: CardEligibilityFunction): boolean {
    for (const card of this.cards) {
      if (cardEligibilityFunction.matches(card)) {
        return true;
      }
    }

    return false;
  }

  public getMatchingCards(cardEligibilityFunction: CardEligibilityFunction): CardCollection {
    const matchingCards: CardCollection = new CardCollection();

    for (const card of this.cards) {
      if (cardEligibilityFunction.matches(card)) {
        matchingCards.addCard(card);
      }
    }

    return matchingCards;
  }

  public getMatchingCardsUnique(cardEligibilityFunction: CardEligibilityFunction): CardCollection {
    const matchingCards: CardCollection = new CardCollection();

    for (const cardGroup of this.cardGroups()) {
      if (cardEligibilityFunction.matches(cardGroup.example)) {
        matchingCards.addCard(cardGroup.example);
      }
    }
    return matchingCards;
  }

  public numMatchingCards(cardEligibilityFunction: CardEligibilityFunction): number {
    let numMatching = 0;
    for (const card of this.cards) {
      if (cardEligibilityFunction.matches(card)) {
        numMatching++;
      }
    }
    return numMatching;
  }

  [Symbol.iterator]() {
    return new ArrayIterator<Card>(this.cards);
  }

  public sorted(sortingFunction: CardSortingFunction): Iterable<Card> {
    const sortedCards: Card[] = this.cards.sort(sortingFunction.order);
    return {
      [Symbol.iterator]: () => new ArrayIterator<Card>(sortedCards),
    };
  }

  public getArbitraryCard(): Card {
    if (this.cards.length === 0) {
      throw new Error('Tried to get arbitrary card from empty card collection');
    }
    return this.cards[0];
  }

  public reportCardCosts(cardCostCache: CardCostCache): void {
    for (const card of this.cards) {
      cardCostCache.updateCostForCardName(card.getName(), card.getCost());
      if (cardCostCache.haveCostsChanged()) {
        break;
      }
    }
  }

  public toCardNameEligibilityFunction(): CardEligibilityFunction {
    const cardNames = new Set<string>(this.cards.map((c) => c.getName()));
    return new CardEligibilityFunction((card: Card) => cardNames.has(card.getName()));
  }

  public getProportionFromExpansion(expansion: Expansion): number {
    return this.numMatchingCards(isFromExpansion(expansion)) / this.size();
  }

  public getCardByMetadata(cardMetadata: CardMetadata): Card | undefined {
    for (const card of this.cards) {
      if (card.getId() === cardMetadata.id) {
        return card;
      }
    }
  }

  public toCardMetadataArray(): CardMetadata[] {
    return this.cards.map((x) => x.getMetadata());
  }

  public toCardNameArray(): string[] {
    return this.cards.map((x) => x.getName());
  }

  public print(): string {
    if (this.size() === 0) {
      return 'no cards';
    }

    const cardCounts: Map<string, number> = this.cardCounts();
    let cardCounter = 0;
    let cardStr = '';
    for (const cardName of cardCounts.keys()) {
      if (cardCounter > 0 && cardCounts.size > 2) {
        cardStr += ', ';
      }
      if (cardCounter > 0 && cardCounter === cardCounts.size - 1) {
        cardStr += ' and ';
      }

      if (cardCounts.get(cardName) === 1) {
        cardStr += 'a ' + cardName;
      } else {
        cardStr += cardCounts.get(cardName)!.toFixed() + ' ' + cardName + (cardCounts.get(cardName)! > 1 ? 's' : '');
      }
      cardCounter++;
    }

    return cardStr;
  }
}
