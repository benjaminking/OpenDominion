import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface AuthResponse {
  user: {
    id: string;
    username: string;
  };
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
}

interface StoredSession {
  userId: string;
  username: string;
  accessToken: string;
  refreshToken: string;
}

const SESSION_STORAGE_KEY = 'open-dominion-auth';

function resolveApiBaseUrl(path: string): string {
  const origin: string = location.port === '4200' ? 'http://localhost:3000' : location.origin;
  return new URL(path, origin).toString();
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBaseUrl = resolveApiBaseUrl('/api/auth');
  private readonly sessionSignal = signal<StoredSession | null>(this.readStoredSession());

  public constructor(private readonly httpClient: HttpClient) {}

  public sessionChanges(): Observable<StoredSession | null> {
    return toObservable(this.sessionSignal);
  }

  public session(): StoredSession | null {
    return this.sessionSignal();
  }

  public isAuthenticated(): boolean {
    return !!this.sessionSignal()?.accessToken;
  }

  public accessToken(): string | null {
    return this.sessionSignal()?.accessToken ?? null;
  }

  public login(username: string, password: string): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>(`${this.apiBaseUrl}/login`, { username, password }).pipe(
      tap((response: AuthResponse) => {
        this.persistSession(response);
      }),
    );
  }

  public signup(username: string, password: string): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>(`${this.apiBaseUrl}/signup`, { username, password }).pipe(
      tap((response: AuthResponse) => {
        this.persistSession(response);
      }),
    );
  }

  public refresh(): Observable<AuthResponse> {
    const refreshToken: string | undefined = this.sessionSignal()?.refreshToken;
    return this.httpClient.post<AuthResponse>(`${this.apiBaseUrl}/refresh`, { refreshToken }).pipe(
      tap((response: AuthResponse) => {
        this.persistSession(response);
      }),
    );
  }

  public logout(): Observable<void> {
    const refreshToken: string | undefined = this.sessionSignal()?.refreshToken;

    return this.httpClient.post<void>(`${this.apiBaseUrl}/logout`, { refreshToken }).pipe(
      tap(() => {
        this.clearSession();
      }),
    );
  }

  public clearSession(): void {
    this.sessionSignal.set(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  private persistSession(response: AuthResponse): void {
    const session: StoredSession = {
      userId: response.user.id,
      username: response.user.username,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };

    this.sessionSignal.set(session);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private readStoredSession(): StoredSession | null {
    const storedValue: string | null = localStorage.getItem(SESSION_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    try {
      const parsedValue: unknown = JSON.parse(storedValue);
      if (
        typeof parsedValue === 'object' &&
        parsedValue !== null &&
        typeof (parsedValue as StoredSession).userId === 'string' &&
        typeof (parsedValue as StoredSession).username === 'string' &&
        typeof (parsedValue as StoredSession).accessToken === 'string' &&
        typeof (parsedValue as StoredSession).refreshToken === 'string'
      ) {
        return parsedValue as StoredSession;
      }
    } catch (error: unknown) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    return null;
  }
}
