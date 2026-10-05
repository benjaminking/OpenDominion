import { CardType } from './CardType';
import { Expansion } from './Expansion';

export interface RandomizerRequirements {
  requiredExpansions?: Expansion[];
  requiredCoinCosts?: number[];
  requiredTypes?: CardType[];
}
