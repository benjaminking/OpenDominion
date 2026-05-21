import { describe, expect, it } from 'vitest';

import { BotClient } from '../src/BotClient';

describe('BotClient', () => {
  it('constructs without throwing and exposes a decision service', () => {
    const botClient = new BotClient();

    expect(botClient.getDecisionService()).toBeDefined();
  });
});
