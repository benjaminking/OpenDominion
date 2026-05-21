import { ChoiceType } from '@dominion/common';
import { MessageType } from '@dominion/web-client-common';
import { describe, expect, it, vi } from 'vitest';

import { MessageWriterService } from '../src/app/message-writer.service';

describe('MessageWriterService', () => {
  it('does nothing when no websocket is connected', () => {
    const service = new MessageWriterService();

    expect(() => service.sendChoice({ type: ChoiceType.EndTurn })).not.toThrow();
  });

  it('serializes resolved choices onto the connected websocket', () => {
    const service = new MessageWriterService();
    const send = vi.fn();

    service.connect({ send } as unknown as WebSocket);
    service.sendChoice({ type: ChoiceType.EndTurn });

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({
        type: MessageType.RESOLVED_CHOICE,
        content: { type: ChoiceType.EndTurn },
      }),
    );
  });
});
