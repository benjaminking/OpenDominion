import { Message } from '@dominion/web-client-common';
import { WebSocket } from 'ws';

export class WebSocketMessageWriter {
  constructor(public readonly ws: WebSocket) {}

  public sendMessage(message: Message): void {
    this.ws.send(JSON.stringify(message));
  }
}
