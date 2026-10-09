import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Souk } from '../../../src/cards/hinterlands/Souk';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { CardHarness, createCardHarness } from '../testHarness';

const addCoppersToHand = (testHarness: CardHarness, numCoppers: number): Copper[] => {
  const coppers: Copper[] = [];
  for (let i = 0; i < numCoppers; i++) {
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId(`copper-hand-${String(i)}`);
    testHarness.addToHand(handCopper);
    coppers.push(handCopper);
  }
  return coppers;
};

describe('Souk', () => {
  it('adds a buy and $7 minus $1 per card in hand', async () => {
    const testHarness = createCardHarness();
    addCoppersToHand(testHarness, 3);

    await new Souk(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.stats.coins).toBe(4);
  });

  it('cannot take you below $0', async () => {
    const testHarness = createCardHarness();
    addCoppersToHand(testHarness, 9);

    await new Souk(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(0);
  });

  it('when gained, trashes up to 2 cards from hand', async () => {
    const testHarness = createCardHarness();
    const handCoppers = addCoppersToHand(testHarness, 3);
    const souk = new Souk(testHarness.sharedGameState);
    souk.setId('souk-gained');
    testHarness.addToDiscard(souk);
    const [onGain] = testHarness.getCardEffects(souk, EffectTriggerType.GAIN);

    testHarness.pickCards([handCoppers[0], handCoppers[1]]);
    await onGain.doAction(testHarness.executor, souk);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.sharedTrash.size()).toBe(2);
    expect(testHarness.sharedTrash.contains(handCoppers[0])).toBe(true);
    expect(testHarness.sharedTrash.contains(handCoppers[1])).toBe(true);
  });

  it('when gained, may trash nothing', async () => {
    const testHarness = createCardHarness();
    addCoppersToHand(testHarness, 3);
    const souk = new Souk(testHarness.sharedGameState);
    souk.setId('souk-gained');
    testHarness.addToDiscard(souk);
    const [onGain] = testHarness.getCardEffects(souk, EffectTriggerType.GAIN);

    await onGain.doAction(testHarness.executor, souk);

    expect(testHarness.hand.size()).toBe(3);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });
});
