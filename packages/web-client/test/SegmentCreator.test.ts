import { CardLocation, CardType, type CardMetadata, type MessageCards } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import {
  CardSegmentCreator,
  CoinSegmentCreator,
  HorizontalLineSegmentCreator,
  ParagraphBreakSegmentCreator,
  VPSegmentCreator,
} from '../src/app/message/SegmentCreator';
import { MessageSegmentType } from '../src/app/message/MessageSegment';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    displayName: name,
    id,
    location: CardLocation.HAND,
    types: [CardType.ACTION],
    cost: { coins: 3 },
  };
}

function createMessageCards(knownCards: CardMetadata[], numUnknownCards = 0): MessageCards {
  return { knownCards, numUnknownCards };
}

describe('Segment creators', () => {
  it('extracts numeric values from coin and VP segments', () => {
    const coinCreator = new CoinSegmentCreator();
    const vpCreator = new VPSegmentCreator();

    expect(
      coinCreator.createSegments('Gain $12', { startIndex: 5, endIndex: 8, type: MessageSegmentType.COIN }),
    ).toEqual([{ text: '12', type: MessageSegmentType.COIN }]);
    expect(vpCreator.createSegments('Worth 7VP', { startIndex: 6, endIndex: 9, type: MessageSegmentType.VP })).toEqual([
      { text: '7', type: MessageSegmentType.VP },
    ]);
  });

  it('returns an ordinary no-cards segment when no cards are known or unknown', () => {
    const creator = new CardSegmentCreator([createMessageCards([])]);

    expect(creator.createSegments('%c', { startIndex: 0, endIndex: 2, type: MessageSegmentType.CARD })).toEqual([
      { text: 'no cards', type: MessageSegmentType.ORDINARY },
    ]);
  });

  it('formats known cards with articles, pluralization, and unknown-card counts', () => {
    const estate = createCard('Estate', 'estate-1');
    const witchA = createCard('Witch', 'witch-1');
    const witchB = createCard('Witch', 'witch-2');
    const creator = new CardSegmentCreator([createMessageCards([estate, witchA, witchB], 2)]);

    expect(creator.createSegments('%c', { startIndex: 0, endIndex: 2, type: MessageSegmentType.CARD })).toEqual([
      { text: 'an ', type: MessageSegmentType.ORDINARY },
      { text: 'Estate', card: estate, type: MessageSegmentType.CARD },
      { text: ', ', type: MessageSegmentType.ORDINARY },
      { text: '2 ', type: MessageSegmentType.ORDINARY },
      { text: 'Witches', card: witchA, type: MessageSegmentType.CARD },
      { text: ', and ', type: MessageSegmentType.ORDINARY },
      { text: '2 cards', type: MessageSegmentType.ORDINARY },
    ]);
  });

  it('creates empty structural segments for horizontal and paragraph breaks', () => {
    const horizontalLineCreator = new HorizontalLineSegmentCreator();
    const paragraphBreakCreator = new ParagraphBreakSegmentCreator();

    expect(
      horizontalLineCreator.createSegments('', {
        startIndex: 0,
        endIndex: 3,
        type: MessageSegmentType.HORIZONTAL_LINE,
      }),
    ).toEqual([{ text: '', type: MessageSegmentType.HORIZONTAL_LINE }]);
    expect(
      paragraphBreakCreator.createSegments('', {
        startIndex: 0,
        endIndex: 2,
        type: MessageSegmentType.PARAGRAPH_BREAK,
      }),
    ).toEqual([{ text: '', type: MessageSegmentType.PARAGRAPH_BREAK }]);
  });
});
