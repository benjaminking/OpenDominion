import { ChoiceType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Counterfeit } from '../../../src/cards/dark_ages/Counterfeit';
import { Spoils } from '../../../src/cards/dark_ages/Spoils';
import { createCardHarness } from '../testHarness';

describe('Counterfeit', () => {
  it('gives $1 and +1 Buy, then plays a Treasure from hand twice and trashes it', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);

    testHarness.pickCard(silver);
    await new Counterfeit(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(5);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.hand.size()).toBe(0);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.sharedTrash.asCardArray()).toEqual([silver]);
  });

  it('may choose not to play a Treasure', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-hand-0');
    testHarness.addToHand(silver);

    testHarness.decisionService.chooseCard.mockResolvedValueOnce({ type: ChoiceType.None });
    await new Counterfeit(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.stats.buys).toBe(1);
    expect(testHarness.hand.asCardArray()).toEqual([silver]);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('cannot play a non-Treasure card', async () => {
    const testHarness = createCardHarness();
    const estate = new Estate(testHarness.sharedGameState);
    estate.setId('estate-hand-0');
    testHarness.addToHand(estate);

    testHarness.pickCard(estate);
    await new Counterfeit(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.hand.asCardArray()).toEqual([estate]);
    expect(testHarness.sharedTrash.size()).toBe(0);
  });

  it('plays a Spoils twice; it returns to its pile once and is not trashed', async () => {
    const testHarness = createCardHarness();
    const spoils = new Spoils(testHarness.sharedGameState);
    spoils.setId('spoils-hand-0');
    testHarness.addToHand(spoils);
    testHarness.pileCards.set('Spoils', []);

    testHarness.pickCard(spoils);
    await new Counterfeit(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(7);
    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.pileCards.get('Spoils')).toEqual([spoils]);
  });
});
