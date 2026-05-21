import { describe, expect, it } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Curse } from '../../../src/cards/basic_cards/Curse';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Replace } from '../../../src/cards/intrigue/Replace';
import { createCardHarness } from '../testHarness';

describe('Replace', () => {
  it('trashes a card and gains one costing up to 2 more', async () => {
    const testHarness = createCardHarness();
    const copper = new Copper(testHarness.sharedGameState);
    copper.setId('copper-hand-0');
    testHarness.addToHand(copper);
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-supply-0');
    testHarness.addSupplyPile(estate);

    testHarness.pickCard(copper); // trash
    testHarness.pickCard(estate); // gain (Estate = $2, Copper = $0 + 2 = $2 ✓)
    await new Replace(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(1);
    // Estate is not action or treasure, and not victory, so goes to discard
    expect(testHarness.discard.size()).toBe(1);
  });

  it('topdecks gained action or treasure cards', async () => {
    const testHarness = createCardHarness();
    // Copper ($0) trashed; gain Copper ($0+2 = $2 max) → treasure → topdeck
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    const supplyCopper = new Copper(testHarness.sharedGameState);
    supplyCopper.setId('copper-supply-0');
    testHarness.addSupplyPile(supplyCopper);

    testHarness.pickCard(handCopper); // trash
    testHarness.pickCard(supplyCopper); // gain (treasure → topdeck)
    await new Replace(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(1);
    expect(testHarness.deck.size()).toBe(1); // topdecked
    expect(testHarness.discard.size()).toBe(0);
  });

  it('does nothing if no card is chosen to trash', async () => {
    const testHarness = createCardHarness();
    // default: choice returns none
    await new Replace(testHarness.sharedGameState).play(testHarness.executor);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('victoryAttack causes target player to gain a Curse to their discard', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const curse = new Curse(targetHarness.sharedGameState);
    curse.setId('curse-supply-0');
    targetHarness.addSupplyPile(curse);

    await new Replace(testHarness.sharedGameState).victoryAttack(targetHarness.player, targetHarness.player);

    expect(targetHarness.discard.size()).toBe(1);
    expect(targetHarness.discard.asCardArray()[0].getName()).toBe('Curse');
  });
});
