import { CardMetadata } from '../card';

export interface LogMessage {
  orderIndex: number;
  playerName: string;
  text: string;
  knownCards: CardMetadata[];
  numUnknownCards: number;
  type: LogMessageType;
}

export enum LogMessageType {
  TURN_START = 'TURN_START',
  NORMAL = 'NORMAL',
}
