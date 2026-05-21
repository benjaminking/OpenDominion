import { describe, expect, it } from 'vitest';

import { ConsoleCardFormatter } from '../src/ConsoleCardFormatter';
import { createCardMetadata, createLogMessage } from './TestFixtures';

describe('ConsoleCardFormatter', () => {
  it('formats empty and anonymous-only card sets', () => {
    const formatter = new ConsoleCardFormatter();

    expect(formatter.format(createLogMessage({ knownCards: [], numUnknownCards: 0 }) as never)).toBe('no cards');
    expect(formatter.format(createLogMessage({ knownCards: [], numUnknownCards: 1 }) as never)).toBe('a card');
    expect(formatter.format(createLogMessage({ knownCards: [], numUnknownCards: 3 }) as never)).toBe('3 cards');
  });

  it('formats fully specified and semi-anonymous card sets', () => {
    const formatter = new ConsoleCardFormatter();

    expect(
      formatter.format(
        createLogMessage({
          knownCards: [createCardMetadata('Village'), createCardMetadata('Village', 'village-2')],
          numUnknownCards: 0,
        }) as never,
      ),
    ).toBe('2 Villages');

    expect(
      formatter.format(createLogMessage({ knownCards: [createCardMetadata('Silver')], numUnknownCards: 1 }) as never),
    ).toBe('a Silver and another card');
  });
});
