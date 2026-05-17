import { CardMetadata, CardType, Cost } from '../card';
import { PileCategory } from './PileCategory.js';

export interface PileMetadata {
  name: string;
  size: number;
  cost: Cost;
  topCard: CardMetadata | undefined;
  types: CardType[];
  categories: PileCategory[];
}
