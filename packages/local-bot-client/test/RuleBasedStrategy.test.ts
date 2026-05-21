import { describe, expect, it } from 'vitest';

import { GreaterThanCondition, LessThanCondition } from '../src/Conditions';
import { ConstantExpression } from '../src/Expressions';
import { ParsedRule } from '../src/ParsedRule';
import { RuleBasedStrategy } from '../src/RuleBasedStrategy';
import { createCardChoice, createGameStateStub } from './TestFixtures';

describe('RuleBasedStrategy', () => {
  it('returns the first applicable choice by rule order', () => {
    const strategy = new RuleBasedStrategy();
    strategy.addRule(
      ParsedRule.conditionalRule('Gold', new LessThanCondition(new ConstantExpression(1), new ConstantExpression(0))),
    );
    strategy.addRule(
      ParsedRule.conditionalRule(
        'Silver',
        new GreaterThanCondition(new ConstantExpression(2), new ConstantExpression(1)),
      ),
    );

    const options = [createCardChoice('Gold'), createCardChoice('Silver')] as never;

    expect(strategy.getFirstApplicableRule(createGameStateStub() as never, options)?.card.name).toBe('Silver');
  });

  it('returns undefined when no options satisfy the rule set', () => {
    const strategy = new RuleBasedStrategy();
    strategy.addRule(ParsedRule.unconditionalRule('Province'));

    const options = [createCardChoice('Gold')] as never;

    expect(strategy.getFirstApplicableRule(createGameStateStub() as never, options)).toBeUndefined();
  });
});
