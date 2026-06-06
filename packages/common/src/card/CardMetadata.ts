import { CardLocation } from './CardLocation.js';
import { CardType } from './CardType.js';
import { Cost } from './Cost.js';

export interface CardMetadata {
  name: string;
  displayName: string;
  id: string;
  location: CardLocation;
  types: CardType[];
  cost: Cost;
}
