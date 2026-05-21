import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { MiningVillage } from '../../../src/cards/intrigue/MiningVillage';
import { createCardHarness } from '../testHarness';

describe('MiningVillage', () => {
  it('draws 1 card and adds 2 actions', async () => {
    const testHarness = createCardHarness();
    const drawCard = new Copper(testHarness.sharedGameState);
    drawCard.setId('draw-copper');
    testHarness.addToDeck(drawCard);

    testHarness.pickOption('No');
    await new MiningVillage(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.hand.size()).toBe(1);
    expect(testHarness.stats.actions).toBe(2);
  });

  it('trashes itself and adds 2 coins when "Yes" is chosen', async () => {
    const testHarness = createCardHarness();
    const drawCard = new Copper(testHarness.sharedGameState);
    drawCard.setId('draw-copper');
    testHarness.addToDeck(drawCard);

    const miningVillage = new MiningVillage(testHarness.sharedGameState);
    miningVillage.setId('mining-village-in-play');
    testHarness.addToInPlay(miningVillage);

    testHarness.pickOption('Yes');
    await miningVillage.play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(1);
    expect(testHarness.stats.coins).toBe(2);
  });
});
