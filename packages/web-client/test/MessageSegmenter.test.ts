import { CardLocation, CardType, type CardMetadata, type MessageCards } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { MessageSegmenter } from '../src/app/message/MessageSegmenter';
import { MessageSegmentType } from '../src/app/message/MessageSegment';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.HAND,
    types: [CardType.ACTION],
    cost: { coins: 3 },
  };
}

function createMessageCards(knownCards: CardMetadata[], numUnknownCards = 0): MessageCards {
  return { knownCards, numUnknownCards };
}

describe('MessageSegmenter', () => {
  it('segments ordinary text, bold text, coin values, cards, and paragraph breaks in order', () => {
    const silver = createCard('Silver', 'silver-1');
    const message = 'Gain +2 Actions and $3 from %c\n\nContinue';

    const segments = new MessageSegmenter(message, [createMessageCards([silver])]).segmentMessage();

    expect(segments).toEqual([
      { id: 0, text: 'Gain ', type: MessageSegmentType.ORDINARY, card: undefined },
      { id: 1, text: '+2 Actions', type: MessageSegmentType.BOLD, card: undefined },
      { id: 2, text: ' and ', type: MessageSegmentType.ORDINARY, card: undefined },
      { id: 3, text: '3', type: MessageSegmentType.COIN, card: undefined },
      { id: 4, text: ' from ', type: MessageSegmentType.ORDINARY, card: undefined },
      { id: 5, text: 'a ', type: MessageSegmentType.ORDINARY, card: undefined },
      { id: 6, text: 'Silver', type: MessageSegmentType.CARD, card: silver },
      { id: 7, text: '', type: MessageSegmentType.PARAGRAPH_BREAK, card: undefined },
      { id: 8, text: 'Continue', type: MessageSegmentType.ORDINARY, card: undefined },
    ]);
  });

  it('prefers horizontal-line matches over individual line breaks when ranges overlap', () => {
    const segments = new MessageSegmenter('Top\n-\nBottom', []).segmentMessage();

    expect(segments).toEqual([
      { id: 0, text: 'Top', type: MessageSegmentType.ORDINARY, card: undefined },
      { id: 1, text: '', type: MessageSegmentType.HORIZONTAL_LINE, card: undefined },
      { id: 2, text: 'Bottom', type: MessageSegmentType.ORDINARY, card: undefined },
    ]);
  });
});
