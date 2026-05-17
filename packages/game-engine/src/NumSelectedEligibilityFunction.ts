import { CardCollection } from './card/CardCollection';

export class NumSelectedEligibilityFunction {
  protected internalFunction: (size: number) => boolean;

  public constructor(internalFunction: (size: number) => boolean) {
    this.internalFunction = internalFunction;
  }

  public matches(cards: CardCollection): boolean {
    return this.internalFunction(cards.size());
  }

  isAllowed(size: number): boolean {
    return this.internalFunction(size);
  }

  public toAllowedNumbers(): number[] {
    const allowedNumbers: number[] = [];
    for (let k = 0; k < 20; ++k) {
      if (this.internalFunction(k)) {
        allowedNumbers.push(k);
      }
    }
    return allowedNumbers;
  }
}
