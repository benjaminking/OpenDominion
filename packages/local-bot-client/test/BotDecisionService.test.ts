import { CardSelectionPurpose, ChoiceType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { BotDecisionService } from '../src/BotDecisionService';
import { RuleBasedBot } from '../src/RuleBasedBot';
import { createCardChoice } from './TestFixtures';

describe('BotDecisionService', () => {
  it('registers game state with the bot on construction', () => {
    const gameState = {} as never;
    const bot = {
      useGameState: vi.fn(),
    } as unknown as RuleBasedBot;

    new BotDecisionService(gameState, bot);

    expect(bot.useGameState).toHaveBeenCalledWith(gameState);
  });

  it('chooses discard cards up to minimum required eligibility', async () => {
    const bot = {
      useGameState: vi.fn(),
    } as never;
    const service = new BotDecisionService({} as never, bot);

    const choice = await service.chooseCards('', CardSelectionPurpose.DISCARD, '', [2, 3], [
      createCardChoice('Copper'),
      createCardChoice('Silver'),
      createCardChoice('Gold'),
    ] as never);

    expect(choice.type).toBe(ChoiceType.MultiCard);
    expect(choice.cards.map((card) => card.name)).toEqual(['Copper', 'Silver']);
  });

  it('throws for unimplemented non-discard chooseCards paths', async () => {
    const service = new BotDecisionService(
      {} as never,
      {
        useGameState: vi.fn(),
      } as never,
    );

    expect(() =>
      service.chooseCards('', CardSelectionPurpose.TRASH, '', [1], [createCardChoice('Copper')] as never),
    ).toThrow('Method not implemented.');
  });

  it('chooses from card options and optionally none choice', async () => {
    const service = new BotDecisionService(
      {} as never,
      {
        useGameState: vi.fn(),
      } as never,
    );

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const withNone = await service.chooseCard(
      '',
      CardSelectionPurpose.GAIN,
      '',
      [createCardChoice('Silver')] as never,
      { type: ChoiceType.None } as never,
    );

    randomSpy.mockReturnValue(0);
    const withoutNone = await service.chooseCard('', CardSelectionPurpose.GAIN, '', [
      createCardChoice('Gold'),
    ] as never);

    expect(withNone.type).toBe(ChoiceType.None);
    expect(withoutNone.type).toBe(ChoiceType.Card);

    randomSpy.mockRestore();
  });

  it('delegates action, treasure, and buy phase choices to bot', async () => {
    const actionChoice = createCardChoice('Village');
    const treasureChoice = createCardChoice('Silver');
    const buyChoice = createCardChoice('Gold');

    const bot = {
      useGameState: vi.fn(),
      chooseActionCardToPlay: vi.fn(() => actionChoice),
      chooseTreasureCardToPlay: vi.fn(() => treasureChoice),
      makeBuyPhaseChoice: vi.fn(() => buyChoice),
    } as never;

    const service = new BotDecisionService({} as never, bot);

    await expect(service.makeActionPhaseChoice([actionChoice] as never)).resolves.toBe(actionChoice);
    await expect(service.makeTreasurePhaseChoice([treasureChoice] as never, undefined)).resolves.toBe(treasureChoice);
    await expect(service.makeBuyPhaseChoice([buyChoice] as never, 1, 6)).resolves.toBe(buyChoice);
  });

  it('throws for currently unimplemented decision methods', async () => {
    const service = new BotDecisionService(
      {} as never,
      {
        useGameState: vi.fn(),
      } as never,
    );

    expect(() => service.chooseOneOption('', '', [] as never)).toThrow('Method not implemented');
    expect(() => service.chooseMultipleOptions('', '', [] as never, 1)).toThrow('Method not implemented');
    expect(() => service.chooseExtraTurns([] as never)).toThrow('Method not implemented');
  });
});
