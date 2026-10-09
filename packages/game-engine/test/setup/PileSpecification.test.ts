import { CardType, Expansion, RandomizerRequirements } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { PileSpecification } from '../../src/setup/PileSpecification';

describe('PileSpecification', () => {
  it('returns the randomizer requirements it was created with', () => {
    const requirements: RandomizerRequirements = {
      requiredExpansions: [Expansion.DARK_AGES],
      requiredCoinCosts: [2, 3],
      requiredTypes: [CardType.ACTION],
    };

    expect(new PileSpecification(requirements).getRandomizerRequirements()).toBe(requirements);
    expect(new PileSpecification(requirements, true, true).getRandomizerRequirements()).toBe(requirements);
  });
});
