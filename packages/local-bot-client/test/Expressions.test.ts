import { describe, expect, it } from 'vitest';

import {
  AdditionExpression,
  ConstantExpression,
  CountInDeckExpression,
  CountInPileExpression,
  DivisionExpression,
  MoneyInDeckExpression,
  MultiplicationExpression,
  SubtractionExpression,
} from '../src/Expressions';
import { createGameStateStub } from './TestFixtures';

describe('Expressions', () => {
  it('evaluates arithmetic expression trees', () => {
    const gameState = createGameStateStub() as never;
    const expression = new DivisionExpression(
      new MultiplicationExpression(
        new AdditionExpression(new ConstantExpression(8), new ConstantExpression(4)),
        new SubtractionExpression(new ConstantExpression(10), new ConstantExpression(7)),
      ),
      new ConstantExpression(3),
    );

    expect(expression.evaluate(gameState)).toBe(12);
  });

  it('reads values from game state for pile/deck/coins expressions', () => {
    const gameState = createGameStateStub({
      countInPile: (pileName) => (pileName === 'Province' ? 5 : 0),
      countInDeck: (cardName) => (cardName === 'Gold' ? 2 : 0),
      coinsInDeck: () => 17,
    }) as never;

    expect(new CountInPileExpression('Province').evaluate(gameState)).toBe(5);
    expect(new CountInDeckExpression('Gold').evaluate(gameState)).toBe(2);
    expect(new MoneyInDeckExpression().evaluate(gameState)).toBe(17);
  });
});
