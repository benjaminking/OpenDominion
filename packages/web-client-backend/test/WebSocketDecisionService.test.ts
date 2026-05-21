import { ChoiceType } from '@dominion/common';
import { MessageType } from '@dominion/web-client-common';
import { WebSocket } from 'ws';
import { describe, expect, it } from 'vitest';

import { WebSocketDecisionService } from '../src/WebSocketDecisionService';
import { WebSocketMessageDecoder } from '../src/WebSocketMessageDecoder';
import { WebSocketMessageWriter } from '../src/WebSocketMessageWriter';
import { TestSocket } from './TestSocket';

const parseLastSentMessage = (socket: TestSocket) => {
  const payload = socket.sentPayloads[socket.sentPayloads.length - 1];
  return JSON.parse(payload);
};

describe('WebSocketDecisionService', () => {
  it('sends and resolves chooseCard decisions', async () => {
    const socket = new TestSocket();
    const decoder = new WebSocketMessageDecoder(socket as unknown as WebSocket);
    const writer = new WebSocketMessageWriter(socket as unknown as WebSocket);
    const service = new WebSocketDecisionService(decoder, writer);
    const expectedChoice = {
      type: ChoiceType.Card,
      card: { id: 'gold-1' },
    };

    const pending = service.chooseCard('Choose one', 'gain' as never, 'decision-id', [
      { card: { id: 'gold-1' } },
    ] as never);

    expect(parseLastSentMessage(socket)).toMatchObject({
      type: MessageType.CHOOSE_CARD,
      content: {
        prompt: 'Choose one',
        decisionName: 'decision-id',
      },
    });

    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: expectedChoice,
    });
    await expect(pending).resolves.toEqual(expectedChoice);
  });

  it('sends and resolves every other decision method', async () => {
    const socket = new TestSocket();
    const decoder = new WebSocketMessageDecoder(socket as unknown as WebSocket);
    const writer = new WebSocketMessageWriter(socket as unknown as WebSocket);
    const service = new WebSocketDecisionService(decoder, writer);

    const chooseCardsPending = service.chooseCards('Pick cards', 'discard' as never, 'multi-card', [1, 2], [] as never);
    expect(parseLastSentMessage(socket).type).toBe(MessageType.CHOOSE_CARDS);
    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: { type: ChoiceType.MultiCard, cards: [{ id: 'c1' }] },
    });
    await expect(chooseCardsPending).resolves.toEqual({ type: ChoiceType.MultiCard, cards: [{ id: 'c1' }] });

    const oneOptionPending = service.chooseOneOption('Pick one', 'named', [{ name: 'Yes' }] as never);
    expect(parseLastSentMessage(socket).type).toBe(MessageType.CHOOSE_ONE_OPTION);
    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: { type: ChoiceType.ChooseOne, name: 'Yes' },
    });
    await expect(oneOptionPending).resolves.toEqual({ type: ChoiceType.ChooseOne, name: 'Yes' });

    const multiOptionPending = service.chooseMultipleOptions(
      'Pick two',
      'many',
      [{ name: 'A' }, { name: 'B' }] as never,
      2,
    );
    expect(parseLastSentMessage(socket).type).toBe(MessageType.CHOOSE_MULTIPLE_OPTIONS);
    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: { type: ChoiceType.ChooseMultiple, names: ['A', 'B'] },
    });
    await expect(multiOptionPending).resolves.toEqual({ type: ChoiceType.ChooseMultiple, names: ['A', 'B'] });

    const effectPending = service.chooseFromMultipleEvents('extra', [] as never, [] as never);
    expect(parseLastSentMessage(socket).type).toBe(MessageType.CHOOSE_EFFECT);
    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: { type: ChoiceType.None },
    });
    await expect(effectPending).resolves.toEqual({ type: ChoiceType.None });

    const extraTurnPending = service.chooseExtraTurns([{ name: 'Outpost', id: 'ot-1' }] as never);
    expect(parseLastSentMessage(socket).type).toBe(MessageType.CHOOSE_EXTRA_TURN);
    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: { type: ChoiceType.ExtraTurn, name: 'Outpost', id: 'ot-1' },
    });
    await expect(extraTurnPending).resolves.toEqual({ type: ChoiceType.ExtraTurn, name: 'Outpost', id: 'ot-1' });

    const actionPending = service.makeActionPhaseChoice([{ card: { id: 'village-1' } }] as never);
    expect(parseLastSentMessage(socket).type).toBe(MessageType.ACTION_PHASE_CHOICE);
    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: { type: ChoiceType.EndActionPhase },
    });
    await expect(actionPending).resolves.toEqual({ type: ChoiceType.EndActionPhase });

    const treasurePending = service.makeTreasurePhaseChoice(
      [{ card: { id: 'silver-1' } }] as never,
      {
        type: ChoiceType.SimpleTreasures,
        coins: 2,
      } as never,
    );
    expect(parseLastSentMessage(socket).type).toBe(MessageType.TREASURE_PHASE_CHOICE);
    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: { type: ChoiceType.SimpleTreasures, coins: 2 },
    });
    await expect(treasurePending).resolves.toEqual({ type: ChoiceType.SimpleTreasures, coins: 2 });

    const buyPending = service.makeBuyPhaseChoice([{ card: { id: 'duchy-1' } }] as never, 1, 5);
    expect(parseLastSentMessage(socket).type).toBe(MessageType.BUY_PHASE_CHOICE);
    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: { type: ChoiceType.EndBuyPhase },
    });
    await expect(buyPending).resolves.toEqual({ type: ChoiceType.EndBuyPhase });
  });

  it('throws when resolving a choice with no pending decisions', () => {
    const socket = new TestSocket();
    const decoder = new WebSocketMessageDecoder(socket as unknown as WebSocket);
    const writer = new WebSocketMessageWriter(socket as unknown as WebSocket);
    const service = new WebSocketDecisionService(decoder, writer);

    expect(() => service.resolveChoice({ type: ChoiceType.None } as never)).toThrow(
      'Got a web socket response when no decision was pending',
    );
  });
});
