import { Expansion, Mechanic } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Card } from '../../src/card/Card';
import { KingdomCard } from '../../src/card/KingdomCard';
import { Randomizers } from '../../src/setup/Randomizers';

const createRandomizer = ({
  name,
  expansion,
  mechanics = [],
}: {
  name: string;
  expansion: Expansion;
  mechanics?: Mechanic[];
}): KingdomCard => {
  return {
    getName: () => name,
    isFromExpansion: (candidate: Expansion) => candidate === expansion,
    usesMechanic: (candidate: Mechanic) => mechanics.includes(candidate),
  } as unknown as KingdomCard;
};

describe('Randomizers', () => {
  it('detects whether any randomizer uses a mechanic and reports expansion proportions', () => {
    const village = createRandomizer({
      name: 'Village',
      expansion: Expansion.BASE,
    });
    const bishop = createRandomizer({
      name: 'Bishop',
      expansion: Expansion.PROSPERITY,
      mechanics: [Mechanic.VP_CHIPS],
    });
    const goons = createRandomizer({
      name: 'Goons',
      expansion: Expansion.PROSPERITY,
      mechanics: [Mechanic.VP_CHIPS],
    });
    const randomizers = new Randomizers([village, bishop, goons]);

    expect(randomizers.hasCardUsingMechanic(Mechanic.VP_CHIPS)).toBe(true);
    expect(randomizers.hasCardUsingMechanic(Mechanic.DEBT)).toBe(false);
    expect(randomizers.getProportionFromExpansion(Expansion.PROSPERITY)).toBeCloseTo(2 / 3);
    expect(randomizers.getProportionFromExpansion(Expansion.BASE)).toBeCloseTo(1 / 3);
    expect(randomizers.getCards()).toEqual([village, bishop, goons] as Card[]);
  });
});
