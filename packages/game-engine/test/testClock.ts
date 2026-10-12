import { Clock } from '../src/game-state/Clock';
import { TimeStamp } from '../src/game-state/TimeStamp';

// One clock for every test double, so times read through different doubles (e.g. a card's and an instruction
// executor's) can be compared, as they can in a game. Time only moves forward, so sharing it is harmless.
const sharedTestClock = new Clock();

// The clock methods of SharedGameState, for test doubles of it. Cards read the time whenever they move.
export const createTestClock = (): { advanceTime: () => void; getCurrentTimeStamp: () => TimeStamp } => ({
  advanceTime: () => {
    sharedTestClock.advanceTime();
  },
  getCurrentTimeStamp: () => sharedTestClock.createTimeStamp(),
});
