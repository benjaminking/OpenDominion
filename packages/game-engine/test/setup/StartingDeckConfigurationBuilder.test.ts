import { describe, expect, it } from 'vitest';

import { StartingDeckConfigurationBuilder } from '../../src/setup/StartingDeckConfigurationBuilder';

describe('StartingDeckConfigurationBuilder', () => {
  it('builds the default starting deck with three estates and seven coppers', () => {
    const configuration = new StartingDeckConfigurationBuilder().build();

    expect(configuration.getCardNamesAndIds('default').map(({ name }) => name)).toEqual([
      'Estate',
      'Estate',
      'Estate',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
    ]);
  });

  it('replaces estates with shelters and subtracts each heirloom from the copper count', () => {
    const configuration = new StartingDeckConfigurationBuilder()
      .useShelters()
      .useHeirloom('Goat')
      .useHeirloom('Magic Lamp')
      .build();

    expect(configuration.getCardNamesAndIds('shelters').map(({ name }) => name)).toEqual([
      'Hovel',
      'Overgrown Estate',
      'Necropolis',
      'Goat',
      'Magic Lamp',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
      'Copper',
    ]);
  });
});
