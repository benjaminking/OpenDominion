import { CardMetadata } from '../card';

export interface MessageCards {
  knownCards: CardMetadata[];
  numUnknownCards: number;
}
