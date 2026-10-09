import { CardLocation, CardType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Spoils } from '../../../src/cards/dark_ages/Spoils';
import { createCardHarness } from '../testHarness';

const setUp = () => {
  const testHarness = createCardHarness();
  testHarness.pileCards.set('Spoils', []);
  const spoils = new Spoils(testHarness.sharedGameState);
  spoils.setId('spoils-in-play');
  testHarness.addToInPlay(spoils);
  return { testHarness, spoils };
};

describe('Spoils', () => {
  it('is a Treasure worth $3', () => {
    const { spoils } = setUp();

    expect(spoils.hasType(CardType.TREASURE)).toBe(true);
    expect(spoils.getCoins()).toBe(3);
  });

  it('gives +$3 and returns itself to the Spoils pile', async () => {
    const { testHarness, spoils } = setUp();

    await spoils.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(3);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.pileCards.get('Spoils')?.map((card) => card.getId())).toEqual(['spoils-in-play']);
    expect(spoils.getLocation()).toBe(CardLocation.PILE);
  });

  it('still gives +$3 when it cannot be returned to the pile', async () => {
    const { testHarness, spoils } = setUp();
    testHarness.sharedGameState.blockCardFromMoving(spoils);

    await spoils.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(3);
    expect(testHarness.inPlay.asCardArray().map((card) => card.getId())).toEqual(['spoils-in-play']);
    expect(testHarness.pileCards.get('Spoils')).toHaveLength(0);
  });

  it('gives +$3 again but is not returned twice when played a second time (e.g. Crown)', async () => {
    const { testHarness, spoils } = setUp();

    await spoils.play(testHarness.executor);
    await spoils.play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(6);
    expect(testHarness.pileCards.get('Spoils')?.map((card) => card.getId())).toEqual(['spoils-in-play']);
  });
});
