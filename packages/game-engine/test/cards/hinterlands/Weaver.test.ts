import { describe, expect, it } from 'vitest';

import { Market } from '../../../src/cards/base_game/Market';
import { Smithy } from '../../../src/cards/base_game/Smithy';
import { Silver } from '../../../src/cards/basic_cards/Silver';
import { Weaver } from '../../../src/cards/hinterlands/Weaver';
import { EffectTriggerType } from '../../../src/effects/EffectTriggerType';
import { TurnPhase } from '../../../src/turns/TurnPhase';
import { CardHarness, createCardHarness } from '../testHarness';

const addSilverPile = (testHarness: CardHarness): void => {
  for (let i = 0; i < 2; i++) {
    const silver = new Silver(testHarness.sharedGameState);
    silver.setId(`silver-supply-${String(i)}`);
    testHarness.addSupplyPile(silver);
  }
};

const setTurnPhase = (testHarness: CardHarness, turnPhase: TurnPhase): void => {
  testHarness.sharedGameState.getTurnPhase = () => turnPhase;
};

const setUpDiscardedWeaver = (testHarness: CardHarness) => {
  addSilverPile(testHarness);
  const weaver = new Weaver(testHarness.sharedGameState);
  weaver.setId('weaver-discarded');
  testHarness.addToDiscard(weaver);
  const [onDiscard] = testHarness.getCardEffects(weaver, EffectTriggerType.DISCARD);
  return { weaver, onDiscard };
};

describe('Weaver', () => {
  it('can gain two Silvers', async () => {
    const testHarness = createCardHarness();
    addSilverPile(testHarness);

    testHarness.pickOption('Gain two Silvers');
    await new Weaver(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual([
      'silver-supply-0',
      'silver-supply-1',
    ]);
  });

  it('can gain a card costing up to $4', async () => {
    const testHarness = createCardHarness();
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);

    testHarness.pickOption('Gain a card costing up to $4');
    testHarness.pickCard(smithy);
    await new Weaver(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['smithy-supply-0']);
  });

  it('cannot gain a card costing more than $4', async () => {
    const testHarness = createCardHarness();
    const market = new Market(testHarness.sharedGameState);
    market.setId('market-supply-0');
    testHarness.addSupplyPile(market);

    testHarness.pickOption('Gain a card costing up to $4');
    testHarness.pickCard(market);
    await new Weaver(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.discard.size()).toBe(0);
  });

  it('may be played when discarded other than in Clean-up', async () => {
    const testHarness = createCardHarness();
    const { weaver, onDiscard } = setUpDiscardedWeaver(testHarness);
    setTurnPhase(testHarness, TurnPhase.ACTION);

    expect(onDiscard.areOtherConditionsSatisfied(testHarness.executor)).toBe(true);
    testHarness.pickOption('Gain two Silvers');
    await onDiscard.doAction(testHarness.executor, weaver);

    expect(testHarness.discard.contains(weaver)).toBe(false);
    expect(testHarness.discard.size()).toBe(2);
    expect(testHarness.discard.asCardArray().every((card) => card.getName() === 'Silver')).toBe(true);
  });

  it('cannot be played when discarded in Clean-up', () => {
    const testHarness = createCardHarness();
    const { onDiscard } = setUpDiscardedWeaver(testHarness);
    setTurnPhase(testHarness, TurnPhase.CLEANUP);

    expect(onDiscard.areOtherConditionsSatisfied(testHarness.executor)).toBe(false);
  });

  // BUG: the "card costing up to $4" choice uses allowNoneOption(), letting the player skip the mandatory gain
  it('does not offer to skip gaining a card costing up to $4 when one is available', async () => {
    const testHarness = createCardHarness();
    const smithy = new Smithy(testHarness.sharedGameState);
    smithy.setId('smithy-supply-0');
    testHarness.addSupplyPile(smithy);

    testHarness.pickOption('Gain a card costing up to $4');
    testHarness.pickCard(smithy);
    await new Weaver(testHarness.sharedGameState).play(testHarness.executor);

    // chooseCard(prompt, purpose, name, choices, noneChoice)
    const [gainCall] = testHarness.decisionService.chooseCard.mock.calls;
    expect((gainCall as unknown[])[4]).toBeUndefined();
  });

  // BUG: ie.playCardFromLocation removes the card from its location but never puts it into play
  it('is in play after being played when discarded', async () => {
    const testHarness = createCardHarness();
    const { weaver, onDiscard } = setUpDiscardedWeaver(testHarness);

    testHarness.pickOption('Gain two Silvers');
    await onDiscard.doAction(testHarness.executor, weaver);

    expect(testHarness.inPlay.contains(weaver)).toBe(true);
  });
});
