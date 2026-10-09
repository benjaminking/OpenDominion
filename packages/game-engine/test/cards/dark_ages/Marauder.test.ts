import { describe, expect, it } from 'vitest';

import { Marauder } from '../../../src/cards/dark_ages/Marauder';
import { RuinedVillage } from '../../../src/cards/dark_ages/RuinedVillage';
import { Spoils } from '../../../src/cards/dark_ages/Spoils';
import { Survivors } from '../../../src/cards/dark_ages/Survivors';
import { createCardHarness } from '../testHarness';

const setUp = () => {
  const testHarness = createCardHarness();
  const targetHarness = createCardHarness();
  testHarness.routeAttacksTo(targetHarness);
  const spoils = new Spoils(testHarness.sharedGameState);
  spoils.setId('spoils-pile-0');
  testHarness.pileCards.set('Spoils', [spoils]);
  const ruinedVillage = new RuinedVillage(targetHarness.sharedGameState);
  ruinedVillage.setId('ruined-village-pile-0');
  const survivors = new Survivors(targetHarness.sharedGameState);
  survivors.setId('survivors-pile-1');
  targetHarness.pileCards.set('Ruins', [ruinedVillage, survivors]);
  return { testHarness, targetHarness };
};

describe('Marauder', () => {
  it('gains a Spoils, and each other player gains the top Ruins', async () => {
    const { testHarness, targetHarness } = setUp();

    await new Marauder(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['spoils-pile-0']);
    expect(testHarness.pileCards.get('Spoils')).toHaveLength(0);
    expect(targetHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['ruined-village-pile-0']);
    expect(targetHarness.pileCards.get('Ruins')?.map((card) => card.getId())).toEqual(['survivors-pile-1']);
  });

  it('still attacks when the Spoils pile is empty', async () => {
    const { testHarness, targetHarness } = setUp();
    testHarness.pileCards.set('Spoils', []);

    await new Marauder(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
    expect(targetHarness.discard.size()).toBe(1);
  });

  it('attack gives nothing when the Ruins pile is empty', async () => {
    const { testHarness, targetHarness } = setUp();
    targetHarness.pileCards.set('Ruins', []);

    await new Marauder(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(1);
    expect(targetHarness.discard.size()).toBe(0);
  });
});
