import { CardLocation } from '@dominion/common';

import { TimeStamp } from '../game-state/TimeStamp';

export class MovementLog {
  private readonly lastMovementAwayByArea = new Map<CardLocation, TimeStamp>();

  public recordMovement(oldLocation: CardLocation, _newLocation: CardLocation, timeStamp: TimeStamp) {
    this.lastMovementAwayByArea.set(oldLocation, timeStamp);
  }

  public hasCardMovedAwayFromAreaSince(area: CardLocation, timeStamp: TimeStamp): boolean {
    const lastMovementAway = this.lastMovementAwayByArea.get(area);
    if (!lastMovementAway) {
      return false;
    }
    return lastMovementAway.isAfter(timeStamp);
  }
}
