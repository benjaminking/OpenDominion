import { ClientGameState } from '@dominion/client-common';
import { ChoiceType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { TextBasedDecisionService } from '../src/TextBasedDecisionService';
import { createCardChoice, createEffectChoice, createExtraTurnChoice, createNamedChoice } from './TestFixtures';

const setAnswers = (service: TextBasedDecisionService, answers: string[]) => {
  const queue = [...answers];
  (service as unknown as { rlObj: { question: (prompt: string, cb: (answer: string) => void) => void } }).rlObj = {
    question: (_prompt: string, callback: (answer: string) => void) => {
      const nextAnswer = queue.shift();
      callback(nextAnswer ?? '');
    },
  };
};

describe('TextBasedDecisionService', () => {
  it('chooses a card or none for chooseCard', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());

    setAnswers(service, ['2']);
    const noneChoice = await service.chooseCard(
      'Pick one',
      'gain' as never,
      'decision',
      [createCardChoice('Silver')] as never,
      { type: ChoiceType.None } as never,
    );
    expect(noneChoice.type).toBe(ChoiceType.None);

    setAnswers(service, ['1']);
    const cardChoice = await service.chooseCard('Pick one', 'gain' as never, 'decision', [
      createCardChoice('Gold'),
    ] as never);
    expect(cardChoice.type).toBe(ChoiceType.Card);
  });

  it('supports hidden choices before selecting a normal option', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    setAnswers(service, ['H', '1']);
    const choice = await service.chooseCard('Pick one', 'gain' as never, 'decision', [
      createCardChoice('Silver'),
    ] as never);

    expect(choice.type).toBe(ChoiceType.Card);
    expect(logSpy).toHaveBeenCalledWith('K) View Kingdom, S) Scores, H) Help');

    logSpy.mockRestore();
  });

  it('maps Yes/No named choices to Y/N shortcuts', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());

    setAnswers(service, ['Y']);
    const choice = await service.chooseOneOption('Confirm?', 'confirm', [
      createNamedChoice('Yes'),
      createNamedChoice('No'),
    ] as never);

    expect(choice.name).toBe('Yes');
  });

  it('re-prompts after invalid single-choice input', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    setAnswers(service, ['9', '1']);
    const choice = await service.chooseCard('Pick one', 'gain' as never, 'decision', [
      createCardChoice('Gold'),
    ] as never);

    expect(choice.type).toBe(ChoiceType.Card);
    expect(logSpy).toHaveBeenCalledWith('Invalid choice');

    logSpy.mockRestore();
  });

  it('chooses multiple named options', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());

    setAnswers(service, ['1,2']);
    const choice = await service.chooseMultipleOptions(
      'Choose two',
      'multi',
      [createNamedChoice('Alpha'), createNamedChoice('Beta')] as never,
      2,
    );

    expect(choice.type).toBe(ChoiceType.ChooseMultiple);
    expect(choice.names).toEqual(['Alpha', 'Beta']);
  });

  it('groups effects and allows None when there are no mandatory effects', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());

    setAnswers(service, ['N']);
    const choice = await service.chooseFromMultipleEvents(
      '',
      [createEffectChoice('Militia', 'm1'), createEffectChoice('Militia', 'm2')] as never,
      [] as never,
    );

    expect(choice.type).toBe(ChoiceType.None);
  });

  it('re-prompts on invalid effect choice marker', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    setAnswers(service, ['9', '1']);
    const choice = await service.chooseFromMultipleEvents(
      '',
      [createEffectChoice('Militia', 'm1')] as never,
      [createEffectChoice('Witch', 'w1')] as never,
    );

    expect(choice.type).toBe(ChoiceType.Effect);
    expect(logSpy).toHaveBeenCalledWith('Invalid choice');

    logSpy.mockRestore();
  });

  it('groups extra turns and selects one', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());

    setAnswers(service, ['1']);
    const choice = await service.chooseExtraTurns([
      createExtraTurnChoice('Outpost'),
      createExtraTurnChoice('Outpost'),
    ] as never);

    expect(choice.type).toBe(ChoiceType.ExtraTurn);
    expect(choice.name).toContain('Outpost');
  });

  it('re-prompts on invalid extra turn choice marker', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    setAnswers(service, ['8', '1']);
    const choice = await service.chooseExtraTurns([createExtraTurnChoice('Outpost')] as never);

    expect(choice.type).toBe(ChoiceType.ExtraTurn);
    expect(logSpy).toHaveBeenCalledWith('Invalid choice');

    logSpy.mockRestore();
  });

  it('supports phase helpers for action, treasure, and buy decisions', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());

    setAnswers(service, ['A']);
    const actionChoice = await service.makeActionPhaseChoice([createCardChoice('Village')] as never);
    expect(actionChoice.type).toBe(ChoiceType.EndActionPhase);

    setAnswers(service, ['P']);
    const treasureChoice = await service.makeTreasurePhaseChoice(
      [createCardChoice('Silver')] as never,
      { type: ChoiceType.SimpleTreasures, coins: 3 } as never,
    );
    expect(treasureChoice.type).toBe(ChoiceType.SimpleTreasures);

    setAnswers(service, ['B']);
    const buyChoice = await service.makeBuyPhaseChoice([createCardChoice('Gold')] as never, 1, 6);
    expect(buyChoice.type).toBe(ChoiceType.EndBuyPhase);
  });
});
