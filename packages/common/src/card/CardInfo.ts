import { CardCategory } from './CardCategory';
import { CardType } from './CardType';
import { Cost } from './Cost';
import { Expansion } from './Expansion';
import { Mechanic } from './Mechanic';
import { Production } from './Production';

export interface CardInfo {
  category: CardCategory;
  name: string;
  text: string;
  font_size: string;
  cost: Cost;
  costDisplayOverride?: string;
  production?: Production;
  types: CardType[];
  expansion: Expansion;
  is_kingdom?: boolean;
  mechanics?: Mechanic[];
}
