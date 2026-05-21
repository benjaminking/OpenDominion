import { describe, expect, it } from 'vitest';

import { GreaterThanCondition } from '../src/Conditions';
import { ConstantExpression } from '../src/Expressions';
import { ParsedRule } from '../src/ParsedRule';
import { createGameStateStub } from './TestFixtures';

describe('ParsedRule', () => {
  it('supports unconditional rules', () => {
    const rule = ParsedRule.unconditionalRule('Gold');

    expect(rule.getName()).toBe('Gold');
    expect(rule.conditionIsSatisfied(createGameStateStub() as never)).toBe(true);
  });

  it('supports conditional rules', () => {
    const rule = ParsedRule.conditionalRule(
      'Province',
      new GreaterThanCondition(new ConstantExpression(7), new ConstantExpression(3)),
    );

    expect(rule.conditionIsSatisfied(createGameStateStub() as never)).toBe(true);
  });
});
