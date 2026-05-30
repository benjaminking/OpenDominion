import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, HostListener, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { LobbyUserView, TableApiService, TableView } from '../services/table-api.service';
import { AvatarService } from '../services/avatar.service';
import { loadTableSetup } from '../services/table-setup-storage';
import { UserAvatarComponent } from '../components/user-avatar.component';
import { LobbySessionService } from '../services/lobby-session.service';

interface DmEntry {
  senderUserId: string;
  senderUsername: string;
  text: string;
  timestamp: number;
}

@Component({
  selector: 'app-lobby-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, UserAvatarComponent],
  templateUrl: './lobby-page.component.html',
  styleUrl: './lobby-page.component.css',
})
export class LobbyPageComponent implements OnInit, OnDestroy {
  public readonly tables = signal<TableView[]>([]);
  public readonly isLoading = signal(false);
  public readonly hasLoadedTables = signal(false);
  public readonly hasLoadedUsers = signal(false);
  public readonly errorMessage = signal('');
  public readonly createError = signal('');
  public readonly userSearch = signal('');
  public readonly users = signal<LobbyUserView[]>([]);
  public readonly filteredOnlineUsers = computed(() => {
    const query: string = this.userSearch().trim().toLowerCase();
    const sortedUsers: LobbyUserView[] = [...this.users()].sort((left, right) => {
      if (left.online !== right.online) {
        return left.online ? -1 : 1;
      }

      return left.username.localeCompare(right.username);
    });

    if (!query) {
      return sortedUsers;
    }

    return sortedUsers.filter((user) => user.username.toLowerCase().includes(query));
  });

  public readonly userMenuOpen = signal(false);

  public readonly currentUsername = computed(() => this.authService.session()?.username ?? '');
  public readonly currentUserId = computed(() => this.authService.session()?.userId ?? '');
  public readonly currentAvatar = computed(() => {
    const userId = this.authService.session()?.userId;
    return userId ? this.avatarService.avatarFor(userId)() : null;
  });

  public readonly dmTarget = signal<LobbyUserView | null>(null);
  public readonly dmMessages = signal<DmEntry[]>([]);
  public readonly dmInput = signal('');

  @ViewChild('dmScroll') private dmScrollRef?: ElementRef<HTMLElement>;

  private readonly dmHistory = new Map<string, DmEntry[]>();
  private dmSubscription: Subscription | null = null;

  private refreshHandle: ReturnType<typeof setInterval> | null = null;

  public constructor(
    private readonly authService: AuthService,
    private readonly tableApiService: TableApiService,
    private readonly avatarService: AvatarService,
    private readonly lobbySessionService: LobbySessionService,
    private readonly router: Router,
  ) {
    setTimeout(() => {
      this.loadTables();
      this.loadUsers();
    }, 0);
  }

  public ngOnInit(): void {
    this.lobbySessionService.connect();
    this.dmSubscription = this.lobbySessionService.messages().subscribe((raw) => {
      try {
        const msg = JSON.parse(raw) as { type?: string; content?: DmEntry };
        if (msg.type === 'dm' && msg.content) {
          const entry = msg.content;
          const history = this.dmHistory.get(entry.senderUserId) ?? [];
          history.push(entry);
          this.dmHistory.set(entry.senderUserId, history);
          if (this.dmTarget()?.id === entry.senderUserId) {
            this.dmMessages.set([...history]);
            this.scrollDmToBottom();
          } else {
            // Auto-open chat panel so the recipient is alerted
            const sender = this.users().find((u) => u.id === entry.senderUserId) ?? {
              id: entry.senderUserId,
              username: entry.senderUsername,
              online: true,
            };
            this.dmTarget.set(sender);
            this.dmMessages.set([...history]);
            this.scrollDmToBottom();
          }
        }
      } catch {
        // ignore malformed messages
      }
    });

    this.refreshHandle = setInterval(() => {
      this.loadTables();
      this.loadUsers();
    }, 4000);
  }

  public ngOnDestroy(): void {
    if (this.refreshHandle) {
      clearInterval(this.refreshHandle);
    }
    this.dmSubscription?.unsubscribe();
    this.lobbySessionService.disconnect();
  }

  public loadUsers(): void {
    this.tableApiService.listUsers().subscribe({
      next: ({ users }) => {
        this.hasLoadedUsers.set(true);
        this.users.set(users);
        for (const user of users) {
          this.avatarService.preload(user.id, user.avatar);
        }
      },
      error: (errorResponse: { error?: { error?: string }; status?: number }) => {
        this.hasLoadedUsers.set(true);
        if (errorResponse.status === 401) {
          this.authService.clearSession();
          this.router.navigateByUrl('/login');
        }
      },
    });
  }

