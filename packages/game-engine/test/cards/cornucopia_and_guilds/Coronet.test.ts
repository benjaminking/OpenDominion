import { describe, expect, it } from 'vitest';

import { Village } from '../../../src/cards/base_game/Village';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Coronet } from '../../../src/cards/cornucopia_and_guilds/Coronet';
import { Courser } from '../../../src/cards/cornucopia_and_guilds/Courser';
import { HugeTurnip } from '../../../src/cards/cornucopia_and_guilds/HugeTurnip';
import { createCardHarness } from '../testHarness';

describe('Coronet', () => {
  it('plays a non-Reward Action twice and then a non-Reward Treasure twice', async () => {
    const testHarness = createCardHarness();
    for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
      const deckEstate = new Estate(testHarness.sharedGameState);
      deckEstate.setId(`estate-deck-${String(cardIndex)}`);
      testHarness.addToDeck(deckEstate);
    }
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);

    testHarness.pickCard(village);
    testHarness.pickCard(silver);
    await new Coronet(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.actions).toBe(4);
    expect(testHarness.stats.coins).toBe(4);
    expect(testHarness.inPlay.asCardArray()).toEqual([village, silver]);
    expect(testHarness.hand.asCardArray().map((card) => card.getName())).toEqual(['Estate', 'Estate']);
  });

  it('plays nothing when both choices are declined', async () => {
    const testHarness = createCardHarness();
    const village = new Village(testHarness.sharedGameState);
    village.setId('village-hand-0');
    testHarness.addToHand(village);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);

    await new Coronet(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.stats.actions).toBe(0);
    expect(testHarness.stats.coins).toBe(0);
  });

  it('cannot play Reward cards', async () => {
    const testHarness = createCardHarness();
    const courser = new Courser(testHarness.sharedGameState);
    courser.setId('courser-hand-0');
    testHarness.addToHand(courser);
    const hugeTurnip = new HugeTurnip(testHarness.sharedGameState);
    hugeTurnip.setId('huge-turnip-hand-0');
    testHarness.addToHand(hugeTurnip);

    testHarness.pickCard(courser);
    testHarness.pickCard(hugeTurnip);
    await new Coronet(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(2);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.stats.coffers).toBe(0);
  });
});
