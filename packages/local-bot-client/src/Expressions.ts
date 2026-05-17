import { ClientGameState } from '@dominion/client-common';

export abstract class Expression {
  public abstract evaluate(gameState: ClientGameState): number;
}

export class ConstantExpression extends Expression {
  private value = 0;
  public constructor(value: number) {
    super();
    this.value = value;
  }

  public evaluate(_gameState: ClientGameState): number {
    return this.value;
  }
}

export class AdditionExpression extends Expression {
  private leftSide: Expression;
  private rightSide: Expression;

  public constructor(leftSide: Expression, rightSide: Expression) {
    super();
    this.leftSide = leftSide;
    this.rightSide = rightSide;
  }

  public evaluate(gameState: ClientGameState): number {
    return this.leftSide.evaluate(gameState) + this.rightSide.evaluate(gameState);
  }
}

export class SubtractionExpression extends Expression {
  private leftSide: Expression;
  private rightSide: Expression;

  public constructor(leftSide: Expression, rightSide: Expression) {
    super();
    this.leftSide = leftSide;
    this.rightSide = rightSide;
  }

  public evaluate(gameState: ClientGameState): number {
    return this.leftSide.evaluate(gameState) - this.rightSide.evaluate(gameState);
  }
}

export class MultiplicationExpression extends Expression {
  private leftSide: Expression;
  private rightSide: Expression;

  public constructor(leftSide: Expression, rightSide: Expression) {
    super();
    this.leftSide = leftSide;
    this.rightSide = rightSide;
  }

  public evaluate(gameState: ClientGameState): number {
    return this.leftSide.evaluate(gameState) * this.rightSide.evaluate(gameState);
  }
}

export class DivisionExpression extends Expression {
  private leftSide: Expression;
  private rightSide: Expression;

  public constructor(leftSide: Expression, rightSide: Expression) {
    super();
    this.leftSide = leftSide;
    this.rightSide = rightSide;
  }

  public evaluate(gameState: ClientGameState): number {
    return this.leftSide.evaluate(gameState) / this.rightSide.evaluate(gameState);
  }
}

/*export class AllCardsInDeckCountExpression extends Expression {
  public evaluate(gameState: ClientGameState): number {
    return (
      gameState.deck.size +
      gameState.discard.size +
      gameState.hand.size +
      gameState.inPlay.size
    ); // + gameState.tavernMat.size + gameState.cell.size;
  }
}*/

export class CountInPileExpression extends Expression {
  private pileName: string;

  public constructor(pileName: string) {
    super();
    this.pileName = pileName;
  }

  public evaluate(gameState: ClientGameState): number {
    return gameState.piles.getCountInPile(this.pileName);
  }
}

export class CountInDeckExpression extends Expression {
  private cardName: string;

  public constructor(cardName: string) {
    super();
    this.cardName = cardName;
  }

  public evaluate(gameState: ClientGameState): number {
    return gameState.botStatistics.getCountInDeck(this.cardName);
  }
}

/*export class CountInPlayExpression extends Expression {
  private cardNameIs: CardEligibilityFunction;

  public constructor(cardName: string) {
    super();
    this.cardNameIs = cardNameIs(cardName);
  }

  public evaluate(gameState: ClientGameState): number {
    return this.cardNameIs.numMatchingCards(gameState.inPlay);
  }
}

export class CountInHandExpression extends Expression {
  private cardNameIs: CardEligibilityFunction;

  public constructor(cardName: string) {
    super();
    this.cardNameIs = cardNameIs(cardName);
  }

  public evaluate(gameState: ClientGameState): number {
    return this.cardNameIs.numMatchingCards(gameState.hand);
  }
}

export class TypeCountInDeckExpression extends Expression {
  private cardType: CardType;

  public constructor(cardType: string) {
    super();
    this.cardType = cardType as CardType;
  }

  public evaluate(gameState: ClientGameState): number {
    return gameState.getTypeCountInDeck(this.cardType);
  }
}

export class GainsNeededToEndExpression extends Expression {
  public evaluate(gameState: ClientGameState): number {
    return gameState.piles.getGainsNeededToEnd();
  }
}*/

export class MoneyInDeckExpression extends Expression {
  public evaluate(gameState: ClientGameState): number {
    return gameState.botStatistics.getCoinsInDeck();
  }
}

/*export class CurrentCoinsExpression extends Expression {
  public evaluate(gameState: ClientGameState): number {
    return gameState.coins;
  }
}

export class CurrentBuysExpression extends Expression {
  public evaluate(gameState: ClientGameState): number {
    return gameState.buys;
  }
}

export class ScoreExpression extends Expression {
  public evaluate(gameState: ClientGameState): number {
    return gameState.score;
  }
}

export class OtherScoreExpression extends Expression {
  public evaluate(gameState: ClientGameState): number {
    return gameState.getScoreByName(gameState.getLeftPlayerUsername());
  }
}

export class TurnNumberExpression extends Expression {
  public evaluate(gameState: ClientGameState): number {
    return gameState.turnNumber;
  }
}

export class NumEmptyPilesExpression extends Expression {
  public evaluate(gameState: ClientGameState): number {
    return gameState.piles.numEmptySupplyPiles;
  }
}*/
