export class CardNameWithCount {
  constructor(
    private readonly name: string,
    private readonly count: number,
  ) {}

  public asCardNameArray(): string[] {
    const arr: string[] = [];
    for (let k = 0; k < this.count; ++k) {
      arr.push(this.name);
    }
    return arr;
  }
}

export interface CardNameAndIdConfiguration {
  name: string;
  id: string;
}

export class StartingDeckConfiguration {
  private cardNames: string[] = [];

  constructor(cardNamesWithCounts: CardNameWithCount[]) {
    for (const cardNameWithCount of cardNamesWithCounts) {
      for (const cardName of cardNameWithCount.asCardNameArray()) {
        this.cardNames.push(cardName);
      }
    }
  }

  public getCardNamesAndIds(idDescriptor: string): CardNameAndIdConfiguration[] {
    const namesAndIds: CardNameAndIdConfiguration[] = [];
    const cardNameCounts: Map<string, number> = new Map<string, number>();
    for (const cardName of this.cardNames) {
      if (!cardNameCounts.has(cardName)) {
        cardNameCounts.set(cardName, 0);
      }
      namesAndIds.push({
        name: cardName,
        id: cardName + '_' + idDescriptor + '_' + cardNameCounts.get(cardName)!.toFixed(),
      });
      cardNameCounts.set(cardName, cardNameCounts.get(cardName)! + 1);
    }
    return namesAndIds;
  }
}
