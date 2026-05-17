import { Card } from "./card/Card";

export interface CardSortingFunction {
  order: (cardA: Card, cardB: Card) => number;
}

export class TreasureCoinSortingFunction implements CardSortingFunction {
  public order(cardA: Card, cardB: Card): number {
    return cardA.getCoins() - cardB.getCoins();
  }
}

export class NameSortingFunction implements CardSortingFunction {
  public order(cardA: Card, cardB: Card): number {
    return nameScore(cardA) - nameScore(cardB);
  }
}

function nameScore(card: Card): number {
  const SECOND_LETTER_WEIGHT = 676;
  const FIRST_LETTER_WEIGHT = 26;

  let val = 0;
  val +=
    FIRST_LETTER_WEIGHT * (card.getName().charCodeAt(0) - "k".charCodeAt(0));
  val +=
    SECOND_LETTER_WEIGHT * (card.getName().charCodeAt(1) - "k".charCodeAt(0));
  val += card.getName().charCodeAt(2) - "k".charCodeAt(0);
  return val;
}

export class CostSortingFunction implements CardSortingFunction {
  public order(cardA: Card, cardB: Card): number {
    if (cardA.getCost() === cardB.getCost()) {
      return new NameSortingFunction().order(cardA, cardB);
    }
    return cardB.getCost().coins - cardA.getCost().coins; // TODO: add potions and eebt
  }
}
