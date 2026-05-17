import { Client } from '@dominion/client-common';
import { WebSocket } from 'ws';

import { WebSocketDecisionService } from './WebSocketDecisionService';
import { WebSocketMessageDecoder } from './WebSocketMessageDecoder';
import { WebSocketMessageTransmitter } from './WebSocketMessageTransmitter';
import { WebSocketMessageWriter } from './WebSocketMessageWriter';

export class WebClient extends Client {
  public constructor(private ws: WebSocket) {
    const webSocketMessageWriter = new WebSocketMessageWriter(ws);
    const webSocketMessageTransmitter = new WebSocketMessageTransmitter(webSocketMessageWriter);

    const webSocketMessageDecoder = new WebSocketMessageDecoder(ws);
    const webSocketDecisionService = new WebSocketDecisionService(webSocketMessageDecoder, webSocketMessageWriter);
    super(webSocketDecisionService, webSocketMessageTransmitter, webSocketMessageTransmitter);
  }
}
