import { CardLocation } from '@dominion/common';

import { Card } from '../card/Card';
import { TimeStamp } from './TimeStamp';

export class LocationExpectation {
  public constructor(
    private readonly expectedLocation: CardLocation,
    private readonly timeStamp: TimeStamp,
  ) {}

  public isMet(card: Card): boolean {
    return (
      card.getLocation() === this.expectedLocation &&
      !card.hasMovedFromLocationSince(this.expectedLocation, this.timeStamp)
    );
  }
}

export class NoLocationExpectation extends LocationExpectation {
  public constructor() {
    super(CardLocation.PILE, new TimeStamp(0));
  }

  public override isMet(_card: Card): boolean {
    return true;
  }
}
