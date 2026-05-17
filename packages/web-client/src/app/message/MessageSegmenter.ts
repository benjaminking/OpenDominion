import { MessageCards } from '@dominion/common';
import { IncompleteMessageSegment, MessageSegment, MessageSegmentType } from './MessageSegment';
import {
  BoldSegmentMatcher,
  CardSegmentMatcher,
  CoinSegmentMatcher,
  HorizontalLineMatcher,
  LineBreakMatcher,
  ParagraphBreakMatcher,
  SegmentMatch,
  SegmentMatcher,
  VPSegmentMatcher,
} from './SegmentMatcher';
import {
  BoldSegmentCreator,
  CardSegmentCreator,
  CoinSegmentCreator,
  HorizontalLineSegmentCreator,
  LineBreakSegmentCreator,
  ParagraphBreakSegmentCreator,
  SegmentCreator,
  VPSegmentCreator,
} from './SegmentCreator';

export class MessageSegmenter {
  private segmentMatchers: SegmentMatcher[] = [
    new CardSegmentMatcher(),
    new CoinSegmentMatcher(),
    new VPSegmentMatcher(),
    new BoldSegmentMatcher(),
    new HorizontalLineMatcher(),
    new ParagraphBreakMatcher(),
    new LineBreakMatcher(),
  ];
  private segmentCreators: Map<MessageSegmentType, SegmentCreator> = new Map();

  constructor(
    private readonly message: string,
    cardsToSubstitute: MessageCards[],
  ) {
    this.segmentCreators.set(MessageSegmentType.CARD, new CardSegmentCreator(cardsToSubstitute));
    this.segmentCreators.set(MessageSegmentType.COIN, new CoinSegmentCreator());
    this.segmentCreators.set(MessageSegmentType.VP, new VPSegmentCreator());
    this.segmentCreators.set(MessageSegmentType.BOLD, new BoldSegmentCreator());
    this.segmentCreators.set(MessageSegmentType.HORIZONTAL_LINE, new HorizontalLineSegmentCreator());
    this.segmentCreators.set(MessageSegmentType.LINE_BREAK, new LineBreakSegmentCreator());
    this.segmentCreators.set(MessageSegmentType.PARAGRAPH_BREAK, new ParagraphBreakSegmentCreator());
  }

  public segmentMessage(): MessageSegment[] {
    let allMessageSegments: IncompleteMessageSegment[] = [];

    const allSegmentMatches: SegmentMatch[] = this.collectAllSegmentMatches();
    let processedIndex = 0;
    for (const segmentMatch of allSegmentMatches) {
      if (segmentMatch.startIndex < processedIndex) {
        continue;
      }

      if (segmentMatch.startIndex > processedIndex) {
        allMessageSegments.push(this.createInterveningSegment(processedIndex, segmentMatch.startIndex));
      }
      allMessageSegments = [...allMessageSegments, ...this.createTargetSegments(segmentMatch)];
      processedIndex = segmentMatch.endIndex;
    }
    if (processedIndex < this.message.length) {
      allMessageSegments.push(this.createFinalSegment(processedIndex));
    }

    return allMessageSegments.map((segment: IncompleteMessageSegment, index: number) => {
      return { id: index, text: segment.text, card: segment.card, type: segment.type } as MessageSegment;
    });
  }

  private collectAllSegmentMatches(): SegmentMatch[] {
    let allSegmentMatches: SegmentMatch[] = [];
    for (const segmentMatcher of this.segmentMatchers) {
      allSegmentMatches = [...allSegmentMatches, ...segmentMatcher.findMatchingSegments(this.message)];
    }
    return allSegmentMatches.sort(
      (a: SegmentMatch, b: SegmentMatch) => a.startIndex - b.startIndex || b.endIndex - a.endIndex,
    );
  }

  private createInterveningSegment(startIndex: number, endIndex: number): IncompleteMessageSegment {
    return {
      text: this.message.substring(startIndex, endIndex),
      type: MessageSegmentType.ORDINARY,
    };
  }

  private createTargetSegments(segmentMatch: SegmentMatch): IncompleteMessageSegment[] {
    return this.segmentCreators.get(segmentMatch.type).createSegments(this.message, segmentMatch);
  }

  private createFinalSegment(startIndex: number): IncompleteMessageSegment {
    return {
      text: this.message.substring(startIndex),
      type: MessageSegmentType.ORDINARY,
    };
  }
}
