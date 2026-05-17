import { Choice, MessageHandler } from '@dominion/common';
import { Message, MessageType, ResolvedChoiceMessage } from '@dominion/web-client-common';
import { WebSocket } from 'ws';

export class WebSocketMessageDecoder {
  private readonly resolvedChoiceHandler = new MessageHandler<Choice>();

  constructor(private readonly ws: WebSocket) {
    ws.on('message', (data: Buffer): void => {
      try {
        const message: Message = JSON.parse(data.toString()) as Message;
        this.processMessage(message);
      } catch (e) {
        console.error('Failed to decode WebSocket message', e);
      }
    });
  }

  public subscribeToChoiceMessage(callback: (choice: Choice) => void): void {
    this.resolvedChoiceHandler.subscribe({}, callback);
  }

  private processMessage(message: Message): void {
    switch (message.type) {
      case MessageType.RESOLVED_CHOICE: {
        const resolvedChoiceMessage: ResolvedChoiceMessage = message as ResolvedChoiceMessage;
        this.resolvedChoiceHandler.handleMessage(resolvedChoiceMessage.content);
        break;
      }
    }
  }
}
