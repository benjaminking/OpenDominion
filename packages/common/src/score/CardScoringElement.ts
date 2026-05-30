import { ScoringElement } from './ScoringElement';
import { ScoringElementType } from './ScoringElementType';

export interface CardScoringElement extends ScoringElement {
  type: ScoringElementType.CARD;
  cardName: string;
  count: number;
}
