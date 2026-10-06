import { CardInfo, CardType } from '@dominion/common';

const DEFAULT_PILE_SIZE = 10;
const TWO_PLAYER_VICTORY_SIZE = 8;
const THREE_PLUS_PLAYER_VICTORY_SIZE = 12;

const nonStandardPileSizes = new Map<string, number>();
nonStandardPileSizes.set('Copper', 56);
nonStandardPileSizes.set('Gold', 30);
nonStandardPileSizes.set('Platinum', 12);
nonStandardPileSizes.set('Port', 12);
nonStandardPileSizes.set('Potion', 16);
nonStandardPileSizes.set('Rats', 20);
nonStandardPileSizes.set('Rewards', 12);
nonStandardPileSizes.set('Silver', 40);
nonStandardPileSizes.set('Spoils', 15);

const formulaicPileSizeNames = new Set<string>();
formulaicPileSizeNames.add('Curse');
formulaicPileSizeNames.add('Ruins');

export class PileSizeLogic {
  public constructor(private readonly numPlayers: number) {}

  public getPileSize(card: CardInfo): number {
    if (formulaicPileSizeNames.has(card.name)) {
      return this.calculateFormulaicPileSize(card.name);
    }
    if (card.types.includes(CardType.VICTORY)) {
      return this.getVictoryPileSize();
    }
    if (nonStandardPileSizes.has(card.name)) {
      return nonStandardPileSizes.get(card.name)!;
    }
    return DEFAULT_PILE_SIZE;
  }

  public getVictoryPileSize(): number {
    if (this.numPlayers === 2) {
      return TWO_PLAYER_VICTORY_SIZE;
    }
    return THREE_PLUS_PLAYER_VICTORY_SIZE;
  }

  private calculateFormulaicPileSize(cardName: string): number {
    if (cardName === 'Curse' || cardName === 'Ruins') {
      return 10 * (this.numPlayers - 1);
    }
    return DEFAULT_PILE_SIZE;
  }
}
