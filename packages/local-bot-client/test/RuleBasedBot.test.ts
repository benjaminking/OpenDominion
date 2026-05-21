import { ChoiceType } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { RuleBasedBot } from '../src/RuleBasedBot';
import type { RuleSet } from '../src/RuleSet';
import { createCardChoice, createGameStateStub } from './TestFixtures';

const createRuleSet = (rules: RuleSet['rules'], requiredCards: string[] = []) => ({
  rules,
  requiredCards,
});

describe('RuleBasedBot', () => {
  it('exposes required cards from rule set', () => {
    const bot = new RuleBasedBot(createRuleSet([{ name: 'Gold' }], ['Gold']));

    expect(bot.requiredCardNames).toEqual(['Gold']);
  });

  it('chooses highest-scoring action card and avoids ruins', () => {
    const bot = new RuleBasedBot(createRuleSet([{ name: 'Gold' }]));

    const choice = bot.chooseActionCardToPlay([createCardChoice('ruins'), createCardChoice('village')] as never);

    expect(choice.type).toBe(ChoiceType.Card);
    expect((choice as { card: { name: string } }).card.name).toBe('village');
  });

  it('uses simple treasures option when no special treasure heuristic applies', () => {
    const bot = new RuleBasedBot(createRuleSet([{ name: 'Gold' }]));

    const choice = bot.chooseTreasureCardToPlay(
      [createCardChoice('copper'), createCardChoice('silver')] as never,
      { type: ChoiceType.SimpleTreasures, coins: 3 } as never,
    );

    expect(choice.type).toBe(ChoiceType.SimpleTreasures);
  });

  it('selects buy choice from first applicable rule and otherwise ends buy phase', () => {
    const bot = new RuleBasedBot(
      createRuleSet([
        { name: 'Province', conditions: 'countInPile[Province] <= 0' },
        { name: 'Silver', conditions: 'moneyInDeck >= 0' },
      ]),
    );

    bot.useGameState(
      createGameStateStub({
        countInPile: (pileName) => (pileName === 'Province' ? 1 : 0),
        coinsInDeck: () => 5,
      }) as never,
    );

    const silverOption = createCardChoice('Silver');
    const withMatch = bot.makeBuyPhaseChoice([silverOption] as never, 1, 3);
    expect(withMatch.type).toBe(ChoiceType.Card);
    expect((withMatch as { card: { name: string } }).card.name).toBe('Silver');

    const withoutMatch = bot.makeBuyPhaseChoice([createCardChoice('Gold')] as never, 1, 6);
    expect(withoutMatch.type).toBe(ChoiceType.EndBuyPhase);
  });
});
