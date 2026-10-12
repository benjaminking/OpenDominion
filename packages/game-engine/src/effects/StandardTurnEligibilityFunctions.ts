import { SharedGameState } from '../game-state/SharedGameState';
import { Player } from '../players/Player';
import { Turn } from '../turns/Turn';
import { TurnEligibility } from './TurnEligibility';

export class ThisTurnEligibility implements TurnEligibility {
  private activePlayerName = '';
  private currentTurnNumber = 0;

  constructor(gameState: SharedGameState) {
    this.activePlayerName = gameState.getCurrentPlayer().getName();
    this.currentTurnNumber = gameState.getCurrentPlayer().getTurnTracker().getCurrentTurn().getUnofficialNumber();
  }

  public matches(turn: Turn): boolean {
    return turn.getOwner().getName() === this.activePlayerName && turn.getUnofficialNumber() === this.currentTurnNumber;
  }
}

// The next turn of the given player (by default the current player), even if it isn't their turn now,
// e.g. a Pirate played during another player's turn
export class NextTurnEligibility implements TurnEligibility {
  private activePlayerName = '';
  private currentTurnNumber = 0;

  constructor(gameState: SharedGameState, player: Player = gameState.getCurrentPlayer()) {
    this.activePlayerName = player.getName();
    this.currentTurnNumber = player.getTurnTracker().getCurrentTurn().getUnofficialNumber();
  }

  public matches(turn: Turn): boolean {
    return (
      turn.getOwner().getName() === this.activePlayerName && turn.getUnofficialNumber() === this.currentTurnNumber + 1
    );
  }
}

export class AnyTurnEligibility implements TurnEligibility {
  public matches(): boolean {
    return true;
  }
}
