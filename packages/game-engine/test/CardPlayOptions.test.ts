import { describe, expect, it } from 'vitest';

import { CardPlayOptions } from '../src/CardPlayOptions';

describe('CardPlayOptions', () => {
  it('builds default options and static presets', () => {
    expect(CardPlayOptions.DEFAULT.shouldUseAction).toBe(true);
    expect(CardPlayOptions.DEFAULT.shouldLog).toBe(true);

    expect(CardPlayOptions.DONT_USE_ACTION.shouldUseAction).toBe(false);
    expect(CardPlayOptions.DONT_USE_ACTION.shouldLog).toBe(true);

    expect(CardPlayOptions.DONT_LOG.shouldUseAction).toBe(true);
    expect(CardPlayOptions.DONT_LOG.shouldLog).toBe(false);
  });

  it('creates custom options through the builder', () => {
    const options = CardPlayOptions.builder().dontUseAction().dontLog().build();

    expect(options.shouldUseAction).toBe(false);
    expect(options.shouldLog).toBe(false);
  });
});
