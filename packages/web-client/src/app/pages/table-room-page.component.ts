import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { concatMap, from, last, Observable, of, Subscription } from 'rxjs';
import { CardLocation, CardMetadata, GameResult } from '@dominion/common';
import { CardInfoLookup } from '@dominion/card-info';

import { AuthService } from '../auth/auth.service';
import { GameSessionService } from '../services/game-session.service';
import { AvatarData, SeatStateChoice, TableApiService, TableSeat, TableView } from '../services/table-api.service';
import { AvatarService } from '../services/avatar.service';
import { CardComponent } from '../cards/card.component';
import { UserAvatarComponent } from '../components/user-avatar.component';
import { loadTableSetup, saveTableSetup } from '../services/table-setup-storage';
import { GameResultTableComponent } from './game-result-table.component';

interface ChatEntry {
  username: string;
  text: string;
  timestamp: number;
}

@Component({
  selector: 'app-table-room-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CardComponent, UserAvatarComponent, GameResultTableComponent],
  templateUrl: './table-room-page.component.html',
  styleUrl: './table-room-page.component.css',
})
export class TableRoomPageComponent implements OnInit, OnDestroy {
  public static readonly AVAILABLE_BOTS = ['MilitiaBMBot', 'SmithyBMBot'] as const;
  private static readonly COLONY_PLATINUM_PREVIEW_CARDS = ['Colony', 'Platinum'] as const;
  private static readonly SHELTERS_PREVIEW_CARDS = ['Necropolis', 'Hovel', 'Overgrown Estate'] as const;

  public readonly table = signal<TableView | null>(null);
  public readonly gameResult = signal<GameResult | null>(null);
  public readonly errorMessage = signal('');
  public readonly maxPlayersInput = signal(2);
  public readonly selectedBotBySeat = signal<Record<number, string>>({});

  public readonly selectedCards = signal<string[]>([]);
  public readonly cardSearchInput = signal('');
  public readonly cardSuggestions = signal<string[]>([]);

  public readonly isEditingName = signal(false);
  public readonly editingNameInput = signal('');

  public readonly isOwner = computed(
    () => !!this.table() && this.authService.session()?.userId === this.table()!.ownerUserId,
  );

  public readonly userMenuOpen = signal(false);

  public readonly currentUsername = computed(() => this.authService.session()?.username ?? '');
  public readonly currentUserId = computed(() => this.authService.session()?.userId ?? '');
  public readonly currentAvatar = computed(() => {
    const userId = this.authService.session()?.userId;
    return userId ? this.avatarService.avatarFor(userId)() : null;
  });

  public readonly chatMessages = signal<ChatEntry[]>([]);
  public readonly chatInput = signal('');

  @ViewChild('chatScroll') private chatMessagesRef?: ElementRef<HTMLElement>;

  private readonly allCardNames: string[] = CardInfoLookup.getKingdomCardNames();
  private tableId = '';
  private refreshHandle: ReturnType<typeof setInterval> | null = null;
  private gameRedirected = false;
  private chatSubscription: Subscription | null = null;

