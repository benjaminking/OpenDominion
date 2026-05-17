/**
 * Example WebSocket client to connect to the game server
 * This is a simple client that demonstrates how to connect to the WebSocket server
 *
 * Usage in browser:
 * ```javascript
 * const client = new GameServerClient('ws://localhost:3000');
 * client.send({ action: 'joinGame', playerId: 'player1' });
 * ```
 */

export class GameServerClient {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private readonly handlers: Map<string, (data: unknown) => void> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = (): void => {
          console.log('Connected to server');
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent): void => {
          try {
            const data = JSON.parse(event.data as string);
            console.log('Received from server:', data);

            // Call registered handlers
            this.handlers.forEach((handler) => {
              handler(data);
            });
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error: Event): void => {
          console.error('WebSocket error:', error);
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = (): void => {
          console.log('Disconnected from server');
        };
      } catch (error: unknown) {
        reject(error instanceof Error ? error : new Error('Unknown error during connection'));
      }
    });
  }

  send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  on(messageType: string, handler: (data: unknown) => void): void {
    this.handlers.set(messageType, handler);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}
