import { ClientGameState } from '@dominion/client-common';
import { ChoiceType } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { TextBasedDecisionService } from '../src/TextBasedDecisionService';
import {
  createCardChoice,
  createCardMetadata,
  createEffectChoice,
  createExtraTurnChoice,
  createNamedChoice,
} from './TestFixtures';

// Every test replaces rlObj, so avoid attaching a real readline interface (and its listeners) to stdin.
vi.mock('readline', () => ({ createInterface: () => ({ question: vi.fn(), close: vi.fn() }) }));

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
    const buyChoice = await service.makeBuyPhaseChoice([createCardChoice('Gold')] as never, 1, 6, 0);
    expect(buyChoice.type).toBe(ChoiceType.EndBuyPhase);
  });

  it('prompts with the number of buys and coins and returns the chosen card in the buy phase', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());
    const prompts: string[] = [];
    (service as unknown as { rlObj: { question: (prompt: string, cb: (answer: string) => void) => void } }).rlObj = {
      question: (prompt: string, callback: (answer: string) => void) => {
        prompts.push(prompt);
        callback('1');
      },
    };
    const familiar = createCardChoice('Familiar');

    const choice = await service.makeBuyPhaseChoice([familiar] as never, 2, 3, 1);

    expect(choice).toBe(familiar);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain('You have 2 buys and $3. You may buy a card.');
    expect(prompts[0]).toContain('1) Familiar');
  });

  // BUG: numberMultiCardOptions() calls get(name)!.push() only when the name is absent, so it always throws.
  it('groups same-named cards for chooseCards and returns one card per selected marker occurrence', async () => {
    const service = new TextBasedDecisionService(new ClientGameState());
    const cellar1 = { ...createCardChoice('Cellar'), card: createCardMetadata('Cellar', 'cellar-1') };
    const cellar2 = { ...createCardChoice('Cellar'), card: createCardMetadata('Cellar', 'cellar-2') };
    const village = { ...createCardChoice('Village'), card: createCardMetadata('Village', 'village-1') };

    setAnswers(service, ['1,1,2']);
    const choice = await service.chooseCards('Discard cards', 'discard' as never, 'decision', [3], [
      cellar1,
      village,
      cellar2,
    ] as never);

    expect(choice.type).toBe(ChoiceType.MultiCard);
    expect(choice.cards.map((card) => card.id)).toEqual(['cellar-1', 'cellar-2', 'village-1']);
  });
});
