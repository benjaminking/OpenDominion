import { describe, expect, it, vi } from 'vitest';

import { Card } from '../../../src/card/Card';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Ferryman } from '../../../src/cards/cornucopia_and_guilds/Ferryman';
import { EffectContext, EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { Pile } from '../../../src/piles/Pile';
import { GameInitializer } from '../../../src/setup/GameInitializer';
import { PileSpecification } from '../../../src/setup/PileSpecification';
import { CardHarness, createCardHarness } from '../testHarness';

const createGameInitializer = (addedPileName: string) => {
  const addRandomPile = vi.fn((_pileSpecification: PileSpecification) => ({ name: addedPileName }) as unknown as Pile);
  return { addRandomPile, gameInitializer: { addRandomPile } as unknown as GameInitializer };
};

// Fires the GAIN effects for the gained card, as the engine does after a gain.
const fireGainTrigger = async (testHarness: CardHarness, gainedCard: Card): Promise<void> => {
  await testHarness.executor.processEffectsByType(
    EffectTriggerType.GAIN,
    new EffectContextBuilder().withTargetCard(gainedCard).withGainLocation(gainedCard.getLocation()).build(),
  );
};

describe('Ferryman', () => {
  it('gives +2 Cards and +1 Action, then discards a card', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-deck-0');
    testHarness.addToDeck(silver);
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-deck-0');
    testHarness.addToDeck(copper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    testHarness.pickCard(estate);
    await new Ferryman(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(1);
    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.hand.contains(copper)).toBe(true);
    expect(testHarness.hand.contains(silver)).toBe(true);
    expect(testHarness.discard.asCardArray()).toEqual([estate]);
  });

  it('setup adds a $3 or $4 pile, and gaining this Ferryman gains a card from it', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-pile-0');
    testHarness.addSupplyPile(village);
    const ferryman = new Ferryman(testHarness.sharedGameState);
    ferryman.setId('ferryman-0');
    const { addRandomPile, gameInitializer } = createGameInitializer('Village');

    ferryman.getSetupRules().getNextGameInitializationSetupRule().applySetupRule(gameInitializer);
    testHarness.addToDiscard(ferryman);
    await fireGainTrigger(testHarness, ferryman);

    expect(addRandomPile.mock.calls[0][0].getRandomizerRequirements()).toEqual({ requiredCoinCosts: [3, 4] });
    expect(testHarness.discard.asCardArray()).toEqual([ferryman, village]);
  });

  it('gains a card from the added pile when any Ferryman is gained, not just the one used for setup', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-pile-0');
    testHarness.addSupplyPile(village);
    const setupFerryman = new Ferryman(testHarness.sharedGameState);
    setupFerryman.setId('ferryman-randomizer');
    const pileFerryman = new Ferryman(testHarness.sharedGameState);
    pileFerryman.setId('ferryman-pile-0');
    const { gameInitializer } = createGameInitializer('Village');

    setupFerryman.getSetupRules().getNextGameInitializationSetupRule().applySetupRule(gameInitializer);
    testHarness.addToDiscard(pileFerryman);
    await fireGainTrigger(testHarness, pileFerryman);

    expect(testHarness.discard.asCardArray()).toEqual([pileFerryman, village]);
  });
});
