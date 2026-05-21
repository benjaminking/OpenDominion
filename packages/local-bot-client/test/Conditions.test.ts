import { describe, expect, it } from 'vitest';

import {
  ActionTokenCondition,
  CardTokenCondition,
  ConjunctionCondition,
  DisjunctionCondition,
  EqualityCondition,
  GreaterThanCondition,
  GreaterThanOrEqualCondition,
  LessThanCondition,
  LessThanOrEqualCondition,
  TrueCondition,
} from '../src/Conditions';
import { ConstantExpression } from '../src/Expressions';
import { createGameStateStub } from './TestFixtures';

describe('Conditions', () => {
  it('evaluates boolean composition and numeric comparisons', () => {
    const gameState = createGameStateStub() as never;

    expect(new TrueCondition().matches(gameState)).toBe(true);
    expect(
      new ConjunctionCondition([
        new EqualityCondition(new ConstantExpression(3), new ConstantExpression(3)),
        new LessThanCondition(new ConstantExpression(2), new ConstantExpression(5)),
      ]).matches(gameState),
    ).toBe(true);
    expect(
      new DisjunctionCondition([
        new GreaterThanCondition(new ConstantExpression(1), new ConstantExpression(5)),
        new GreaterThanOrEqualCondition(new ConstantExpression(8), new ConstantExpression(8)),
      ]).matches(gameState),
    ).toBe(true);
    expect(new LessThanOrEqualCondition(new ConstantExpression(9), new ConstantExpression(4)).matches(gameState)).toBe(
      false,
    );
  });

  it('returns false for currently-unimplemented token conditions', () => {
    const gameState = createGameStateStub() as never;

    expect(new ActionTokenCondition('Village').matches(gameState)).toBe(false);
    expect(new CardTokenCondition('Village').matches(gameState)).toBe(false);
  });
});
