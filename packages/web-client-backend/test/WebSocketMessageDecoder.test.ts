import { ChoiceType } from '@dominion/common';
import { MessageType } from '@dominion/web-client-common';
import { WebSocket } from 'ws';
import { describe, expect, it, vi } from 'vitest';

import { WebSocketMessageDecoder } from '../src/WebSocketMessageDecoder';
import { TestSocket } from './TestSocket';

describe('WebSocketMessageDecoder', () => {
  it('forwards resolved choice messages to subscribers', () => {
    const socket = new TestSocket();
    const decoder = new WebSocketMessageDecoder(socket as unknown as WebSocket);
    const receivedChoices: unknown[] = [];

    decoder.subscribeToChoiceMessage((choice) => {
      receivedChoices.push(choice);
    });

    socket.emitMessage({
      type: MessageType.RESOLVED_CHOICE,
      content: {
        type: ChoiceType.None,
      },
    });

    expect(receivedChoices).toEqual([{ type: ChoiceType.None }]);
  });

  it('ignores unknown message types', () => {
    const socket = new TestSocket();
    const decoder = new WebSocketMessageDecoder(socket as unknown as WebSocket);
    const callback = vi.fn();
    decoder.subscribeToChoiceMessage(callback);

    socket.emitMessage({
      type: MessageType.STATUS,
      content: {
        status: 'noop',
        action: 'replace',
      },
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('logs decode errors for invalid payloads', () => {
    const socket = new TestSocket();
    new WebSocketMessageDecoder(socket as unknown as WebSocket);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    socket.emitRawMessage('{not-json');

    expect(errorSpy).toHaveBeenCalledWith('Failed to decode WebSocket message', expect.any(SyntaxError));
    errorSpy.mockRestore();
  });
});
