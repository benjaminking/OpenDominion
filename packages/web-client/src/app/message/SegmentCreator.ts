import { CardMetadata, MessageCards } from '@dominion/common';
import { IncompleteMessageSegment, MessageSegmentType } from './MessageSegment';
import { SegmentMatch } from './SegmentMatcher';

export abstract class SegmentCreator {
  abstract createSegments(message: string, segmentMatch: SegmentMatch): IncompleteMessageSegment[];
}

export class CoinSegmentCreator extends SegmentCreator {
  private coinPattern = /\$(\d+)/;

  createSegments(message: string, segmentMatch: SegmentMatch): IncompleteMessageSegment[] {
    const match = this.coinPattern.exec(message.substring(segmentMatch.startIndex, segmentMatch.endIndex));
    let text = '';
    if (match !== null) {
      text = match[1];
    }

    return [
      {
        text: text,
        type: MessageSegmentType.COIN,
      },
    ];
  }
}

export class VPSegmentCreator extends SegmentCreator {
  private coinPattern = /^(\d+)VP/;

  createSegments(message: string, segmentMatch: SegmentMatch): IncompleteMessageSegment[] {
    const match = this.coinPattern.exec(message.substring(segmentMatch.startIndex, segmentMatch.endIndex));
    let text = '';
    if (match !== null) {
      text = match[1];
    }

    return [
      {
        text: text,
        type: MessageSegmentType.VP,
      },
    ];
  }
}

export class BoldSegmentCreator extends SegmentCreator {
  createSegments(message: string, segmentMatch: SegmentMatch): IncompleteMessageSegment[] {
    return [
      {
        text: message.substring(segmentMatch.startIndex, segmentMatch.endIndex),
        type: MessageSegmentType.BOLD,
      },
    ];
  }
}

export class HorizontalLineSegmentCreator extends SegmentCreator {
  createSegments(_message: string, _segmentMatch: SegmentMatch): IncompleteMessageSegment[] {
    return [
      {
        text: '',
        type: MessageSegmentType.HORIZONTAL_LINE,
      },
    ];
  }
}

export class LineBreakSegmentCreator extends SegmentCreator {
  createSegments(_message: string, _segmentMatch: SegmentMatch): IncompleteMessageSegment[] {
    return [
      {
        text: '',
        type: MessageSegmentType.LINE_BREAK,
      },
    ];
  }
}

export class ParagraphBreakSegmentCreator extends SegmentCreator {
  createSegments(_message: string, _segmentMatch: SegmentMatch): IncompleteMessageSegment[] {
    return [
      {
        text: '',
        type: MessageSegmentType.PARAGRAPH_BREAK,
      },
    ];
  }
}

export class CardSegmentCreator extends SegmentCreator {
  private cardsIndex = 0;

  constructor(private readonly cardsToSubstitute: MessageCards[]) {
    super();
  }

  createSegments(_message: string, _segmentMatch: SegmentMatch): IncompleteMessageSegment[] {
    const messageCards = this.cardsToSubstitute[this.cardsIndex++];
    if (messageCards.knownCards.length === 0 && messageCards.numUnknownCards === 0) {
      return [{ text: 'no cards', type: MessageSegmentType.ORDINARY }];
    }
    if (messageCards.numUnknownCards === 0) {
      const knownCardsCounts: Map<string, number> = this.getCardCounts(messageCards.knownCards);
      const knownCardInstances: Map<string, CardMetadata> = this.getCardInstances(messageCards.knownCards);
      const cardMessageSegments: IncompleteMessageSegment[][] = this.convertCardCountsToMessageSegments(
        knownCardsCounts,
        knownCardInstances,
      );
      return this.joinList(cardMessageSegments);
    }

    let unknownCardSegment: IncompleteMessageSegment;
    if (messageCards.numUnknownCards === 1) {
      unknownCardSegment = { text: 'a card', type: MessageSegmentType.ORDINARY };
    }
    unknownCardSegment = { text: messageCards.numUnknownCards.toFixed() + ' cards', type: MessageSegmentType.ORDINARY };
    if (messageCards.knownCards.length === 0) {
      return [unknownCardSegment];
    }

    const knownCardsCounts: Map<string, number> = this.getCardCounts(messageCards.knownCards);
    const knownCardInstances: Map<string, CardMetadata> = this.getCardInstances(messageCards.knownCards);
    const cardMessageSegments: IncompleteMessageSegment[][] = this.convertCardCountsToMessageSegments(
      knownCardsCounts,
      knownCardInstances,
    );
    cardMessageSegments.push([unknownCardSegment]);

    return this.joinList(cardMessageSegments);
  }

