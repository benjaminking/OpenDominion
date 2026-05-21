import { describe, expect, it } from 'vitest';

import { CardNameWithCount, StartingDeckConfiguration } from '../../src/setup/StartingDeckConfiguration';

describe('CardNameWithCount', () => {
  it('expands the configured name into a repeated array', () => {
    expect(new CardNameWithCount('Copper', 3).asCardNameArray()).toEqual(['Copper', 'Copper', 'Copper']);
    expect(new CardNameWithCount('Estate', 0).asCardNameArray()).toEqual([]);
  });
});

describe('StartingDeckConfiguration', () => {
  it('flattens names in order and generates incrementing ids per card name', () => {
    const configuration = new StartingDeckConfiguration([
      new CardNameWithCount('Estate', 2),
      new CardNameWithCount('Copper', 1),
      new CardNameWithCount('Estate', 1),
    ]);

    expect(configuration.getCardNamesAndIds('player-1')).toEqual([
      { name: 'Estate', id: 'Estate_player-1_0' },
      { name: 'Estate', id: 'Estate_player-1_1' },
      { name: 'Copper', id: 'Copper_player-1_0' },
      { name: 'Estate', id: 'Estate_player-1_2' },
    ]);
  });
});
