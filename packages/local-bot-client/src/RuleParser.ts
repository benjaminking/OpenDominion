import {
  ActionTokenCondition,
  CardTokenCondition,
  Condition,
  ConjunctionCondition,
  DisjunctionCondition,
  EqualityCondition,
  GreaterThanCondition,
  GreaterThanOrEqualCondition,
  LessThanCondition,
  LessThanOrEqualCondition,
  TrueCondition,
} from './Conditions';
import {
  AdditionExpression,
  //AllCardsInDeckCountExpression,
  ConstantExpression,
  CountInDeckExpression,
  CountInPileExpression,
  //CountInHandExpression,
  //CountInPileExpression,
  //CountInPlayExpression,
  //CurrentBuysExpression,
  //CurrentCoinsExpression,
  DivisionExpression,
  Expression,
  //GainsNeededToEndExpression,
  MoneyInDeckExpression,
  MultiplicationExpression,
  //NumEmptyPilesExpression,
  //OtherScoreExpression,
  //ScoreExpression,
  SubtractionExpression,
  //TurnNumberExpression,
  //TypeCountInDeckExpression,
} from './Expressions';
import { ParsedRule } from './ParsedRule';
import { Rule } from './Rule';

export class RuleParser {
  public parseRule(rule: Rule): ParsedRule {
    if (rule.conditions) {
      const condition: Condition = this.parseConditions(rule.conditions);
      return ParsedRule.conditionalRule(rule.name, condition);
    } else {
      return ParsedRule.unconditionalRule(rule.name);
    }
  }

  private parseConditions(ruleStr: string): Condition {
    if (ruleStr.match(/ OR /)) {
      return this.parseDisjunction(ruleStr);
    } else if (ruleStr.match(/ AND /)) {
      return this.parseConjunction(ruleStr);
    } else if (ruleStr.match(/ == /)) {
      return this.parseEquality(ruleStr);
    } else if (ruleStr.match(/ <= /)) {
      return this.parseLessThanOrEqual(ruleStr);
    } else if (ruleStr.match(/ >= /)) {
      return this.parseGreaterThanOrEqual(ruleStr);
    } else if (ruleStr.match(/ < /)) {
      return this.parseLessThan(ruleStr);
    } else if (ruleStr.match(/ > /)) {
      return this.parseGreaterThan(ruleStr);
    } else if (ruleStr.match(/(\w+)\[(\w+?)\]/)) {
      return this.parseMappedCondition(ruleStr);
    } else {
      return this.parseOtherCondition(ruleStr);
    }
  }

  private parseDisjunction(ruleStr: string): Condition {
    const disjunctions: Condition[] = [];
    for (const section of ruleStr.split(/ OR /)) {
      disjunctions.push(this.parseConditions(section));
    }
    return new DisjunctionCondition(disjunctions);
  }

  private parseConjunction(ruleStr: string): Condition {
    const conjunctions: Condition[] = [];
    for (const section of ruleStr.split(/ AND /)) {
      conjunctions.push(this.parseConditions(section));
    }
    return new ConjunctionCondition(conjunctions);
  }

  private parseEquality(ruleStr: string): Condition {
    const sides = ruleStr.split(/ == /);
    const leftSide: Expression = this.parseExpression(sides[0]);
    const rightSide: Expression = this.parseExpression(sides[1]);
    return new EqualityCondition(leftSide, rightSide);
  }

  private parseLessThanOrEqual(ruleStr: string): Condition {
    const sides = ruleStr.split(/ <= /);
    const leftSide: Expression = this.parseExpression(sides[0]);
    const rightSide: Expression = this.parseExpression(sides[1]);
    return new LessThanOrEqualCondition(leftSide, rightSide);
  }

  private parseGreaterThanOrEqual(ruleStr: string): Condition {
    const sides = ruleStr.split(/ >= /);
    const leftSide: Expression = this.parseExpression(sides[0]);
    const rightSide: Expression = this.parseExpression(sides[1]);
    return new GreaterThanOrEqualCondition(leftSide, rightSide);
  }

  private parseLessThan(ruleStr: string): Condition {
    const sides = ruleStr.split(/ < /);
    const leftSide: Expression = this.parseExpression(sides[0]);
    const rightSide: Expression = this.parseExpression(sides[1]);
    return new LessThanCondition(leftSide, rightSide);
  }

  private parseGreaterThan(ruleStr: string): Condition {
    const sides = ruleStr.split(/ > /);
    const leftSide: Expression = this.parseExpression(sides[0]);
    const rightSide: Expression = this.parseExpression(sides[1]);
    return new GreaterThanCondition(leftSide, rightSide);
  }

