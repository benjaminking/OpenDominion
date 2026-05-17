import { LogMessage, LogMessageType } from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { Player } from '../players/Player';

export class ServerLogMessage {
  private readonly cards?: CardCollection;

  private constructor(
    private readonly player: Player,
    private readonly type: LogMessageType,
    private readonly message: string,
    c: Card | CardCollection | undefined,
    private readonly visibility: LogMessageVisibility,
  ) {
    if (c instanceof Card) {
      this.cards = CardCollection.fromCards([c]);
    } else if (Array.isArray(c)) {
      this.cards = CardCollection.fromCards(c);
    } else if (typeof c !== 'undefined') {
      this.cards = c;
    }
  }

  public static privateMessage(player: Player, message: string, c?: Card | CardCollection): ServerLogMessage {
    return new ServerLogMessage(player, LogMessageType.NORMAL, message, c, LogMessageVisibility.CARDS_ARE_PRIVATE);
  }

  public static publicMessage(player: Player, message: string, c?: Card | CardCollection): ServerLogMessage {
    return new ServerLogMessage(player, LogMessageType.NORMAL, message, c, LogMessageVisibility.PUBLIC);
  }

  public static localMessage(player: Player, message: string, c?: Card | CardCollection): ServerLogMessage {
    return new ServerLogMessage(player, LogMessageType.NORMAL, message, c, LogMessageVisibility.PRIVATE);
  }

  public static turnStartMessage(player: Player, turnNumber: number) {
    return new ServerLogMessage(
      player,
      LogMessageType.TURN_START,
      "'s Turn #" + turnNumber.toFixed(),
      undefined,
      LogMessageVisibility.PUBLIC,
    );
  }

  public renderLocal(orderIndex: number): LogMessage {
    return {
      orderIndex: orderIndex,
      playerName: this.player.getName(),
      text: this.message,
      knownCards: this.cards?.toCardMetadataArray() ?? [],
      numUnknownCards: 0,
      type: this.type,
    };
  }

  public renderRemote(orderIndex: number): LogMessage | undefined {
    if (this.visibility === LogMessageVisibility.PUBLIC) {
      return {
        orderIndex: orderIndex,
        playerName: this.player.getName(),
        text: this.message,
        knownCards: this.cards?.toCardMetadataArray() ?? [],
        numUnknownCards: 0,
        type: this.type,
      };
    } else if (this.visibility === LogMessageVisibility.NON_TOP_CARDS_ARE_PRIVATE) {
      if (this.message.includes('%c') && this.cards !== undefined) {
        return {
          orderIndex: orderIndex,
          playerName: this.player.getName(),
          text: this.message,
          knownCards: this.cards.toCardMetadataArray(),
          numUnknownCards: this.cards.size() > 0 ? this.cards.size() - 1 : 0,
          type: this.type,
        };
      }
      return {
        orderIndex: orderIndex,
        playerName: this.player.getName(),
        text: this.message,
        knownCards: [],
        numUnknownCards: 0,
        type: this.type,
      };
    } else if (this.visibility === LogMessageVisibility.CARDS_ARE_PRIVATE) {
      if (this.message.includes('%c') && this.cards !== undefined) {
        return {
          orderIndex: orderIndex,
          playerName: this.player.getName(),
          text: this.message,
          knownCards: [],
          numUnknownCards: this.cards.size(),
          type: this.type,
        };
      }
      return {
        orderIndex: orderIndex,
        playerName: this.player.getName(),
        text: this.message,
        knownCards: [],
        numUnknownCards: 0,
        type: this.type,
      };
    } else if (this.visibility === LogMessageVisibility.PRIVATE) {
      return undefined;
    }
  }

  public getVisibility(): LogMessageVisibility {
    return this.visibility;
  }
}

export enum LogMessageVisibility {
  PUBLIC,
  CARDS_ARE_PRIVATE,
  NON_TOP_CARDS_ARE_PRIVATE,
  PRIVATE,
}
