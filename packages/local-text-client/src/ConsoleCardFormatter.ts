import { CardFormatter } from '@dominion/client-common';
import { CardMetadata, LogMessage } from '@dominion/common';
import { AnonymousCard } from '@dominion/common';

export class ConsoleCardFormatter implements CardFormatter {
  public format(logMessage: LogMessage): string {
    if (logMessage.knownCards.length === 0 && logMessage.numUnknownCards === 0) {
      return this.getEmptyCardSetMessage();
    }

    if (logMessage.knownCards.length === 0) {
      return this.getAnonymousCardSetMessage(logMessage.numUnknownCards);
    } else if (logMessage.knownCards.length >= 1 && logMessage.numUnknownCards > 0) {
      return this.getSemiAnonymousCardSetMessage(logMessage.knownCards, logMessage.numUnknownCards);
    } else {
      return this.getFullySpecifiedCardSetMessage(logMessage.knownCards);
    }
  }

  private getEmptyCardSetMessage(): string {
    return 'no cards';
  }

  private getAnonymousCardSetMessage(numUnknownCards: number): string {
    if (numUnknownCards === 1) {
      return 'a card';
    }
    return numUnknownCards.toFixed() + ' cards';
  }

  private getSemiAnonymousCardSetMessage(knownCards: CardMetadata[], numUnknownCards: number): string {
    const cardStr = this.getFullySpecifiedCardSetMessage(knownCards);
    if (numUnknownCards === 1) {
      return cardStr + ' and another card';
    }
    return cardStr + ' and ' + numUnknownCards.toFixed() + ' other cards';
  }

  private getFullySpecifiedCardSetMessage(cards: (CardMetadata | AnonymousCard)[]): string {
    const cardCounts: Map<string, number> = this.getCardCounts(cards as CardMetadata[]);
    let cardCounter = 0;
    let cardStr = '';
    for (const cardName of cardCounts.keys()) {
      if (cardCounter > 0 && cardCounts.size > 2) {
        cardStr += ', ';
      }
      if (cardCounter > 0 && cardCounter === cardCounts.size - 1) {
        cardStr += ' and ';
      }

      if (cardCounts.get(cardName) === 1) {
        cardStr += 'a ' + cardName;
      } else {
        cardStr += cardCounts.get(cardName)!.toFixed() + ' ' + cardName + (cardCounts.get(cardName)! > 1 ? 's' : '');
      }
      cardCounter++;
    }

    return cardStr;
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
}
