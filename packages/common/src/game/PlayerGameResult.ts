import { ScoreReport } from '../score';
import { GameOutcome } from './GameOutcome';

export interface PlayerGameResult {
  playerName: string;
  scoreReport: ScoreReport;
  outcome: GameOutcome;
  turns: number;
}
