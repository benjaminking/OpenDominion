import { ChoiceType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Copper } from '../../../src/cards/basic_cards/Copper';
import { Duchy } from '../../../src/cards/basic_cards/Duchy';
import { Estate } from '../../../src/cards/basic_cards/Estate';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Hermit } from '../../../src/cards/dark_ages/Hermit';
import { Madman } from '../../../src/cards/dark_ages/Madman';
import { EffectContextBuilder } from '../../../src/effects/EffectContext';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { TurnPhase } from '../../../src/turns/TurnPhase';
import { createCardHarness } from '../testHarness';

describe('Hermit', () => {
  it('trashes a non-Treasure from the discard pile and gains a card costing up to $3', async () => {
    const testHarness = createCardHarness();
    const discardEstate = new Estate(testHarness.sharedGameState);
    discardEstate.setId('estate-discard-0');
    testHarness.addToDiscard(discardEstate);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    testHarness.pickCard(discardEstate);
    testHarness.pickCard(silver);
    await new Hermit(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray()).toEqual([discardEstate]);
    expect(testHarness.discard.asCardArray()).toEqual([silver]);
  });

  it('trashes a non-Treasure from hand', async () => {
    const testHarness = createCardHarness();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);

    testHarness.pickCard(handEstate);
    await new Hermit(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.asCardArray()).toEqual([handEstate]);
    expect(testHarness.hand.size()).toBe(0);
  });

  it('may choose not to trash anything and still gains a card', async () => {
    const testHarness = createCardHarness();
    const handEstate = new Estate(testHarness.sharedGameState);
    handEstate.setId('estate-hand-0');
    testHarness.addToHand(handEstate);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    testHarness.decisionService.chooseCard.mockResolvedValueOnce({ type: ChoiceType.None });
    testHarness.pickCard(silver);
    await new Hermit(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.asCardArray()).toEqual([handEstate]);
    expect(testHarness.discard.asCardArray()).toEqual([silver]);
  });

  it('cannot trash Treasures', async () => {
    const testHarness = createCardHarness();
    const handCopper = new Copper(testHarness.sharedGameState);
    handCopper.setId('copper-hand-0');
    testHarness.addToHand(handCopper);
    const discardSilver = new Silver(testHarness.sharedGameState);
    discardSilver.setId('silver-discard-0');
    testHarness.addToDiscard(discardSilver);

    testHarness.pickCard(handCopper);
    await new Hermit(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.sharedTrash.size()).toBe(0);
    expect(testHarness.hand.asCardArray()).toEqual([handCopper]);
    expect(testHarness.discard.asCardArray()).toEqual([discardSilver]);
  });

  it('cannot gain a card costing more than $3', async () => {
    const testHarness = createCardHarness();
    const duchy = new Duchy(testHarness.sharedGameState);
    duchy.setId('duchy-supply-0');
    testHarness.addSupplyPile(duchy);

    testHarness.pickCard(duchy);
    await new Hermit(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
    expect(testHarness.pileCards.get('Duchy')).toEqual([duchy]);
  });

  it('at the end of the Buy phase with no cards gained, exchanges itself for a Madman', async () => {
    const testHarness = createCardHarness();
    const hermit = new Hermit(testHarness.sharedGameState);
    hermit.setId('hermit-0');
    testHarness.addToInPlay(hermit);
    testHarness.pileCards.set('Hermit', []);
    const madman = new Madman(testHarness.sharedGameState);
    madman.setId('madman-pile-0');
    testHarness.pileCards.set('Madman', [madman]);

    await hermit.play(testHarness.executor);
    const [buyEnd] = testHarness.getAddedEffects(EffectTriggerType.BUY_END);
    await buyEnd.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.inPlay.size()).toBe(0);
    expect(testHarness.pileCards.get('Hermit')).toEqual([hermit]);
    expect(testHarness.discard.asCardArray()).toEqual([madman]);
    expect(testHarness.pileCards.get('Madman')).toEqual([]);
  });

  it('loses track of itself if it has left play since it was played, even if it is back in play', async () => {
    const testHarness = createCardHarness();
    const hermit = new Hermit(testHarness.sharedGameState);
    hermit.setId('hermit-0');
    testHarness.addToInPlay(hermit);
    testHarness.pileCards.set('Hermit', []);
    const madman = new Madman(testHarness.sharedGameState);
    madman.setId('madman-pile-0');
    testHarness.pileCards.set('Madman', [madman]);
    const lostTrack = vi.spyOn(testHarness.executor, 'sendLostTrackMessage');

    await hermit.play(testHarness.executor);
    testHarness.inPlay.removeCard(hermit);
    testHarness.addToHand(hermit);
    testHarness.hand.removeCard(hermit);
    testHarness.addToInPlay(hermit);
    const [buyEnd] = testHarness.getAddedEffects(EffectTriggerType.BUY_END);
    await buyEnd.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(lostTrack).toHaveBeenCalledWith(hermit);
    expect(testHarness.inPlay.asCardArray()).toEqual([hermit]);
    expect(testHarness.pileCards.get('Hermit')).toEqual([]);
    expect(testHarness.pileCards.get('Madman')).toEqual([madman]);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('stays in play when the Madman pile is empty', async () => {
    const testHarness = createCardHarness();
    const hermit = new Hermit(testHarness.sharedGameState);
    hermit.setId('hermit-0');
    testHarness.addToInPlay(hermit);
    testHarness.pileCards.set('Hermit', []);
    testHarness.pileCards.set('Madman', []);

    await hermit.play(testHarness.executor);
    const [buyEnd] = testHarness.getAddedEffects(EffectTriggerType.BUY_END);
    await buyEnd.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.inPlay.asCardArray()).toEqual([hermit]);
    expect(testHarness.pileCards.get('Hermit')).toEqual([]);
  });

  it('does not exchange itself if a card was gained during the Buy phase', async () => {
    const testHarness = createCardHarness();
    const hermit = new Hermit(testHarness.sharedGameState);
    hermit.setId('hermit-0');
    testHarness.addToInPlay(hermit);
    testHarness.pileCards.set('Hermit', []);
    const madman = new Madman(testHarness.sharedGameState);
    madman.setId('madman-pile-0');
    testHarness.pileCards.set('Madman', [madman]);
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId('silver-supply-0');
    testHarness.addSupplyPile(silver);

    await hermit.play(testHarness.executor);
    testHarness.turnTracker.updateTurnPhase(TurnPhase.BUY);
    await testHarness.executor.gainFromPile('Silver');
    expect(testHarness.executor.getNumCardsGainedInThisTurnsBuyPhase()).toBe(1);
    const [buyEnd] = testHarness.getAddedEffects(EffectTriggerType.BUY_END);
    await buyEnd.doAction(testHarness.executor, new EffectContextBuilder().build());

    expect(testHarness.inPlay.asCardArray()).toEqual([hermit]);
    expect(testHarness.pileCards.get('Madman')).toEqual([madman]);
    expect(testHarness.discard.asCardArray()).toEqual([silver]);
  });
});
