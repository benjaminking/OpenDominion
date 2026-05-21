import { Message } from '@dominion/web-client-common';

type MessageHandler = (data: Buffer) => void;

export class TestSocket {
  private readonly messageHandlers: MessageHandler[] = [];
  public readonly sentPayloads: string[] = [];

  public on(event: string, handler: MessageHandler): this {
    if (event === 'message') {
      this.messageHandlers.push(handler);
    }
    return this;
  }

  public send(payload: string): void {
    this.sentPayloads.push(payload);
  }

  public emitMessage(message: Message): void {
    const encoded = Buffer.from(JSON.stringify(message));
    for (const handler of this.messageHandlers) {
      handler(encoded);
    }
  }

  public emitRawMessage(payload: string): void {
    const encoded = Buffer.from(payload);
    for (const handler of this.messageHandlers) {
      handler(encoded);
    }
  }
}
