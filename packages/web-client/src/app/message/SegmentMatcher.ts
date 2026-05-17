import { MessageSegmentType } from './MessageSegment';

export interface SegmentMatch {
  type: MessageSegmentType;
  startIndex: number;
  endIndex: number;
}

export class SegmentMatcher {
  constructor(
    private readonly regexPattern: RegExp,
    private readonly segmentType: MessageSegmentType,
  ) {}

  findMatchingSegments(message: string): SegmentMatch[] {
    const matches: SegmentMatch[] = [];
    for (const match of message.matchAll(this.regexPattern)) {
      matches.push({
        type: this.segmentType,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
    return matches;
  }
}

export class CoinSegmentMatcher extends SegmentMatcher {
  constructor() {
    super(/\$\d+/g, MessageSegmentType.COIN);
  }
}

export class VPSegmentMatcher extends SegmentMatcher {
  constructor() {
    super(/\d+VP/g, MessageSegmentType.VP);
  }
}

export class CardSegmentMatcher extends SegmentMatcher {
  constructor() {
    super(/%c/g, MessageSegmentType.CARD);
  }
}

export class BoldSegmentMatcher extends SegmentMatcher {
  constructor() {
    super(/(?:\+\d+ (Cards?|Actions?|Buys?|Coffers?|Villagers?)|\+(?=\$\d+))/g, MessageSegmentType.BOLD);
  }
}

export class HorizontalLineMatcher extends SegmentMatcher {
  constructor() {
    super(/\n\-\n/g, MessageSegmentType.HORIZONTAL_LINE);
  }
}

export class LineBreakMatcher extends SegmentMatcher {
  constructor() {
    super(/\n/g, MessageSegmentType.LINE_BREAK);
  }
}

export class ParagraphBreakMatcher extends SegmentMatcher {
  constructor() {
    super(/\n\n/g, MessageSegmentType.PARAGRAPH_BREAK);
  }
}
