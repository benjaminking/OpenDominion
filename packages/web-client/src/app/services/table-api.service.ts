import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

import { AuthService } from '../auth/auth.service';

function resolveApiBaseUrl(path: string): string {
  const origin: string = location.port === '4200' ? 'http://localhost:3000' : location.origin;
  return new URL(path, origin).toString();
}

export interface AvatarCrop {
  x: number;
  y: number;
  s: number;
  ratio: number;
}

export interface AvatarData {
  cardName: string;
  crop: AvatarCrop;
}

export interface TableSeat {
  seatIndex: number;
  userId?: string;
  username: string;
  isBot: boolean;
}

export interface TableView {
  id: string;
  name: string;
  ownerUserId: string;
  ownerUsername: string;
  status: 'OPEN' | 'IN_GAME' | 'CLOSED';
  maxPlayers: number;
  requiredCardNames: string[];
  useColoniesPlatinum: boolean;
  useShelters: boolean;
  seats: TableSeat[];
  closedSeatIndexes: number[];
  rematch?: {
    proposedByUserId?: string;
    acceptedUserIds: string[];
    unavailable: boolean;
  };
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
}

export type SeatStateChoice = 'OPEN' | 'CLOSED' | 'BOT';

export interface LobbyUserView {
  id: string;
  username: string;
  online: boolean;
  avatar?: AvatarData;
}

@Injectable({ providedIn: 'root' })
export class TableApiService {
  private readonly apiBaseUrl = resolveApiBaseUrl('/api/tables');
  private readonly usersApiBaseUrl = resolveApiBaseUrl('/api/users');
  private readonly tableSubject = new Subject<void>();

  public constructor(
    private readonly httpClient: HttpClient,
    private readonly authService: AuthService,
  ) {}

  public tableChanges(): Observable<void> {
    return this.tableSubject.asObservable();
  }

  public listTables(): Observable<{ tables: TableView[] }> {
    return this.httpClient.get<{ tables: TableView[] }>(this.apiBaseUrl, {
      headers: this.authHeaders(),
    });
  }

  public listUsers(): Observable<{ users: LobbyUserView[] }> {
    return this.httpClient.get<{ users: LobbyUserView[] }>(this.usersApiBaseUrl, {
      headers: this.authHeaders(),
    });
  }

  public listOpenTables(): Observable<TableView[]> {
    return this.httpClient.get<TableView[]>(this.apiBaseUrl, { headers: this.authHeaders() });
  }

  public getTable(tableId: string): Observable<{ table: TableView }> {
    return this.httpClient.get<{ table: TableView }>(`${this.apiBaseUrl}/${tableId}`, {
      headers: this.authHeaders(),
    });
  }

  public createTable(payload: {
    name: string;
    maxPlayers: number;
    requiredCardNames: string[];
  }): Observable<{ table: TableView }> {
    return this.httpClient
      .post<{ table: TableView }>(this.apiBaseUrl, payload, {
        headers: this.authHeaders(),
      })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public joinTable(tableId: string): Observable<{ table: TableView }> {
    return this.httpClient
      .post<{ table: TableView }>(`${this.apiBaseUrl}/${tableId}/join`, {}, { headers: this.authHeaders() })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public leaveTable(tableId: string): Observable<{ table: TableView }> {
    return this.httpClient
      .post<{ table: TableView }>(`${this.apiBaseUrl}/${tableId}/leave`, {}, { headers: this.authHeaders() })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public updateTableSettings(
    tableId: string,
    payload: {
      name?: string;
      maxPlayers?: number;
      requiredCardNames?: string[];
      useColoniesPlatinum?: boolean;
      useShelters?: boolean;
    },
  ): Observable<{ table: TableView }> {
    return this.httpClient
      .patch<{ table: TableView }>(`${this.apiBaseUrl}/${tableId}`, payload, {
        headers: this.authHeaders(),
      })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public setSeatState(
    tableId: string,
    seatIndex: number,
    state: SeatStateChoice,
    botName?: string,
  ): Observable<{ table: TableView }> {
    return this.httpClient
      .put<{
        table: TableView;
      }>(`${this.apiBaseUrl}/${tableId}/seats/${seatIndex}`, { state, botName }, { headers: this.authHeaders() })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public kickSeat(tableId: string, seatIndex: number): Observable<{ table: TableView }> {
    return this.httpClient
      .post<{
        table: TableView;
      }>(`${this.apiBaseUrl}/${tableId}/seats/${seatIndex}/kick`, {}, { headers: this.authHeaders() })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public addBot(tableId: string, botName = 'MilitiaBMBot'): Observable<{ table: TableView }> {
    return this.httpClient
      .post<{ table: TableView }>(`${this.apiBaseUrl}/${tableId}/bots`, { botName }, { headers: this.authHeaders() })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public removeBot(tableId: string, seatIndex: number): Observable<{ table: TableView }> {
    return this.httpClient
      .delete<{ table: TableView }>(`${this.apiBaseUrl}/${tableId}/bots/${seatIndex}`, {
        headers: this.authHeaders(),
      })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public kickPlayer(tableId: string, userId: string): Observable<{ table: TableView }> {
    return this.httpClient
      .post<{ table: TableView }>(`${this.apiBaseUrl}/${tableId}/kick`, { userId }, { headers: this.authHeaders() })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public startGame(tableId: string): Observable<{ table: TableView }> {
    return this.httpClient
      .post<{ table: TableView }>(`${this.apiBaseUrl}/${tableId}/start`, {}, { headers: this.authHeaders() })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public proposeRematch(tableId: string): Observable<{ table: TableView }> {
    return this.httpClient
      .post<{ table: TableView }>(`${this.apiBaseUrl}/${tableId}/rematch/propose`, {}, { headers: this.authHeaders() })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public acceptRematch(tableId: string): Observable<{ table: TableView }> {
    return this.httpClient
      .post<{ table: TableView }>(`${this.apiBaseUrl}/${tableId}/rematch/accept`, {}, { headers: this.authHeaders() })
      .pipe(tap(() => this.tableSubject.next()));
  }

  public deleteTable(tableId: string): Observable<void> {
    return this.httpClient
      .delete<void>(`${this.apiBaseUrl}/${tableId}`, { headers: this.authHeaders() })
      .pipe(tap(() => this.tableSubject.next()));
  }

  private authHeaders(): HttpHeaders {
    const token: string | null = this.authService.accessToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
    });
  }
}
