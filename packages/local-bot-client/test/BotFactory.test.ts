import { describe, expect, it } from 'vitest';

import { BotFactory } from '../src/BotFactory';

describe('BotFactory', () => {
  it('creates a known predefined rule-based bot', () => {
    const bot = BotFactory.createRuleBasedBot('MilitiaBMBot');

    expect(bot.requiredCardNames).toEqual(['Militia']);
  });

  it('throws when strategy name is unknown', () => {
    expect(() => BotFactory.createRuleBasedBot('MissingStrategy')).toThrow();
  });
});
