import { CardInfo, CardType } from '@dominion/common';

const DEFAULT_PILE_SIZE = 10;
const TWO_PLAYER_VICTORY_SIZE = 8;
const THREE_PLUS_PLAYER_VICTORY_SIZE = 12;
const TOTAL_NUM_COPPERS = 60;
const NUM_STARTING_COPPERS = 7;
const ALLIES_SPLIT_PILE_SIZE = 16;

const nonStandardPileSizes = new Map<string, number>();
nonStandardPileSizes.set('Augurs', ALLIES_SPLIT_PILE_SIZE);
nonStandardPileSizes.set('Clashes', ALLIES_SPLIT_PILE_SIZE);
nonStandardPileSizes.set('Forts', ALLIES_SPLIT_PILE_SIZE);
nonStandardPileSizes.set('Gold', 30);
nonStandardPileSizes.set('Odysseys', ALLIES_SPLIT_PILE_SIZE);
nonStandardPileSizes.set('Platinum', 12);
nonStandardPileSizes.set('Port', 12);
nonStandardPileSizes.set('Potion', 16);
nonStandardPileSizes.set('Rats', 20);
nonStandardPileSizes.set('Rewards', 12);
nonStandardPileSizes.set('Silver', 40);
nonStandardPileSizes.set('Spoils', 15);
nonStandardPileSizes.set('Townsfolk', ALLIES_SPLIT_PILE_SIZE);
nonStandardPileSizes.set('Wizards', ALLIES_SPLIT_PILE_SIZE);

const formulaicPileSizeNames = new Set<string>();
formulaicPileSizeNames.add('Copper');
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
    if (cardName === 'Copper') {
      return TOTAL_NUM_COPPERS - NUM_STARTING_COPPERS * this.numPlayers;
    }
    if (cardName === 'Curse' || cardName === 'Ruins') {
      return 10 * (this.numPlayers - 1);
    }
    return DEFAULT_PILE_SIZE;
  }
}
