import { TurnPhase } from '../turns/TurnPhase';

export interface TurnPhaseEligibility {
  matches(turnPhase: TurnPhase): boolean;
}
