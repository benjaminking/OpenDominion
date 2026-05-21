import { describe, expect, it } from 'vitest';

import {
  BoldSegmentMatcher,
  CardSegmentMatcher,
  CoinSegmentMatcher,
  HorizontalLineMatcher,
  ParagraphBreakMatcher,
  VPSegmentMatcher,
} from '../src/app/message/SegmentMatcher';
import { MessageSegmentType } from '../src/app/message/MessageSegment';

describe('Segment matchers', () => {
  it('finds all matching substrings with their source indexes', () => {
    expect(new CoinSegmentMatcher().findMatchingSegments('Gain $2 and $11')).toEqual([
      { type: MessageSegmentType.COIN, startIndex: 5, endIndex: 7 },
      { type: MessageSegmentType.COIN, startIndex: 12, endIndex: 15 },
    ]);
    expect(new CardSegmentMatcher().findMatchingSegments('Trash %c then %c')).toEqual([
      { type: MessageSegmentType.CARD, startIndex: 6, endIndex: 8 },
      { type: MessageSegmentType.CARD, startIndex: 14, endIndex: 16 },
    ]);
    expect(new VPSegmentMatcher().findMatchingSegments('Worth 3VP now')).toEqual([
      { type: MessageSegmentType.VP, startIndex: 6, endIndex: 9 },
    ]);
  });

  it('matches formatting markers for bold bonuses, paragraph breaks, and horizontal lines', () => {
    expect(new BoldSegmentMatcher().findMatchingSegments('Get +2 Actions and +$3')).toEqual([
      { type: MessageSegmentType.BOLD, startIndex: 4, endIndex: 14 },
      { type: MessageSegmentType.BOLD, startIndex: 19, endIndex: 20 },
    ]);
    expect(new ParagraphBreakMatcher().findMatchingSegments('One\n\nTwo')).toEqual([
      { type: MessageSegmentType.PARAGRAPH_BREAK, startIndex: 3, endIndex: 5 },
    ]);
    expect(new HorizontalLineMatcher().findMatchingSegments('Top\n-\nBottom')).toEqual([
      { type: MessageSegmentType.HORIZONTAL_LINE, startIndex: 3, endIndex: 6 },
    ]);
  });
});
