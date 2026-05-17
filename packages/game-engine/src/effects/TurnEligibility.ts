import { Turn } from '../turns/Turn';

export interface TurnEligibility {
  matches(turn: Turn): boolean;
}
