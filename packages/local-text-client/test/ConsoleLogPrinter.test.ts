import { LogMessageType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { ConsoleLogPrinter } from '../src/ConsoleLogPrinter';
import { createLogMessage } from './TestFixtures';

describe('ConsoleLogPrinter', () => {
  it('prints turn start messages with separator', () => {
    const printer = new ConsoleLogPrinter();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    printer.sendLogMessage(createLogMessage({ type: LogMessageType.TURN_START, text: 'starts turn' }) as never);

    expect(logSpy).toHaveBeenNthCalledWith(1, '\nAlice starts turn');
    expect(logSpy).toHaveBeenNthCalledWith(2, '====================================');

    logSpy.mockRestore();
  });

  it('replaces card placeholder in normal messages using card formatter', () => {
    const printer = new ConsoleLogPrinter();
    (printer as unknown as { cardFormatter: { format: (logMessage: unknown) => string } }).cardFormatter = {
      format: () => 'a Village',
    };

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    printer.sendLogMessage(createLogMessage({ text: 'gains %c' }) as never);

    expect(logSpy).toHaveBeenCalledWith('Alice gains a Village');

    logSpy.mockRestore();
  });
});
