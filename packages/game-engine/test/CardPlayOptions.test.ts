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

    expect(CardPlayOptions.LEAVING_IT_THERE.shouldUseAction).toBe(false);
    expect(CardPlayOptions.LEAVING_IT_THERE.shouldLog).toBe(true);
  });

  it('does not leave cards in place unless asked to', () => {
    expect(CardPlayOptions.DEFAULT.leaveInPlace).toBe(false);
    expect(CardPlayOptions.DONT_USE_ACTION.leaveInPlace).toBe(false);
    expect(CardPlayOptions.DONT_LOG.leaveInPlace).toBe(false);
  });

  it('leaves cards in place for the leaving-it-there preset and the leaveItThere builder option', () => {
    expect(CardPlayOptions.LEAVING_IT_THERE.leaveInPlace).toBe(true);
    expect(CardPlayOptions.builder().leaveItThere().build().leaveInPlace).toBe(true);
  });

  it('creates custom options through the builder', () => {
    const options = CardPlayOptions.builder().dontUseAction().dontLog().build();

    expect(options.shouldUseAction).toBe(false);
    expect(options.shouldLog).toBe(false);
  });
});
