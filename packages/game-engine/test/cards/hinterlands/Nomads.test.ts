import { describe, expect, it } from 'vitest';

import { Nomads } from '../../../src/cards/hinterlands/Nomads';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { createCardHarness } from '../testHarness';

describe('Nomads', () => {
  it('adds a buy and $2', async () => {
    const testHarness = createCardHarness();

    await new Nomads(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(2);
  });

  it('gives +$2 when gained', async () => {
    const testHarness = createCardHarness();
    const nomads = new Nomads(testHarness.sharedGameState);
    nomads.setId('nomads-gained');
    testHarness.addToDiscard(nomads);
    const [onGain] = testHarness.getCardEffects(nomads, EffectTriggerType.GAIN);

    await onGain.doAction(
      testHarness.executor,
      new EffectContextBuilder().withTargetCard(nomads).withGainLocation(nomads.getLocation()).build(),
    );

    expect(testHarness.stats.coins).toBe(2);
  });

  it('gives +$2 when trashed', async () => {
    const testHarness = createCardHarness();
    const nomads = new Nomads(testHarness.sharedGameState);
    nomads.setId('nomads-trashed');
    await testHarness.executor.trashCard(nomads);
    const [onTrash] = testHarness.getCardEffects(nomads, EffectTriggerType.TRASH);

    await onTrash.doAction(testHarness.executor, new EffectContextBuilder().withTargetCard(nomads).build());

    expect(testHarness.stats.coins).toBe(2);
  });
});
