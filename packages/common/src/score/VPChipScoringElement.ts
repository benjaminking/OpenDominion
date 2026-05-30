import { ScoringElement } from './ScoringElement';
import { ScoringElementType } from './ScoringElementType';

export interface VPChipScoringElement extends ScoringElement {
  type: ScoringElementType.VP_CHIP;
}