  private parseMappedCondition(ruleStr: string): Condition {
    const bracketRegex = /(\w+)\[(\w+?)\]/;
    const matches: RegExpExecArray = bracketRegex.exec(ruleStr) as RegExpExecArray;
    if (matches[1] === 'isActionTokenOnPile') {
      return new ActionTokenCondition(matches[2]);
    } else if (matches[1] === 'isCardTokenOnPile') {
      return new CardTokenCondition(matches[2]);
    }
    return new TrueCondition();
  }

  private parseOtherCondition(ruleStr: string): Condition {
    /*if (ruleStr.match(/isActionPhase/)) {
      return new ActionPhaseCondition();
    } else*/ if (ruleStr.match(/true/)) {
      return new TrueCondition();
    }
    return new TrueCondition();
  }

  private parseExpression(ruleStr: string): Expression {
    if (ruleStr.match(/ \+ /)) {
      return this.parseAddition(ruleStr);
    } else if (ruleStr.match(/ - /)) {
      return this.parseSubtraction(ruleStr);
    } else if (ruleStr.match(/ \/ /)) {
      return this.parseDivision(ruleStr);
    } else if (ruleStr.match(/ \* /)) {
      return this.parseMultiplication(ruleStr);
    } else if (ruleStr.match(/(\w+)\[(\w+?)\]/)) {
      return this.parseMappedExpression(ruleStr);
    } else {
      return this.parseOtherExpression(ruleStr);
    }
  }

  private parseAddition(ruleStr: string): Expression {
    const sides = ruleStr.split(/ \+ /);
    const leftSide: Expression = this.parseExpression(sides[0]);
    const rightSide: Expression = this.parseExpression(sides[1]);
    return new AdditionExpression(leftSide, rightSide);
  }

  private parseSubtraction(ruleStr: string): Expression {
    const sides = ruleStr.split(/ - /);
    const leftSide: Expression = this.parseExpression(sides[0]);
    const rightSide: Expression = this.parseExpression(sides[1]);
    return new SubtractionExpression(leftSide, rightSide);
  }

  private parseMultiplication(ruleStr: string): Expression {
    const sides = ruleStr.split(/ \* /);
    const leftSide: Expression = this.parseExpression(sides[0]);
    const rightSide: Expression = this.parseExpression(sides[1]);
    return new MultiplicationExpression(leftSide, rightSide);
  }

  private parseDivision(ruleStr: string): Expression {
    const sides = ruleStr.split(/ \/ /);
    const leftSide: Expression = this.parseExpression(sides[0]);
    const rightSide: Expression = this.parseExpression(sides[1]);
    return new DivisionExpression(leftSide, rightSide);
  }

  private parseMappedExpression(ruleStr: string): Expression {
    const bracketRegex = /(\w+)\[(\w+?)\]/;
    const matches: RegExpExecArray = bracketRegex.exec(ruleStr) as RegExpExecArray;
    if (matches[1] === 'countInPile') {
      return new CountInPileExpression(matches[2]);
    } else if (matches[1] === 'countInDeck') {
      return new CountInDeckExpression(matches[2]);
    } /*else if (matches[1] === "countInPlay") {
      return new CountInPlayExpression(matches[2]);
    } else if (matches[1] === "countInHand") {
      return new CountInHandExpression(matches[2]);
    } else if (matches[1] === "countTypeInDeck") {
      return new TypeCountInDeckExpression(matches[2]);
    }*/
    /*else if(matches[1] === 'countOnTavernMat') {
            return function() {
                return this._getGameLogic().numMatchingCardsInCollection(this._getGameState().tavernMat, function(card) { return card.getName() === matches[2]; });
            }.bind(this);
        }*/
    return new ConstantExpression(0);
  }

  private parseOtherExpression(ruleStr: string): Expression {
    /*if (ruleStr.match(/allCardsInDeck/)) {
      return new AllCardsInDeckCountExpression();
    } else*/ if (ruleStr.match(/moneyInDeck/)) {
      return new MoneyInDeckExpression();
    } /*else if (ruleStr.match(/currentMoney/)) {
      return new CurrentCoinsExpression();
    } else if (ruleStr.match(/currentBuys/)) {
      return new CurrentBuysExpression();
    } else if (ruleStr.match(/gainsNeededToEnd/)) {
      return new GainsNeededToEndExpression();
    } else if (ruleStr.match(/myScore/)) {
      return new ScoreExpression();
    } else if (ruleStr.match(/otherScore/)) {
      return new OtherScoreExpression();
    } else if (ruleStr.match(/turnNumber/)) {
      return new TurnNumberExpression();
    } else if (ruleStr.match(/numEmptyPiles/)) {
      return new NumEmptyPilesExpression();
    }*/ else if (ruleStr.match(/\d+/)) {
      return new ConstantExpression(parseInt(ruleStr));
    }
    return new ConstantExpression(0);
  }
}
