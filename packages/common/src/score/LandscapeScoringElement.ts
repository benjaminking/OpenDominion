import { ScoringElement } from './ScoringElement';
import { ScoringElementType } from './ScoringElementType';

export interface LandscapeScoringElement extends ScoringElement {
  type: ScoringElementType.LANDSCAPE;
  landscapeName: string;
}
