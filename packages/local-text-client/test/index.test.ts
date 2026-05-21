import { describe, expect, it } from 'vitest';

import { ConsoleLogPrinter, TextBasedDecisionService } from '../src';

describe('index exports', () => {
  it('re-exports ConsoleLogPrinter and TextBasedDecisionService', () => {
    expect(ConsoleLogPrinter).toBeDefined();
    expect(TextBasedDecisionService).toBeDefined();
  });
});
