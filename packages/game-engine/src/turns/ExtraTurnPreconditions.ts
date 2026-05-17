import { Player } from '../players/Player';
import { Turn } from './Turn';

abstract class ExtraTurnPrecondition {
  public abstract shouldExtraTurnHappen(extraTurnOwner: Player, previousTurns: Turn[]): boolean;
}

class NoThirdConsecutiveTurnPrecondition extends ExtraTurnPrecondition {
  public shouldExtraTurnHappen(extraTurnOwner: Player, previousTurns: Turn[]): boolean {
    if (
      previousTurns.length >= 2 &&
      previousTurns[previousTurns.length - 1].getOwner().getName() === extraTurnOwner.getName() &&
      previousTurns[previousTurns.length - 2].getOwner().getName() === extraTurnOwner.getName()
    ) {
      return false;
    }
    return true;
  }
}

export { ExtraTurnPrecondition, NoThirdConsecutiveTurnPrecondition };
