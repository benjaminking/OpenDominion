import { describe, expect, it } from 'vitest';

import { Gold } from '../../../src/cards/basic_cards/Gold';
import { Tunnel } from '../../../src/cards/hinterlands/Tunnel';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { TurnPhase } from '../../../src/turns/TurnPhase';
import { CardHarness, createCardHarness } from '../testHarness';

const setTurnPhase = (testHarness: CardHarness, turnPhase: TurnPhase): void => {
  testHarness.sharedGameState.getTurnPhase = () => turnPhase;
};

const setUpDiscardedTunnel = (testHarness: CardHarness) => {
  const gold = new Gold(testHarness.sharedGameState);
  gold.setId('gold-supply-0');
  testHarness.addSupplyPile(gold);
  const tunnel = new Tunnel(testHarness.sharedGameState);
  tunnel.setId('tunnel-discarded');
  testHarness.addToDiscard(tunnel);
  const [onDiscard] = testHarness.getCardEffects(tunnel, EffectTriggerType.DISCARD);
  return { tunnel, gold, onDiscard };
};

describe('Tunnel', () => {
  it('is worth 2 VP', () => {
    const testHarness = createCardHarness();

    expect(new Tunnel(testHarness.sharedGameState).score([])).toBe(2);
  });

  it('gains a Gold when discarded other than during Clean-up', async () => {
    const testHarness = createCardHarness();
    const { tunnel, gold, onDiscard } = setUpDiscardedTunnel(testHarness);
    setTurnPhase(testHarness, TurnPhase.ACTION);

    expect(onDiscard.areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
    await onDiscard.doAction(testHarness.executor, tunnel);

    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.discard.contains(gold)).toBe(true);
  });

  it('cannot react when discarded during Clean-up', () => {
    const testHarness = createCardHarness();
    const { onDiscard } = setUpDiscardedTunnel(testHarness);
    setTurnPhase(testHarness, TurnPhase.CLEANUP);

    expect(onDiscard.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });

  it('gains nothing when the Gold pile is empty', async () => {
    const testHarness = createCardHarness();
    const { tunnel, onDiscard } = setUpDiscardedTunnel(testHarness);
    testHarness.pileCards.get('Gold')?.splice(0);

    await onDiscard.doAction(testHarness.executor, tunnel);

    expect(testHarness.discard.size()).toBe(1);
  });
});
