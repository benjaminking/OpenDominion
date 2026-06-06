import { SharedGameState } from '../game-state/SharedGameState';
import { Turn } from '../turns/Turn';
import { TurnEligibility } from './TurnEligibility';

export class ThisTurnEligibility implements TurnEligibility {
  private activePlayerName = '';
  private currentTurnNumber = 0;

  constructor(gameState: SharedGameState) {
    this.activePlayerName = gameState.getCurrentPlayer().getName();
    this.currentTurnNumber = gameState.getCurrentPlayer().getStatistics().getUnofficialTurnNumber();
  }

  public matches(turn: Turn): boolean {
    return turn.getOwner().getName() === this.activePlayerName && turn.getUnofficialNumber() === this.currentTurnNumber;
  }
}

export class NextTurnEligibility implements TurnEligibility {
  private activePlayerName = '';
  private currentTurnNumber = 0;

  constructor(gameState: SharedGameState) {
    this.activePlayerName = gameState.getCurrentPlayer().getName();
    this.currentTurnNumber = gameState.getCurrentPlayer().getStatistics().getUnofficialTurnNumber();
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
