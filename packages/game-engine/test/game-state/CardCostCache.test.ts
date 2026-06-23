import { describe, expect, it } from 'vitest';

import { Cost } from '../../src/card/Cost';
import { CardCostCache } from '../../src/game-state/CardCostCache';

describe('CardCostCache', () => {
  it('tracks whether any card cost changed during a check window', () => {
    const cache = new CardCostCache();

    expect(cache.haveCostsChanged()).toBe(false);

    cache.updateCostForCardName('Village', Cost.Simple(3));
    expect(cache.haveCostsChanged()).toBe(true);

    cache.startNewCostCheck();
    expect(cache.haveCostsChanged()).toBe(false);

    cache.updateCostForCardName('Village', Cost.Simple(3));
    expect(cache.haveCostsChanged()).toBe(false);

    cache.updateCostForCardName('Village', Cost.Simple(2));
    expect(cache.haveCostsChanged()).toBe(true);
  });
});
