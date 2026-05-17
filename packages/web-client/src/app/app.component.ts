import { Component, OnInit, OnDestroy, signal, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameComponent } from './game.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, GameComponent],
  template: ` <game></game> `,
  /*<div style="font-family: Arial, Helvetica, sans-serif; padding: 1rem;">
      <h1>Dominion Game Client (Angular)</h1>
      <p>Status: {{ status }}</p>
      <input [(ngModel)]="messageToSend" placeholder="Message to server" />
      <button (click)="send()">Send</button>
      <h3>Messages</h3>
      <ul>
        @for (m of messages(); track m) {
          <li>{{ m }}</li>
        }
      </ul>
    </div>*/
})
export class AppComponent {}
/*export class AppComponent implements OnInit, OnDestroy {
  status = 'disconnected';
  ws: WebSocket | null = null;
  messages = signal<string[]>([]);
  messageToSend = '';

  ngOnInit(): void {
    this.connect();
  }

  ngOnDestroy(): void {
    if (this.ws) {
      this.ws.close();
    }
  }

  connect(): void {
    this.ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`);
    this.ws.onopen = () => {
      this.status = 'connected';
      this.messages.update((current) => [...current, 'Connected to server']);
    };
    this.ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string);
        this.messages.update((current) => [...current, JSON.stringify(data)]);
      } catch (e) {
        this.messages.update((current) => [...current, evt.data as string]);
      }
    };
    this.ws.onclose = () => {
      this.status = 'disconnected';
      this.messages.update((current) => [...current, 'Disconnected']);
    };
    this.ws.onerror = (err) => {
      this.messages.update((current) => [...current, 'WebSocket error']);
      console.error(err);
    };
  }

  send(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(this.messageToSend);
      this.messageToSend = '';
    } else {
      this.messages.update((current) => [...current, 'Not connected']);
    }
  }
}*/
