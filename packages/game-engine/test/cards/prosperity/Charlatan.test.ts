import { CardLocation, CardType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { CardFactory } from '../../../src/card/CardFactory';
import { Charlatan } from '../../../src/cards/prosperity/Charlatan';
import { CharlatanCurse } from '../../../src/cards/prosperity/CharlatanCurse';
import { GameInitializer } from '../../../src/setup/GameInitializer';
import { createCardHarness } from '../testHarness';

describe('Charlatan', () => {
  it('adds $3 and each other player gains a Curse', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();
    testHarness.routeAttacksTo(targetHarness);
    const curse = new CharlatanCurse(targetHarness.sharedGameState);
    curse.setId('curse-supply-0');
    targetHarness.addSupplyPile(curse);

    await new Charlatan(testHarness.sharedGameState).play(testHarness.executor);

    expect(testHarness.stats.coins).toBe(3);
    expect(targetHarness.discard.asCardArray().map((card) => card.getId())).toEqual(['curse-supply-0']);
    expect(targetHarness.pileCards.get('Curse')).toHaveLength(0);
    expect(testHarness.discard.size()).toBe(0);
  });

  it('attack gains nothing when the Curse pile is empty', async () => {
    const testHarness = createCardHarness();
    const targetHarness = createCardHarness();

    await new Charlatan(testHarness.sharedGameState).attack(targetHarness.player, testHarness.player);

    expect(targetHarness.discard.size()).toBe(0);
  });

  it('replaces the Curse pile with Curses that are also Treasures', () => {
    const testHarness = createCardHarness();
    const gameInitializer = { replaceCardsInPiles: vi.fn() };

    const setupRules = new Charlatan(testHarness.sharedGameState).getSetupRules();
    expect(setupRules.hasAnyGameInitializationSetupRules()).toBe(true);
    setupRules.getNextGameInitializationSetupRule().applySetupRule(gameInitializer as unknown as GameInitializer);

    expect(gameInitializer.replaceCardsInPiles).toHaveBeenCalledWith('Curse', 'CharlatanCurse');
    const [, replacementName] = gameInitializer.replaceCardsInPiles.mock.calls[0] as [string, string];
    const replacement = new CardFactory(testHarness.sharedGameState).createCard(
      replacementName,
      'curse-replacement-0',
      CardLocation.PILE,
    );
    expect(replacement).toBeInstanceOf(CharlatanCurse);
  });
});

describe('CharlatanCurse', () => {
  it('is a Curse and a Treasure from the Curse pile, worth -1 VP and costing $0', () => {
    const testHarness = createCardHarness();
    const curse = new CharlatanCurse(testHarness.sharedGameState);
    curse.setId('curse-0');

    expect(curse.hasType(CardType.CURSE)).toBe(true);
    expect(curse.hasType(CardType.TREASURE)).toBe(true);
    expect(curse.getDisplayName()).toBe('Curse');
    expect(curse.getPileName()).toBe('Curse');
    expect(curse.score()).toBe(-1);
    expect(curse.getOriginalCost().coins).toBe(0);
  });

  it('is a simple Treasure worth $1 when played', async () => {
    const testHarness = createCardHarness();
    const curse = new CharlatanCurse(testHarness.sharedGameState);
    curse.setId('curse-hand-0');
    testHarness.addToHand(curse);

    expect(curse.isSimpleTreasure()).toBe(true);
    expect(curse.getCoins()).toBe(1);
    await testHarness.executor.playCardFromHand(curse);

    expect(testHarness.stats.coins).toBe(1);
    expect(testHarness.inPlay.contains(curse)).toBe(true);
  });
});
