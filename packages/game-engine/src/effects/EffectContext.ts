import { CardLocation } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { LocationExpectation, NoLocationExpectation } from '../game-state/LocationExpectation';

export class EffectContext {
  constructor(
    private readonly targetCards: CardCollection | undefined,
    private readonly gainLocation: CardLocation | undefined,
    private readonly locationExpectation: LocationExpectation = new NoLocationExpectation(),
  ) {}

  public getTargetCard(): Card | undefined {
    return this.targetCards?.getArbitraryCard();
  }

  public getTargetCards(): CardCollection | undefined {
    return this.targetCards;
  }

  public getGainLocation(): CardLocation | undefined {
    return this.gainLocation;
  }

  public getLocationExpectation(): LocationExpectation | undefined {
    return this.locationExpectation;
  }
}

export class EffectContextBuilder {
  private targetCards: CardCollection | undefined;
  private gainLocation: CardLocation | undefined;
  private locationExpectation: LocationExpectation = new NoLocationExpectation();

  public withTargetCard(targetCard: Card): this {
    this.targetCards = CardCollection.fromCards([targetCard]);
    return this;
  }

  public withTargetCards(targetCards: CardCollection): this {
    this.targetCards = targetCards;
    return this;
  }

  public withGainLocation(gainLocation: CardLocation): this {
    this.gainLocation = gainLocation;
    return this;
  }

  public withLocationExpectation(locationExpectation: LocationExpectation): this {
    this.locationExpectation = locationExpectation;
    return this;
  }

  public build(): EffectContext {
    return new EffectContext(this.targetCards, this.gainLocation, this.locationExpectation);
  }
}
