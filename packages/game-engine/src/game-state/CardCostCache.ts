import { Cost } from '../card/Cost';

export class CardCostCache {
  private mostRecentCostsByName = new Map<string, Cost>();
  private hasAnyCostChanged = false;

  public startNewCostCheck(): void {
    this.hasAnyCostChanged = false;
  }

  public updateCostForCardName(cardName: string, newCost: Cost): void {
    const mostRecentCost = this.mostRecentCostsByName.get(cardName);
    if (!mostRecentCost?.isEqualTo(newCost)) {
      this.mostRecentCostsByName.set(cardName, newCost);
      this.hasAnyCostChanged = true;
    }
  }

  public haveCostsChanged(): boolean {
    return this.hasAnyCostChanged;
  }
}
