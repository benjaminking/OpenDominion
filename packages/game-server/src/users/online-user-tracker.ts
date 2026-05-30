interface PresenceState {
  username: string;
  lastSeenAt: number;
  socketCount: number;
}

export class OnlineUserTracker {
  private readonly presenceByUserId: Map<string, PresenceState> = new Map<string, PresenceState>();

  public markSeen(userId: string, username: string): void {
    const now: number = Date.now();
    const existing = this.presenceByUserId.get(userId);

    if (!existing) {
      this.presenceByUserId.set(userId, {
        username,
        lastSeenAt: now,
        socketCount: 0,
      });
      return;
    }

    existing.username = username;
    existing.lastSeenAt = now;
  }

  public registerSocket(userId: string, username: string): void {
    this.markSeen(userId, username);
    const existing = this.presenceByUserId.get(userId);
    if (!existing) {
      return;
    }

    existing.socketCount += 1;
  }

  public unregisterSocket(userId: string): void {
    const existing = this.presenceByUserId.get(userId);
    if (!existing) {
      return;
    }

    existing.socketCount = Math.max(existing.socketCount - 1, 0);
    existing.lastSeenAt = Date.now();
  }

  public isOnline(userId: string): boolean {
    const existing = this.presenceByUserId.get(userId);
    if (!existing) {
      return false;
    }

    if (existing.socketCount > 0) {
      return true;
    }

    const PRESENCE_WINDOW_MS: number = 120000;
    return Date.now() - existing.lastSeenAt <= PRESENCE_WINDOW_MS;
  }
}
