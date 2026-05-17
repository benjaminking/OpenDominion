import { Card } from "./card/Card";
import { CardCollection } from "./card/CardCollection";

export class CardEligibilityFunction {
  protected internalFunction: (c: Card) => boolean;

  public constructor(internalFunction: (c: Card) => boolean) {
    this.internalFunction = internalFunction;
  }

  public matches(card: Card): boolean {
    return this.internalFunction(card);
  }

  public matchesAny(cards: CardCollection): boolean {
    return cards.doesAnyMatch(this);
  }

  public getMatchingCards(cards: CardCollection): CardCollection {
    return cards.getMatchingCards(this);
  }

  public getMatchingCardsUnique(cards: CardCollection): CardCollection {
    return cards.getMatchingCardsUnique(this);
  }

  public numMatchingCards(cards: CardCollection) {
    return cards.numMatchingCards(this);
  }
}
