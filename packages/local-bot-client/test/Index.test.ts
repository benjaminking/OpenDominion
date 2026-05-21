import { describe, expect, it } from 'vitest';

import { BotClient, BotDecisionService, BotFactory } from '../src';

describe('index exports', () => {
  it('re-exports the main public classes', () => {
    expect(BotClient).toBeDefined();
    expect(BotDecisionService).toBeDefined();
    expect(BotFactory).toBeDefined();
  });
});
