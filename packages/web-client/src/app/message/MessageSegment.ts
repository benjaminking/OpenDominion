import { CardMetadata } from '@dominion/common';

export enum MessageSegmentType {
  ORDINARY,
  CARD,
  COIN,
  VP,
  POTION,
  DEBT,
  BOLD,
  HORIZONTAL_LINE,
  LINE_BREAK,
  PARAGRAPH_BREAK,
}

export interface MessageSegment {
  id: number;
  text: string;
  card?: CardMetadata;
  type: MessageSegmentType;
}

export interface IncompleteMessageSegment {
  text: string;
  card?: CardMetadata;
  type: MessageSegmentType;
}
