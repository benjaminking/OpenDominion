import { TurnPhase } from '../turns/TurnPhase';
import { TurnPhaseEligibility } from './TurnPhaseEligibility';

export class ActionPhaseEligibility implements TurnPhaseEligibility {
  public matches(turnPhase: TurnPhase): boolean {
    return turnPhase === TurnPhase.ACTION;
  }
}

export class BuyPhaseEligibility implements TurnPhaseEligibility {
  public matches(turnPhase: TurnPhase): boolean {
    return turnPhase === TurnPhase.BUY;
  }
}

export class CleanupPhaseEligibility implements TurnPhaseEligibility {
  public matches(turnPhase: TurnPhase): boolean {
    return turnPhase === TurnPhase.CLEANUP;
  }
}

export class AnyTurnPhaseEligibility implements TurnPhaseEligibility {
  public matches(): boolean {
    return true;
  }
}
