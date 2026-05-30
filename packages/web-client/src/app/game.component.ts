import { Component, computed, inject, AfterViewInit, OnDestroy, OnInit, Signal, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { GameResult } from '@dominion/common';
import { PilesComponent } from './piles/piles.component';
import { MessageDecoderService } from './message-decoder.service';
import { SharedComponent } from './shared/shared.component';
import { OpponentComponent } from './players/opponent.component';
import { MainPlayerComponent } from './players/main-player.component';
import { PlayAreaComponent } from './shared/play-area.component';
import { LogComponent } from './log/log.component';
import { HandComponent } from './players/hand.component';
import { MessageWriterService } from './message-writer.service';
import { ControlsComponent } from './players/controls.component';
import { DecisionDialogComponent } from './decisions/decision-dialog.component';
import { SettingsComponent } from './settings/settings.component';
import { GameSessionService } from './services/game-session.service';

@Component({
  selector: 'game',
  imports: [
    RouterOutlet,
    PilesComponent,
    SharedComponent,
    OpponentComponent,
    MainPlayerComponent,
    HandComponent,
    PlayAreaComponent,
    ControlsComponent,
    LogComponent,
    DecisionDialogComponent,
    SettingsComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnInit, AfterViewInit, OnDestroy {
  status = 'disconnected';
  private ws: WebSocket | null = null;
  messages = signal<string[]>([]);
  messageToSend = '';
  mainPlayerName = signal<string>('');
  opponentNames = signal<string[]>([]);
  allPlayerNames: Signal<string[]> = computed(() => {
    return [this.mainPlayerName(), ...this.opponentNames()];
  });
  currentPlayerName = signal<string>('');
  private readonly webSocketMessageDecoder = inject(MessageDecoderService);
  private readonly webSocketMessageWriter = inject(MessageWriterService);
  private readonly gameSessionService = inject(GameSessionService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private tableId: string | null = null;

  ngOnInit(): void {
    this.connect();
  }

  /** Replay messages that arrived before this view was ready.  All child
   *  components have registered their subscriptions by the time this runs,
   *  so every handler fires correctly on replay. */
  ngAfterViewInit(): void {
    const buffered = this.gameSessionService.flushBuffer();
    if (buffered.length > 0) {
      this.webSocketMessageDecoder.replayMessages(buffered);
    }
  }

  ngOnDestroy(): void {
    if (this.ws && !this.tableId) {
      this.ws.close();
    }
  }

  connect(): void {
    const tableId: string | null = this.activatedRoute.snapshot.queryParamMap.get('tableId');
    this.tableId = tableId;

    // Prevent stale rematch navigation by clearing any game-result replay from
    // the previous finished game before subscribing for this session.
    this.webSocketMessageDecoder.clearCachedGameResult();

    if (tableId) {
      this.ws = this.gameSessionService.socketForTable(tableId) ?? this.gameSessionService.connect(tableId);
    } else {
      this.ws =
        this.gameSessionService.currentSocket() ??
        new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`);
    }

    this.webSocketMessageDecoder.subscribeToMainPlayerName((mainPlayerContent: { name: string }) => {
      this.mainPlayerName.set(mainPlayerContent.name);
    });
    this.webSocketMessageDecoder.subscribeToOpponentNames((opponentNamesContent: { names: string[] }) => {
      this.opponentNames.set(opponentNamesContent.names);
    });
    this.webSocketMessageDecoder.subscribeToTurnStart((turnStartContent: { playerName: string }) => {
      this.currentPlayerName.set(turnStartContent.playerName);
    });
    this.webSocketMessageDecoder.subscribeToGameResult((result: GameResult) => {
      if (this.tableId) {
        void this.router.navigate(['/tables', this.tableId], { state: { gameResult: result } });
      } else {
        void this.router.navigateByUrl('/lobby');
      }
    });

    this.webSocketMessageDecoder.connect(this.ws);
    this.webSocketMessageWriter.connect(this.ws);
    this.ws!.onopen = () => {
      this.status = 'connected';
      this.messages.update((current) => [...current, 'Connected to server']);
    };
    /*this.ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string);
        this.messages.update((current) => [...current, JSON.stringify(data)]);
      } catch (e) {
        this.messages.update((current) => [...current, evt.data as string]);
      }
    };*/
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
}
/*export class GameComponent {
  title = 'dominion-angular';

  in_play: CardMetadata[] = [
    {
      name: 'chapel',
      id: 'chapel-supply-1',
      location: CardLocation.IN_PLAY,
      types: [CardType.ACTION],
      cost: {
        coins: 2,
        potions: 0,
        debt: 0,
      },
    },
    {
      name: 'militia',
      id: 'militia-supply-1',
      location: CardLocation.IN_PLAY,
      types: [CardType.ACTION, CardType.ATTACK],
      cost: {
        coins: 4,
        potions: 0,
        debt: 0,
      },
    },
  ];
}*/
