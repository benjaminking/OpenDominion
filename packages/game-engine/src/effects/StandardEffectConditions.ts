import { InstructionExecutor } from '../players/InstructionExecutor';
import { TurnPhase } from '../turns/TurnPhase';
import { EffectCondition } from './EffectCondition';

const isNotCleanup = new EffectCondition(
  (ie: InstructionExecutor) => ie.getSharedGameState().getTurnPhase() !== TurnPhase.CLEANUP,
);

export { isNotCleanup };
