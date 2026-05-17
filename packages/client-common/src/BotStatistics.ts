import { CardCount } from '@dominion/common';

export class BotStatistics {
  private deckCounts: Map<string, number> = new Map<string, number>();
  private pileCounts: Map<string, number> = new Map<string, number>();

  constructor(
    private _numCoinsInDeck: number,
    private _deckCardCounts: CardCount[],
    private _pileCardCounts: CardCount[],
  ) {}

  updateCoinsInDeck(numCoins: number): void {
    this._numCoinsInDeck = numCoins;
  }

  updateDeckCounts(cardCountsObj: CardCount[]): void {
    this._deckCardCounts = cardCountsObj;
    this.deckCounts = new Map<string, number>();
    for (const cardCount of this._deckCardCounts) {
      this.deckCounts.set(cardCount.name, cardCount.count);
    }
  }

  updatePileSize(pileName: string, cardCount: number): void {
    this.pileCounts.set(pileName, cardCount);
  }

  public getCoinsInDeck(): number {
    return this._numCoinsInDeck;
  }

  public getCountInDeck(cardName: string): number {
    if (this.deckCounts.has(cardName)) {
      return this.deckCounts.get(cardName)!;
    }
    return 0;
  }

  public getCountInPile(cardName: string): number {
    if (this.pileCounts.has(cardName)) {
      return this.pileCounts.get(cardName)!;
    }
    return 0;
  }
}
