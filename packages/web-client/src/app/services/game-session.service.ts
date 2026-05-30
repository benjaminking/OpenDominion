import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class GameSessionService {
  private socket: WebSocket | null = null;
  private currentTableId: string | null = null;
  private messageBuffer: string[] = [];
  private readonly rawMessage$ = new Subject<string>();

  public constructor(private readonly authService: AuthService) {}

  public connect(tableId: string): WebSocket {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.currentTableId === tableId) {
      return this.socket;
    }

    if (this.socket && this.socket.readyState === WebSocket.CONNECTING && this.currentTableId === tableId) {
      return this.socket;
    }

    const accessToken: string | null = this.authService.accessToken();
    if (!accessToken) {
      throw new Error('Missing access token');
    }

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${location.host}?accessToken=${encodeURIComponent(accessToken)}&tableId=${encodeURIComponent(tableId)}`;

    this.currentTableId = tableId;
    this.socket = new WebSocket(url);

    // Buffer all incoming messages until a consumer (GameComponent) takes over
    // by calling MessageDecoderService.connect(ws).  This ensures that game-init
    // messages sent before the game view is ready are not silently dropped.
    this.socket.onmessage = (evt: MessageEvent) => {
      this.messageBuffer.push(evt.data as string);
      this.rawMessage$.next(evt.data as string);
    };

    this.socket.onclose = () => {
      this.socket = null;
      this.currentTableId = null;
    };

    this.socket.onerror = () => {
      // Keep the socket object available so callers can surface the failure state.
    };

    return this.socket;
  }

  public messages(): Observable<string> {
    return this.rawMessage$.asObservable();
  }

  public socketForTable(tableId: string): WebSocket | null {
    if (this.currentTableId !== tableId) {
      return null;
    }

    return this.socket;
  }

  public currentSocket(): WebSocket | null {
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }

    this.socket = null;
    this.currentTableId = null;
    this.messageBuffer = [];
  }

  /** Returns all buffered messages and clears the buffer. Call this once
   *  GameComponent is ready to process messages (after ngAfterViewInit). */
  public flushBuffer(): string[] {
    const msgs = this.messageBuffer;
    this.messageBuffer = [];
    return msgs;
  }
}