  private getCardCounts(cards: CardMetadata[]): Map<string, number> {
    const cardCounts: Map<string, number> = new Map<string, number>();
    for (const card of cards) {
      if (!cardCounts.has(card.name)) {
        cardCounts.set(card.name, 0);
      }
      cardCounts.set(card.name, cardCounts.get(card.name)! + 1);
    }
    return cardCounts;
  }

  private getCardInstances(cards: CardMetadata[]): Map<string, CardMetadata> {
    const cardInstances: Map<string, CardMetadata> = new Map<string, CardMetadata>();
    for (const card of cards) {
      if (!cardInstances.has(card.name)) {
        cardInstances.set(card.name, card);
      }
    }
    return cardInstances;
  }

  private convertCardCountsToMessageSegments(
    cardCounts: Map<string, number>,
    cardInstances: Map<string, CardMetadata>,
  ): IncompleteMessageSegment[][] {
    const messageSegments: IncompleteMessageSegment[][] = [];
    for (const cardName of cardCounts.keys()) {
      messageSegments.push(
        this.convertCardCountToMessageSegments(cardName, cardInstances.get(cardName), cardCounts.get(cardName)),
      );
    }
    return messageSegments;
  }

  private convertCardCountToMessageSegments(
    name: string,
    card: CardMetadata,
    count: number,
  ): IncompleteMessageSegment[] {
    if (count === 1) {
      if (name.match(/^[aeiou]/i)) {
        return [
          {
            text: 'an ',
            type: MessageSegmentType.ORDINARY,
          },
          {
            text: card.name,
            card: card,
            type: MessageSegmentType.CARD,
          },
        ];
      }
      return [
        {
          text: 'a ',
          type: MessageSegmentType.ORDINARY,
        },
        {
          text: card.name,
          card: card,
          type: MessageSegmentType.CARD,
        },
      ];
    } else {
      if (name.match(/(s|ch|sh|x|z)$/i)) {
        return [
          {
            text: count.toFixed() + ' ',
            type: MessageSegmentType.ORDINARY,
          },
          {
            text: name + (count > 1 ? 'es' : ''),
            card: card,
            type: MessageSegmentType.CARD,
          },
        ];
      }
      return [
        {
          text: count.toFixed() + ' ',
          type: MessageSegmentType.ORDINARY,
        },
        {
          text: name + (count > 1 ? 's' : ''),
          card: card,
          type: MessageSegmentType.CARD,
        },
      ];
    }
  }

  private joinList(segments: IncompleteMessageSegment[][]): IncompleteMessageSegment[] {
    if (segments.length === 1) {
      return segments[0];
    }

    if (segments.length === 2) {
      return segments[0].concat({ text: ' and ', type: MessageSegmentType.ORDINARY }).concat(segments[1]);
    }

    const messageSegments: IncompleteMessageSegment[] = [];
    segments.forEach((segmentGroup: IncompleteMessageSegment[], index) => {
      for (const messageSegment of segmentGroup) {
        messageSegments.push(messageSegment);
      }
      if (index < segments.length - 2) {
        messageSegments.push({ text: ', ', type: MessageSegmentType.ORDINARY });
      } else if (index < segments.length - 1) {
        messageSegments.push({ text: ', and ', type: MessageSegmentType.ORDINARY });
      }
    });
    return messageSegments;
  }
}