  public constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly gameSessionService: GameSessionService,
    private readonly tableApiService: TableApiService,
    private readonly avatarService: AvatarService,
  ) {
    const navigation = this.router.getCurrentNavigation();
    const tableFromState = navigation?.extras.state?.['table'] as TableView | undefined;
    const gameResultFromState = navigation?.extras.state?.['gameResult'] as GameResult | undefined;

    if (tableFromState) {
      this.applyTable(tableFromState);
    }
    if (gameResultFromState) {
      this.gameResult.set(gameResultFromState);
    }
  }

  public ngOnInit(): void {
    this.tableId = this.activatedRoute.snapshot.paramMap.get('tableId') ?? '';
    if (!this.tableId) {
      this.router.navigateByUrl('/lobby');
      return;
    }

    this.loadTable((table) => this.tryInitialBotFill(table));

    try {
      this.gameSessionService.connect(this.tableId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect table session';
      this.errorMessage.set(message);
    }

    this.chatSubscription = this.gameSessionService.messages().subscribe((raw) => {
      try {
        const msg = JSON.parse(raw) as { type?: string; content?: ChatEntry };
        if (msg.type === 'chat' && msg.content) {
          this.chatMessages.update((msgs) => [...msgs, msg.content!]);
          this.scrollChatToBottom();
        }
      } catch {
        // ignore malformed messages
      }
    });

    this.refreshHandle = setInterval(() => {
      if (this.table()?.status === 'IN_GAME') {
        if (this.refreshHandle) {
          clearInterval(this.refreshHandle);
          this.refreshHandle = null;
        }
        // Fallback: if applyTable's navigation was silently cancelled (router busy),
        // retry here now that the interval has seen the IN_GAME status.
        if (!this.isOwner() && !this.gameRedirected) {
          this.gameRedirected = true;
          void this.router.navigate(['/game'], { queryParams: { tableId: this.tableId } });
        }
        return;
      }
      this.loadTable();
    }, 3000);
  }

  public ngOnDestroy(): void {
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle);
    }
    this.chatSubscription?.unsubscribe();
    // Keep the WebSocket alive when navigating to the game so GameComponent can reuse it.
    if (this.table()?.status !== 'IN_GAME') {
      this.gameSessionService.disconnect();
    }
  }

  public loadTable(afterLoad?: (table: TableView) => void): void {
    this.tableApiService.getTable(this.tableId).subscribe({
      next: ({ table }) => {
        this.applyTable(table);
        afterLoad?.(table);
      },
      error: (errorResponse: { error?: { error?: string }; status?: number }) => {
        if (errorResponse.status === 401) {
          this.authService.clearSession();
          this.router.navigateByUrl('/login');
          return;
        }
        this.errorMessage.set(errorResponse.error?.error ?? 'Unable to load table.');
      },
    });
  }

  public leave(): void {
    this.tableApiService.leaveTable(this.tableId).subscribe({
      next: () => {
        this.router.navigateByUrl('/lobby');
      },
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to leave table.');
      },
    });
  }

  // ── User menu ─────────────────────────────────────────────────────────────

  public toggleUserMenu(): void {
    this.userMenuOpen.update((v) => !v);
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-wrap')) {
      this.userMenuOpen.set(false);
    }
  }

  public navigateToOwnProfile(): void {
    this.userMenuOpen.set(false);
    const userId = this.authService.session()?.userId;
    if (userId) this.router.navigate(['/profile', userId]);
  }

  public logout(): void {
    this.userMenuOpen.set(false);
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => {
        this.authService.clearSession();
        this.router.navigateByUrl('/login');
      },
    });
  }

  // ── Name editing ──────────────────────────────────────────────────────────

  public startEditingName(): void {
    if (!this.isOwner() || this.table()?.status !== 'OPEN') return;
    this.editingNameInput.set(this.table()?.name ?? '');
    this.isEditingName.set(true);
  }

  public saveName(): void {
    const trimmed = this.editingNameInput().trim();
    if (!trimmed) return;
    this.isEditingName.set(false);
    this.tableApiService.updateTableSettings(this.tableId, { name: trimmed }).subscribe({
      next: ({ table }) => this.applyTable(table),
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to rename table.');
      },
    });
  }

  public cancelEditingName(): void {
    this.isEditingName.set(false);
  }

  // ── Max players ───────────────────────────────────────────────────────────

  public adjustMaxPlayers(delta: number): void {
    const table = this.table();
    if (!table || !this.isOwner() || table.status !== 'OPEN') return;
    const newCount = Math.max(1, Math.min(4, table.maxPlayers + delta));
    if (newCount === table.maxPlayers) return;

    this.maxPlayersInput.set(newCount);

    const humanSeatsToRemove =
      newCount < table.maxPlayers ? table.seats.filter((s) => s.seatIndex >= newCount && !s.isBot && !!s.userId) : [];

    const kickAll$: Observable<unknown> =
      humanSeatsToRemove.length > 0
        ? from(humanSeatsToRemove).pipe(
            concatMap((s) => this.tableApiService.kickPlayer(this.tableId, s.userId!)),
            last(),
          )
        : of(null);

    kickAll$
      .pipe(concatMap(() => this.tableApiService.updateTableSettings(this.tableId, { maxPlayers: newCount })))
      .subscribe({
        next: ({ table: t }: { table: TableView }) => this.applyTable(t),
        error: (errorResponse: { error?: { error?: string } }) => {
          this.errorMessage.set(errorResponse.error?.error ?? 'Failed to update player count.');
        },
      });
  }

  // ── Cards ─────────────────────────────────────────────────────────────────

  public updateCardSearch(query: string): void {
    this.cardSearchInput.set(query);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      this.cardSuggestions.set([]);
      return;
    }
    this.cardSuggestions.set(
      this.allCardNames
        .filter((name) => !this.selectedCards().includes(name) && name.toLowerCase().includes(trimmed))
        .slice(0, 8),
    );
  }

  public hideSuggestions(): void {
    setTimeout(() => {
      this.cardSuggestions.set([]);
    }, 150);
  }

  public addCard(name: string): void {
    if (this.selectedCards().includes(name)) return;
    this.selectedCards.set([...this.selectedCards(), name]);
    this.cardSearchInput.set('');
    this.cardSuggestions.set([]);
    this.saveCards();
  }

  public removeCard(name: string): void {
    this.selectedCards.set(this.selectedCards().filter((c) => c !== name));
    this.saveCards();
  }

  public colonyPlatinumPreviewCards(): CardMetadata[] {
    return this.buildPreviewMetadata(TableRoomPageComponent.COLONY_PLATINUM_PREVIEW_CARDS);
  }

  public sheltersPreviewCards(): CardMetadata[] {
    return this.buildPreviewMetadata(TableRoomPageComponent.SHELTERS_PREVIEW_CARDS);
  }

  public updateUseColoniesPlatinum(enabled: boolean): void {
    this.tableApiService.updateTableSettings(this.tableId, { useColoniesPlatinum: enabled }).subscribe({
      next: ({ table }) => this.applyTable(table),
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to update Colonies/Platinum setting.');
      },
    });
  }

  public updateUseShelters(enabled: boolean): void {
    this.tableApiService.updateTableSettings(this.tableId, { useShelters: enabled }).subscribe({
      next: ({ table }) => this.applyTable(table),
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to update Shelters setting.');
      },
    });
  }

  public cardMetadataFor(name: string): CardMetadata {
    const info = CardInfoLookup.lookUpCardInfo(name);
    return { name, id: name, location: CardLocation.PILE, types: info.types, cost: info.cost };
  }

  private saveCards(): void {
    this.tableApiService.updateTableSettings(this.tableId, { requiredCardNames: this.selectedCards() }).subscribe({
      next: ({ table }) => this.applyTable(table),
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to update cards.');
      },
    });
  }

  private buildPreviewMetadata(cardNames: readonly string[]): CardMetadata[] {
    return cardNames
      .map((name) => {
        try {
          return this.cardMetadataFor(name);
        } catch {
          return null;
        }
      })
      .filter((metadata): metadata is CardMetadata => metadata !== null);
  }

  // ── Seats ─────────────────────────────────────────────────────────────────

  public seatIndexes(): number[] {
    if (!this.table()) return [];
    return Array.from({ length: this.table()!.maxPlayers }, (_, i) => i);
  }

  public seatAt(seatIndex: number): TableSeat | undefined {
    return this.table()?.seats.find((seat) => seat.seatIndex === seatIndex);
  }

  public isSeatClosed(seatIndex: number): boolean {
    return !!this.table()?.closedSeatIndexes.includes(seatIndex);
  }

  public seatStateChoice(seatIndex: number): SeatStateChoice {
    const seat = this.seatAt(seatIndex);
    if (seat?.isBot) return 'BOT';
    if (this.isSeatClosed(seatIndex)) return 'CLOSED';
    return 'OPEN';
  }

  public updateSeatState(seatIndex: number, value: string): void {
    if (!this.table() || !this.isOwner() || this.table()!.status !== 'OPEN') return;
    const state: SeatStateChoice = value === 'BOT' || value === 'CLOSED' ? value : 'OPEN';
    const selectedBotName = state === 'BOT' ? this.selectedBotForSeat(seatIndex) : undefined;
    this.tableApiService.setSeatState(this.tableId, seatIndex, state, selectedBotName).subscribe({
      next: ({ table }) => this.applyTable(table),
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to update seat state.');
      },
    });
  }

  public availableBotNames(): readonly string[] {
    return TableRoomPageComponent.AVAILABLE_BOTS;
  }

  public selectedBotForSeat(seatIndex: number): string {
    const seat = this.seatAt(seatIndex);
    if (seat?.isBot && this.availableBotNames().includes(seat.username)) {
      return seat.username;
    }
    return this.selectedBotBySeat()[seatIndex] ?? 'MilitiaBMBot';
  }

  public updateBotChoice(seatIndex: number, botName: string): void {
    this.selectedBotBySeat.update((choices) => ({
      ...choices,
      [seatIndex]: botName,
    }));

    const seat = this.seatAt(seatIndex);
    if (!seat?.isBot || !this.isOwner() || this.table()?.status !== 'OPEN') {
      return;
    }

    this.tableApiService.setSeatState(this.tableId, seatIndex, 'BOT', botName).subscribe({
      next: ({ table }) => this.applyTable(table),
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to update bot.');
      },
    });
  }

  public seatDisplayName(seatIndex: number): string {
    const seat = this.seatAt(seatIndex);
    if (seat?.isBot) return seat.username;
    if (seat?.userId) return seat.username;
    if (this.isSeatClosed(seatIndex)) return 'Closed';
    return 'Open';
  }

  public seatAvatar(seatIndex: number): AvatarData | null {
    const seat = this.seatAt(seatIndex);
    if (!seat?.userId || seat.isBot) return null;
    return this.avatarService.avatarFor(seat.userId)();
  }

  public seatRoleLabel(seatIndex: number): string {
    const seat = this.seatAt(seatIndex);
    if (seat?.isBot) return 'Bot';
    if (seat?.userId) return seatIndex === 0 ? 'Owner' : 'Player';
    return this.isSeatClosed(seatIndex) ? 'Closed' : 'Waiting';
  }

  // ── Start game ────────────────────────────────────────────────────────────

  public canStartTable(): boolean {
    if (!this.table() || !this.isOwner() || this.table()!.status !== 'OPEN') return false;
    return true;
  }

  public startDisabledReason(): string {
    if (!this.table()) return 'Table is loading.';
    if (this.table()!.status !== 'OPEN') return 'Game has already started.';
    if (!this.isOwner()) return 'Only the owner can start the game.';
    const activeSeatCount = this.table()!.maxPlayers - this.table()!.closedSeatIndexes.length;
    if (this.table()!.seats.length < activeSeatCount) return 'All seats must be filled before starting.';
    return 'Ready to start.';
  }

  public startGame(): void {
    this.tableApiService.startGame(this.tableId).subscribe({
      next: ({ table }) => {
        this.gameResult.set(null);
        const setup = {
          name: table.name,
          maxPlayers: table.maxPlayers,
          botSeatIndexes: table.seats.filter((s) => s.isBot).map((s) => s.seatIndex),
        };
        console.log('[botFill] saving setup on game start:', setup);
        saveTableSetup(setup);
        this.applyTable(table);
        this.router.navigate(['/game'], { queryParams: { tableId: this.tableId } });
      },
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to start game.');
      },
    });
  }

  // ── Rematch ──────────────────────────────────────────────────────────────

  public rematchAcceptedUserIds(): string[] {
    return this.table()?.rematch?.acceptedUserIds ?? [];
  }

  public hasCurrentUserAcceptedRematch(): boolean {
    const userId = this.currentUserId();
    if (!userId) return false;
    return this.rematchAcceptedUserIds().includes(userId);
  }

  public isCurrentUserSeatedHuman(): boolean {
    const userId = this.currentUserId();
    if (!userId || !this.table()) return false;
    return this.table()!.seats.some((seat) => !seat.isBot && seat.userId === userId);
  }

  public canProposeRematch(): boolean {
    const table = this.table();
    if (!table || table.status !== 'CLOSED') return false;
    if (!this.isCurrentUserSeatedHuman()) return false;
    if (table.rematch?.unavailable) return false;
    return !table.rematch?.proposedByUserId;
  }

  public canAcceptRematch(): boolean {
    const table = this.table();
    if (!table || table.status !== 'CLOSED') return false;
    if (!this.isCurrentUserSeatedHuman()) return false;
    if (table.rematch?.unavailable) return false;
    if (!table.rematch?.proposedByUserId) return false;
    return !this.hasCurrentUserAcceptedRematch();
  }

  public rematchProposedByName(): string {
    const proposer = this.table()?.rematch?.proposedByUserId;
    if (!proposer || !this.table()) return '';
    const seat = this.table()!.seats.find((s) => s.userId === proposer);
    return seat?.username ?? '';
  }

  public acceptedRematchNames(): string[] {
    if (!this.table()) return [];
    const accepted = new Set(this.rematchAcceptedUserIds());
    return this.table()!
      .seats.filter((seat) => !seat.isBot && !!seat.userId && accepted.has(seat.userId))
      .map((seat) => seat.username);
  }

  public pendingRematchNames(): string[] {
    if (!this.table()) return [];
    const accepted = new Set(this.rematchAcceptedUserIds());
    return this.table()!
      .seats.filter((seat) => !seat.isBot && !!seat.userId && !accepted.has(seat.userId))
      .map((seat) => seat.username);
  }

  public proposeRematch(): void {
    this.tableApiService.proposeRematch(this.tableId).subscribe({
      next: ({ table }) => {
        this.applyTable(table);
      },
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to propose rematch.');
      },
    });
  }

  public acceptRematch(): void {
    this.tableApiService.acceptRematch(this.tableId).subscribe({
      next: ({ table }) => {
        this.applyTable(table);
      },
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to accept rematch.');
      },
    });
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  private static readonly SEAT_COLORS = ['#f5c542', '#5dd8c8', '#ff8c69', '#b09aff'];

  public chatSenderColor(username: string): string {
    const seat = this.table()?.seats.find((s) => s.username === username);
    if (seat === undefined) return '#7db8ff';
    return TableRoomPageComponent.SEAT_COLORS[seat.seatIndex % TableRoomPageComponent.SEAT_COLORS.length] ?? '#7db8ff';
  }

  public sendChatMessage(): void {
    const text = this.chatInput().trim();
    if (!text) return;
    const ws = this.gameSessionService.socketForTable(this.tableId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'chat', content: { text } }));
    this.chatInput.set('');
  }

  public hasChatMessages(): boolean {
    return this.chatMessages().length > 0;
  }

  public canSendChatMessage(): boolean {
    return this.chatInput().trim().length > 0;
  }

  public hasSelectedCards(): boolean {
    return this.selectedCards().length > 0;
  }

  public hasCardSuggestions(): boolean {
    return this.cardSuggestions().length > 0;
  }

  public acceptedRematchNamesDisplay(): string {
    return this.acceptedRematchNames().join(', ') || 'None yet';
  }

  public pendingRematchNamesDisplay(): string {
    return this.pendingRematchNames().join(', ') || 'Nobody';
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = this.chatMessagesRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  // ── Navigation guard ──────────────────────────────────────────────────────

  public canDeactivate(): boolean {
    if (this.isOwner() && this.table()?.status === 'OPEN') {
      return window.confirm('You are the owner of this table. If you leave, the table will be deleted. Are you sure?');
    }
    return true;
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private applyTable(table: TableView): void {
    const previousStatus = this.table()?.status;
    // Ignore stale responses that would roll back a status advance (e.g. a
    // polled OPEN response arriving after the start-game POST already set IN_GAME).
    const statusRank: Record<string, number> = { OPEN: 0, IN_GAME: 1, CLOSED: 2 };
    const isRematchResetTransition = previousStatus === 'CLOSED' && table.status === 'OPEN';
    if (
      !isRematchResetTransition &&
      (statusRank[table.status] ?? 0) < (statusRank[this.table()?.status ?? 'OPEN'] ?? 0)
    ) {
      return;
    }

    this.errorMessage.set('');
    this.table.set(table);
    this.maxPlayersInput.set(table.maxPlayers);
    this.selectedCards.set([...table.requiredCardNames]);
    this.selectedBotBySeat.update((existingChoices) => {
      const nextChoices = { ...existingChoices };
      for (const seat of table.seats) {
        if (seat.isBot) {
          nextChoices[seat.seatIndex] = seat.username;
        }
      }
      return nextChoices;
    });

    if (previousStatus === 'CLOSED' && table.status === 'OPEN') {
      this.gameResult.set(null);
    }

    // Trigger avatar loads for human seat occupants
    for (const seat of table.seats) {
      if (seat.userId && !seat.isBot) {
        this.avatarService.avatarFor(seat.userId);
      }
    }

    // Non-owners navigate to the game as soon as the status transitions to IN_GAME.
    // (Owners navigate explicitly in startGame() after calling applyTable.)
    if (table.status === 'IN_GAME' && !this.isOwner() && !this.gameRedirected) {
      this.gameRedirected = true;
      void this.router.navigate(['/game'], { queryParams: { tableId: this.tableId } });
    }
  }

  /** Called once on the initial ngOnInit load to auto-fill saved bot seats. */
  private tryInitialBotFill(table: TableView): void {
    if (table.status !== 'OPEN' || table.seats.length !== 1 || !this.isOwner()) return;
    const saved = loadTableSetup();
    const botIndexes = (saved?.botSeatIndexes ?? []).filter((i) => i > 0 && i < table.maxPlayers);
    if (botIndexes.length === 0) return;
    // Sequential requests avoid MongoDB write conflicts; apply the final result
    // directly (no extra GET that could be served from browser cache).
    from(botIndexes)
      .pipe(
        concatMap((i) => this.tableApiService.setSeatState(this.tableId, i, 'BOT')),
        last(),
      )
      .subscribe({
        next: ({ table: finalTable }) => this.applyTable(finalTable),
        error: (err: unknown) => {
          console.error('[botFill] error:', err);
          this.loadTable();
        },
      });
  }
}
