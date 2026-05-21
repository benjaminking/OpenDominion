import { describe, expect, it } from 'vitest';

import { MilitiaBMBot, SmithyBMBot } from '../src/PredefinedStrategies';

describe('PredefinedStrategies', () => {
  it('exports Smithy strategy with required card and rules', () => {
    expect(SmithyBMBot.requiredCards).toEqual(['Smithy']);
    expect(SmithyBMBot.rules.length).toBeGreaterThan(0);
    expect(SmithyBMBot.rules[0].name).toBe('Province');
  });

  it('exports Militia strategy with required card and rules', () => {
    expect(MilitiaBMBot.requiredCards).toEqual(['Militia']);
    expect(MilitiaBMBot.rules.length).toBeGreaterThan(0);
    expect(MilitiaBMBot.rules.some((rule) => rule.name === 'Militia')).toBe(true);
  });
});
