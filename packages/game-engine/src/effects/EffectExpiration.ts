import { Player } from '../players/Player';
import { Turn } from '../turns/Turn';

export abstract class EffectExpiration {
  public abstract hasExpired(): boolean;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public registerUse(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public registerStartOfPlayersTurn(_player: Player, _currentTurn: Turn): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public registerEndOfPlayersTurn(_player: Player, _currentTurn: Turn): void {}
}
