import { Injectable } from '@angular/core';
import { Choice } from '@dominion/common';
import { MessageType, ResolvedChoiceMessage } from '@dominion/web-client-common';

@Injectable({ providedIn: 'root' })
export class MessageWriterService {
  private ws: WebSocket | undefined = undefined;

  connect(ws: WebSocket): void {
    this.ws = ws;
  }

  public sendChoice(choice: Choice): void {
    this.ws?.send(
      JSON.stringify({
        type: MessageType.RESOLVED_CHOICE,
        content: choice,
      } as ResolvedChoiceMessage),
    );
  }
}