  public loadTables(): void {
    this.isLoading.set(true);
    this.tableApiService.listTables().subscribe({
      next: ({ tables }) => {
        this.isLoading.set(false);
        this.hasLoadedTables.set(true);
        this.errorMessage.set('');
        this.tables.set(tables);
      },
      error: (errorResponse: { error?: { error?: string }; status?: number }) => {
        this.isLoading.set(false);
        this.hasLoadedTables.set(true);
        if (errorResponse.status === 401) {
          this.authService.clearSession();
          this.router.navigateByUrl('/login');
          return;
        }

        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to load tables.');
      },
    });
  }

  public createTable(): void {
    this.createError.set('');
    const saved = loadTableSetup();

    this.tableApiService
      .createTable({
        name: saved?.name ?? 'New Table',
        maxPlayers: saved?.maxPlayers ?? 4,
        requiredCardNames: [],
      })
      .subscribe({
        next: ({ table }) => {
          this.router.navigate(['/tables', table.id], { state: { table } });
        },
        error: (errorResponse: { error?: { error?: string } }) => {
          this.createError.set(errorResponse.error?.error ?? 'Unable to create table.');
        },
      });
  }

  public joinTable(tableId: string): void {
    this.tableApiService.joinTable(tableId).subscribe({
      next: ({ table }) => {
        this.router.navigate(['/tables', tableId], { state: { table } });
      },
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Unable to join table.');
      },
    });
  }

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

  public navigateToProfile(userId: string): void {
    this.router.navigate(['/profile', userId]);
  }

  public navigateToOwnProfile(): void {
    this.userMenuOpen.set(false);
    const userId = this.authService.session()?.userId;
    if (userId) this.router.navigate(['/profile', userId]);
  }

  public logout(): void {
    this.userMenuOpen.set(false);
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigateByUrl('/login');
      },
      error: () => {
        this.authService.clearSession();
        this.router.navigateByUrl('/login');
      },
    });
  }

  public setUserSearch(value: string): void {
    this.userSearch.set(value);
  }

  // ── DM chat ────────────────────────────────────────────────────────────────

  public openChat(user: LobbyUserView): void {
    if (this.dmTarget()?.id === user.id) return;
    this.dmTarget.set(user);
    this.dmMessages.set([...(this.dmHistory.get(user.id) ?? [])]);
    this.scrollDmToBottom();
  }

  public closeChat(): void {
    this.dmTarget.set(null);
    this.dmMessages.set([]);
  }

  public sendDmMessage(): void {
    const text = this.dmInput().trim();
    const target = this.dmTarget();
    if (!text || !target) return;
    this.lobbySessionService.sendDm(target.id, text);
    const entry: DmEntry = {
      senderUserId: this.currentUserId(),
      senderUsername: this.currentUsername(),
      text,
      timestamp: Date.now(),
    };
    const history = this.dmHistory.get(target.id) ?? [];
    history.push(entry);
    this.dmHistory.set(target.id, history);
    this.dmMessages.set([...history]);
    this.dmInput.set('');
    this.scrollDmToBottom();
  }

  private scrollDmToBottom(): void {
    setTimeout(() => {
      const el = this.dmScrollRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  public waitingCount(table: TableView): number {
    return Math.max(table.maxPlayers - table.closedSeatIndexes.length - table.seats.length, 0);
  }

  public playerSummary(table: TableView): string {
    if (table.seats.length === 0) {
      return 'No players yet';
    }

    return table.seats.map((seat) => seat.username).join(', ');
  }

  public canJoinTable(table: TableView): boolean {
    return this.waitingCount(table) > 0;
  }

  public isUserInTable(userId: string): boolean {
    return this.tables().some((table) => table.seats.some((seat) => seat.userId === userId));
  }

  public isOwnedByCurrentUser(table: TableView): boolean {
    return this.authService.session()?.userId === table.ownerUserId;
  }

  public deleteTable(tableId: string): void {
    if (!confirm('Are you sure you want to delete this table?')) {
      return;
    }
    this.tableApiService.deleteTable(tableId).subscribe({
      next: () => this.loadTables(),
      error: (errorResponse: { error?: { error?: string } }) => {
        this.errorMessage.set(errorResponse.error?.error ?? 'Failed to delete table.');
      },
    });
  }
}
