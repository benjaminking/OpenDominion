import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class LobbySessionService {
  private socket: WebSocket | null = null;
  private readonly rawMessage$ = new Subject<string>();

  public constructor(private readonly authService: AuthService) {}

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const accessToken = this.authService.accessToken();
    if (!accessToken) return;

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${location.host}?accessToken=${encodeURIComponent(accessToken)}`;

    this.socket = new WebSocket(url);

    this.socket.onmessage = (evt: MessageEvent) => {
      this.rawMessage$.next(evt.data as string);
    };

    this.socket.onclose = () => {
      this.socket = null;
    };

    this.socket.onerror = () => {
      // Keep the socket object so callers can observe the failure state.
    };
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public sendDm(recipientUserId: string, text: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type: 'dm', content: { recipientUserId, text } }));
  }

  public messages(): Observable<string> {
    return this.rawMessage$.asObservable();
  }
}
