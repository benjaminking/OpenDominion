import { describe, expect, it } from 'vitest';

import { RuleParser } from '../src/RuleParser';
import { createGameStateStub } from './TestFixtures';

describe('RuleParser', () => {
  it('parses unconditional rules', () => {
    const parser = new RuleParser();
    const parsed = parser.parseRule({ name: 'Gold' });

    expect(parsed.getName()).toBe('Gold');
    expect(parsed.conditionIsSatisfied(createGameStateStub() as never)).toBe(true);
  });

  it('parses arithmetic and comparison expressions in conditions', () => {
    const parser = new RuleParser();
    const parsed = parser.parseRule({
      name: 'Province',
      conditions: 'countInDeck[Gold] + 1 >= countInPile[Province] / 2',
    });

    const gameState = createGameStateStub({
      countInDeck: (cardName) => (cardName === 'Gold' ? 4 : 0),
      countInPile: (pileName) => (pileName === 'Province' ? 8 : 0),
    }) as never;

    expect(parsed.conditionIsSatisfied(gameState)).toBe(true);
  });

  it('parses disjunction and conjunction operators', () => {
    const parser = new RuleParser();
    const parsed = parser.parseRule({
      name: 'Silver',
      conditions: 'falseCondition > 0 OR countInPile[Province] <= 3 AND moneyInDeck >= 0',
    });

    const gameState = createGameStateStub({
      countInPile: (pileName) => (pileName === 'Province' ? 2 : 0),
      coinsInDeck: () => 10,
    }) as never;

    expect(parsed.conditionIsSatisfied(gameState)).toBe(true);
  });
});
