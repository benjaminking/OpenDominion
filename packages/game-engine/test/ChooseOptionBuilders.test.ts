import { ChoiceType, DecisionService } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { ActionChoice } from '../src/decisions/ActionChoice';
import { ChooseMultipleOptionsBuilder } from '../src/decisions/ChooseMultipleOptionsBuilder';
import { ChooseOneOptionBuilder } from '../src/decisions/ChooseOneOptionBuilder';
import { GameMessageBroadcaster } from '../src/messaging/GameMessageBroadcaster';
import { InstructionExecutor } from '../src/players/InstructionExecutor';
import { Player } from '../src/players/Player';

const createBuilderContext = (name = 'Alice') => {
  const sendStatus = vi.fn();
  const messageBroadcaster = {
    sendStatus,
  } as unknown as GameMessageBroadcaster;
  const decisionService = {
    chooseOneOption: vi.fn(),
    chooseMultipleOptions: vi.fn(),
  } as unknown as DecisionService;
  const player = {
    getName: vi.fn(() => name),
    getInstructionExecutor: vi.fn(() => ({}) as InstructionExecutor),
    getDecisionService: vi.fn(() => decisionService),
    getGame: vi.fn(() => ({
      getMessageBroadcaster: vi.fn(() => messageBroadcaster),
    })),
  } as unknown as Player;

  return { decisionService, player, sendStatus };
};

describe('option decision builders', () => {
  it('should choose one option, wrap the decision with waiting status, and perform the selected action', async () => {
    const { decisionService, player, sendStatus } = createBuilderContext();
    const performedActions: string[] = [];
    const firstOption = new ActionChoice('First', () => {
      performedActions.push('First');
    });
    const secondOption = new ActionChoice('Second', () => {
      performedActions.push('Second');
    });
    vi.mocked(decisionService.chooseOneOption).mockResolvedValue({
      type: ChoiceType.ChooseOne,
      name: 'Second',
    });
    const builder = new ChooseOneOptionBuilder(player, 'Pick one');

    builder.from(firstOption).from(secondOption);
    const chosenOption = await builder.choose();

    expect(decisionService.chooseOneOption).toHaveBeenCalledWith('Pick one', '', [
      { type: ChoiceType.ChooseOne, name: 'First' },
      { type: ChoiceType.ChooseOne, name: 'Second' },
    ]);
    expect(chosenOption).toBe(secondOption);
    expect(performedActions).toEqual(['Second']);
    expect(sendStatus).toHaveBeenCalledTimes(2);
  });

  it('should reject a choose-one response that names an unknown option', async () => {
    const { decisionService, player } = createBuilderContext();
    vi.mocked(decisionService.chooseOneOption).mockResolvedValue({
      type: ChoiceType.ChooseOne,
      name: 'Missing',
    });
    const builder = new ChooseOneOptionBuilder(player);

    builder.from(new ActionChoice('Only option'));

    await expect(builder.choose()).rejects.toThrow('Decision service returned a non-existent option');
  });

  it('should choose multiple options and perform the selected actions in builder order', async () => {
    const { decisionService, player, sendStatus } = createBuilderContext();
    const performedActions: string[] = [];
    const firstOption = new ActionChoice('First', () => {
      performedActions.push('First');
    });
    const secondOption = new ActionChoice('Second', () => {
      performedActions.push('Second');
    });
    const thirdOption = new ActionChoice('Third', () => {
      performedActions.push('Third');
    });
    vi.mocked(decisionService.chooseMultipleOptions).mockResolvedValue({
      type: ChoiceType.ChooseMultiple,
      names: ['Second', 'First'],
    });
    const builder = new ChooseMultipleOptionsBuilder(player, 'Pick many');

    builder.from(firstOption).from(secondOption).from(thirdOption);
    await builder.choose(2);

    const namedChoices = vi.mocked(decisionService.chooseMultipleOptions).mock.calls[0][2];

    expect(decisionService.chooseMultipleOptions).toHaveBeenCalledWith('Pick many', '', expect.any(Array), 2);
    expect(namedChoices.map((choice) => choice.name)).toEqual(['First', 'Second', 'Third']);
    expect(performedActions).toEqual(['First', 'Second']);
    expect(sendStatus).toHaveBeenCalledTimes(2);
  });

  it('should reject a choose-multiple response that names an unknown option', async () => {
    const { decisionService, player } = createBuilderContext();
    vi.mocked(decisionService.chooseMultipleOptions).mockResolvedValue({
      type: ChoiceType.ChooseMultiple,
      names: ['Missing'],
    });
    const builder = new ChooseMultipleOptionsBuilder(player, 'Pick many');

    builder.from(new ActionChoice('Only option'));

    await expect(builder.choose(1)).rejects.toThrow('Decision service returned a non-existent option');
  });
});
