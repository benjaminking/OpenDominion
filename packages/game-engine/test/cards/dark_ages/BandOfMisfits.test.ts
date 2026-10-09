import { describe, expect, it, vi } from 'vitest';

import { Market } from '../../../src/cards/base_game/Market';
import { Village } from '../../../src/cards/base_game/Village';
import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { BandOfMisfits } from '../../../src/cards/dark_ages/BandOfMisfits';
import { FishingVillage } from '../../../src/cards/seaside/FishingVillage';
import { createCardHarness } from '../testHarness';

describe('BandOfMisfits', () => {
  it('plays a cheaper Action card from the Supply, leaving it there', async () => {
    const testHarness = createCardHarness();
    const deckCopper = new Copper(testHarness.sharedGameState);
    deckCopper.setId('copper-deck-0');
    testHarness.addToDeck(deckCopper);
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');
    testHarness.addSupplyPile(village);

    testHarness.pickCard(village);
    await new BandOfMisfits(testHarness.sharedGameState).play(testHarness.executor);

    // Village: +1 Card, +2 Actions (playing it does not use an Action)
    expect(testHarness.hand.asCardArray()).toEqual([deckCopper]);
    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.pileCards.get('Village')).toEqual([village]);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('cannot play an Action card costing as much as itself', async () => {
    const testHarness = createCardHarness();
    const market = new Market(testHarness.sharedGameState);
    market.setId('market-supply-0');
    testHarness.addSupplyPile(market);

    testHarness.pickCard(market);
    await new BandOfMisfits(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(0);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.stats.buys).toBe(0);
  });

  it('cannot play a non-Action card', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    testHarness.pickCard(silver);
    await new BandOfMisfits(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(0);
  });

  // BUG: Duration Action cards are excluded, but the card text only excludes Command cards
  it('can play a Duration Action card from the Supply', async () => {
    const testHarness = createCardHarness();
    const fishingVillage = new FishingVillage(testHarness.sharedGameState);
    fishingVillage.setId('fishing-village-supply-0');
    testHarness.addSupplyPile(fishingVillage);

    testHarness.pickCard(fishingVillage);
    await new BandOfMisfits(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(2);
    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.pileCards.get('Fishing Village')).toEqual([fishingVillage]);
  });

  // BUG: CardPlayOptions.Builder.build() drops leaveItThere, so the played card is never blocked from moving
  it('keeps the played card locked in the Supply while it is being played', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-supply-0');
    testHarness.addSupplyPile(village);
    let wasAbleToMoveDuringPlay: boolean | undefined;
    vi.spyOn(village, 'play').mockImplementation(async () => {
      wasAbleToMoveDuringPlay = testHarness.sharedGameState.isCardAbleToMove(village);
    });

    testHarness.pickCard(village);
    await new BandOfMisfits(testHarness.sharedGameState).play(testHarness.executor);

    expect(village.play).toHaveBeenCalledTimes(1);
    expect(wasAbleToMoveDuringPlay).toBe(false);
    expect(testHarness.sharedGameState.isCardAbleToMove(village)).toBe(true);
  });
});
