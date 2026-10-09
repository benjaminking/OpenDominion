import { describe, expect, it } from 'vitest';

import { Bureaucrat } from '../../../src/cards/base_game/Bureaucrat';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { createCardHarness } from '../testHarness';

describe('Bureaucrat', () => {
  it('gains a Silver onto deck when played', async () => {
    const testHarness = createCardHarness();
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    await new Bureaucrat(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.deck.size()).toBe(1);
    expect(testHarness.deck.getTopCard()!.getName()).toBe('Silver');
  });

  it("attack topdecks a Victory card from target's hand", async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetHandEstate = new Estate(targetHarness.sharedGameState);
    targetHandEstate.setId('estate-target-hand-0');
    targetHarness.addToHand(targetHandEstate);

    targetHarness.pickCard(targetHandEstate);
    await new Bureaucrat(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    expect(targetHarness.hand.size()).toBe(0);
    expect(targetHarness.deck.size()).toBe(1);
    expect(targetHarness.deck.getTopCard()!.getName()).toBe('Estate');
  });

  it('attack reveals hand when target has no Victory cards', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    const targetHandSilver = new Silver(targetHarness.sharedGameState);
    targetHandSilver.setId('silver-target-hand-0');
    targetHarness.addToHand(targetHandSilver);

    // No Victory cards in hand — hand stays unchanged
    await new Bureaucrat(testHarness.sharedGameState).attack(targetHarness.player, targetHarness.player);

    expect(targetHarness.hand.size()).toBe(1);
    expect(targetHarness.deck.size()).toBe(0);
  });
});
