import { ChoiceType, type GameConfiguration, StatusAction } from '@dominion/common';
import { MessageType } from '@dominion/web-client-common';
import { describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';

import { WebClient } from '../src/WebClient';
import { WebSocketMessageTransmitter } from '../src/WebSocketMessageTransmitter';
import { WebSocketMessageWriter } from '../src/WebSocketMessageWriter';
import { TestSocket } from './TestSocket';

const parseMessages = (socket: TestSocket) => socket.sentPayloads.map((payload) => JSON.parse(payload));

describe('WebSocketMessageTransmitter', () => {
  it('sends expected messages for all transmitter methods', () => {
    const socket = new TestSocket();
    const writer = new WebSocketMessageWriter(socket as unknown as WebSocket);
    const transmitter = new WebSocketMessageTransmitter(writer);

    transmitter.sendLogMessage({ message: 'log entry', cardsToSubstitute: [] } as never);
    transmitter.sendMainPlayerName('alice');
    transmitter.sendOpponentNames(['bob', 'carol']);
    transmitter.sendGameConfiguration({ maxPlayers: 2 } as never);
    transmitter.sendTurnStartMessage('alice');
    transmitter.sendStatisticUpdate('alice', 'coins' as never, 3);
    transmitter.sendCardsUpdate('alice', 'hand' as never, [{ id: 'c1' }] as never);
    transmitter.sendCardCountUpdate('alice', 'deck' as never, 7);
    transmitter.sendTopCardUpdate('alice', 'deck' as never, { id: 'top-1' } as never);
    transmitter.sendSharedCardsUpdate('supply' as never, [{ id: 'pile-1' }] as never);
    transmitter.sendPileMetadata({ cardName: 'Copper' } as never);
    transmitter.sendStatus('waiting', StatusAction.REPLACE);

    const beforeNoOps = socket.sentPayloads.length;
    transmitter.sendBotCoins(4);
    transmitter.sendBotCardCounts([]);
    expect(socket.sentPayloads.length).toBe(beforeNoOps);

    const sentMessages = parseMessages(socket);
    expect(sentMessages.map((message) => message.type)).toEqual([
      MessageType.LOG,
      MessageType.PLAYER_NAME,
      MessageType.OPPONENT_NAME,
      MessageType.GAME_CONFIGURATION,
      MessageType.TURN_START,
      MessageType.STATISTIC,
      MessageType.CARDS,
      MessageType.CARD_COUNT,
      MessageType.TOP_CARD,
      MessageType.SHARED_CARDS,
      MessageType.PILE_METADATA,
      MessageType.STATUS,
    ]);

    expect(sentMessages[1].content).toEqual({ name: 'alice' });
    expect(sentMessages[2].content).toEqual({ names: ['bob', 'carol'] });
    expect(sentMessages[11].content).toEqual({ status: 'waiting', action: StatusAction.REPLACE });
  });
});

describe('WebSocketMessageTransmitter game configuration', () => {
  it('sends the game configuration unchanged as a game configuration message', () => {
    const socket = new TestSocket();
    const writer = new WebSocketMessageWriter(socket as unknown as WebSocket);
    const transmitter = new WebSocketMessageTransmitter(writer);
    const configuration: GameConfiguration = {
      randomizerSeed: 'seed-1',
      usingPotions: true,
      usingRuins: true,
      usingShelters: false,
      usingPlatinumAndColony: true,
    };

    transmitter.sendGameConfiguration(configuration);

    expect(parseMessages(socket)).toEqual([
      {
        type: MessageType.GAME_CONFIGURATION,
        content: configuration,
      },
    ]);
  });

  it('sends an empty game configuration as an empty content object', () => {
    const socket = new TestSocket();
    const transmitter = new WebSocketMessageTransmitter(new WebSocketMessageWriter(socket as unknown as WebSocket));

    transmitter.sendGameConfiguration({});

    expect(parseMessages(socket)).toEqual([{ type: MessageType.GAME_CONFIGURATION, content: {} }]);
  });
});

describe('WebClient', () => {
  it('wires message transmission and decision resolution through one socket', async () => {
    const socket = new TestSocket();
    const client = new WebClient(socket as unknown as WebSocket);

    client.sendMainPlayerName('ben');
    expect(parseMessages(socket).at(-1)).toEqual({
      type: MessageType.PLAYER_NAME,
      content: { name: 'ben' },
    });

    const decisionService = client.getDecisionService();
    const pendingChoice = decisionService.chooseOneOption('Pick one', 'choose', [{ name: 'Yes' }] as never);

    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: { type: ChoiceType.ChooseOne, name: 'Yes' },
    });

    await expect(pendingChoice).resolves.toEqual({ type: ChoiceType.ChooseOne, name: 'Yes' });
  });
});
