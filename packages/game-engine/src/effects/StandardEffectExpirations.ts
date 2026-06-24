import { Player } from '../players/Player';
import { Turn } from '../turns/Turn';
import { EffectExpiration } from './EffectExpiration';

class OneTimeEffectExpirtation extends EffectExpiration {
  private hasBeenUsed = false;

  public registerUse(): void {
    this.hasBeenUsed = true;
  }

  public hasExpired(): boolean {
    return this.hasBeenUsed;
  }
}

class OnceThisTurnEffectExpiration extends EffectExpiration {
  private hasBeenUsed = false;
  private hasTurnEnded = false;
  private currentTurn: Turn;

  public constructor(currentTurn: Turn) {
    super();
    this.currentTurn = currentTurn;
  }

  public registerEndOfPlayersTurn(player: Player, _turn: Turn): void {
    if (this.currentTurn.getOwner().getName() === player.getName()) {
      this.hasTurnEnded = true;
    }
  }

  public registerUse(): void {
    this.hasBeenUsed = true;
  }

  public hasExpired(): boolean {
    return this.hasBeenUsed || this.hasTurnEnded;
  }
}

class RestOfTurnEffectExpiration extends EffectExpiration {
  private hasTurnEnded = false;
  private currentTurn: Turn;

  public constructor(currentTurn: Turn) {
    super();
    this.currentTurn = currentTurn;
  }

  public registerEndOfPlayersTurn(player: Player, _turn: Turn): void {
    if (this.currentTurn.getOwner().getName() === player.getName()) {
      this.hasTurnEnded = true;
    }
  }

  public hasExpired(): boolean {
    return this.hasTurnEnded;
  }
}

class StartOfPlayersNextTurnEffectExpiration extends EffectExpiration {
  private hasNextTurnStarted = false;
  private targetPlayer: Player;
  private currentTurn: Turn;

  public constructor(player: Player, currentTurn: Turn) {
    super();
    this.targetPlayer = player;
    this.currentTurn = currentTurn;
  }

  public registerStartOfPlayersTurn(player: Player, turn: Turn): void {
    if (
      this.targetPlayer.getName() === player.getName() &&
      turn.getUnofficialNumber() > this.currentTurn.getUnofficialNumber()
    ) {
      this.hasNextTurnStarted = true;
    }
  }

  public hasExpired(): boolean {
    return this.hasNextTurnStarted;
  }
}

class EndOfPlayersNextTurnEffectExpiration extends EffectExpiration {
  private hasNextTurnEnded = false;
  private targetPlayer: Player;
  private currentTurn: Turn;

  public constructor(player: Player, currentTurn: Turn) {
    super();
    this.targetPlayer = player;
    this.currentTurn = currentTurn;
  }

  public registerEndOfPlayersTurn(player: Player, turn: Turn): void {
    if (
      this.targetPlayer.getName() === player.getName() &&
      turn.getUnofficialNumber() > this.currentTurn.getUnofficialNumber()
    ) {
      this.hasNextTurnEnded = true;
    }
  }

  public hasExpired(): boolean {
    return this.hasNextTurnEnded;
  }
}

class NoEffectExpiration extends EffectExpiration {
  public hasExpired(): boolean {
    return false;
  }
}

export {
  EndOfPlayersNextTurnEffectExpiration,
  NoEffectExpiration,
  OnceThisTurnEffectExpiration,
  OneTimeEffectExpirtation,
  RestOfTurnEffectExpiration,
  StartOfPlayersNextTurnEffectExpiration,
};
