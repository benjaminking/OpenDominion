import { describe, expect, it } from 'vitest';

import { Corsair } from '../../../src/cards/seaside/Corsair';
import { createCardHarness } from '../testHarness';

describe('Corsair', () => {
  it('adds $2 and registers a duration effect', async () => {
    const testHarness = createCardHarness();
    await new Corsair(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(2);
    expect(testHarness.effects.addEffect).toHaveBeenCalled();
  });

  it('treasureTrashAttack registers an effect on the target player', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();

    await new Corsair(testHarness.sharedGameState).treasureTrashAttack(targetHarness.player, testHarness.player);

    expect(targetHarness.effects.addEffect).toHaveBeenCalledTimes(1);
  });
});
