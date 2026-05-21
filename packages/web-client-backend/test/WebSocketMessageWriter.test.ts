import { MessageType } from '@dominion/web-client-common';
import { WebSocket } from 'ws';
import { describe, expect, it } from 'vitest';

import { WebSocketMessageWriter } from '../src/WebSocketMessageWriter';
import { TestSocket } from './TestSocket';

describe('WebSocketMessageWriter', () => {
  it('serializes outbound messages as JSON', () => {
    const socket = new TestSocket();
    const writer = new WebSocketMessageWriter(socket as unknown as WebSocket);

    writer.sendMessage({
      type: MessageType.STATUS,
      content: {
        status: 'Waiting for players',
        action: 'replace',
      },
    });

    expect(socket.sentPayloads).toHaveLength(1);
    expect(JSON.parse(socket.sentPayloads[0])).toEqual({
      type: MessageType.STATUS,
      content: {
        status: 'Waiting for players',
        action: 'replace',
      },
    });
  });
});
