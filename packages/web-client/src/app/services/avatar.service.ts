import { Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { AvatarData } from './table-api.service';

function resolveApiBaseUrl(path: string): string {
  const origin: string = location.port === '4200' ? 'http://localhost:3000' : location.origin;
  return new URL(path, origin).toString();
}

export interface UserProfile {
  id: string;
  username: string;
  online: boolean;
  avatar?: AvatarData;
}

@Injectable({ providedIn: 'root' })
export class AvatarService {
  private readonly apiBaseUrl = resolveApiBaseUrl('/api/users');
  private readonly cache = new Map<string, WritableSignal<AvatarData | null>>();

  public constructor(
    private readonly httpClient: HttpClient,
    private readonly authService: AuthService,
  ) {}

  /** Returns a signal for a user's avatar, triggering a fetch the first time. */
  public avatarFor(userId: string): Signal<AvatarData | null> {
    if (!this.cache.has(userId)) {
      const sig = signal<AvatarData | null>(null);
      this.cache.set(userId, sig);
      this.httpClient
        .get<{ user: UserProfile }>(`${this.apiBaseUrl}/${userId}`, { headers: this.authHeaders() })
        .subscribe({
          next: ({ user }) => sig.set(user.avatar ?? null),
          error: () => {},
        });
    }
    return this.cache.get(userId)!;
  }

  /** Pre-populate the cache from already-known avatar data (e.g. user list). */
  public preload(userId: string, avatar: AvatarData | null | undefined): void {
    if (this.cache.has(userId)) {
      this.cache.get(userId)!.set(avatar ?? null);
    } else {
      this.cache.set(userId, signal(avatar ?? null));
    }
  }

  /** Update cache after a successful avatar save. */
  public setAvatar(userId: string, avatar: AvatarData | null): void {
    if (this.cache.has(userId)) {
      this.cache.get(userId)!.set(avatar);
    } else {
      this.cache.set(userId, signal(avatar));
    }
  }

  public getUserProfile(userId: string): Observable<{ user: UserProfile }> {
    return this.httpClient.get<{ user: UserProfile }>(`${this.apiBaseUrl}/${userId}`, {
      headers: this.authHeaders(),
    });
  }

  public updateAvatar(avatarData: AvatarData): Observable<{ avatar: AvatarData }> {
    return this.httpClient.put<{ avatar: AvatarData }>(`${this.apiBaseUrl}/me/avatar`, avatarData, {
      headers: this.authHeaders(),
    });
  }

  public changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean }> {
    return this.httpClient.put<{ success: boolean }>(
      `${this.apiBaseUrl}/me/password`,
      { currentPassword, newPassword },
      { headers: this.authHeaders() },
    );
  }

  private authHeaders(): HttpHeaders {
    const token = this.authService.accessToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
