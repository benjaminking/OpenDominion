import {
  CardCount,
  CardLocation,
  CardMetadata,
  GameConfiguration,
  GameMessageTransmitter,
  LogMessage,
  LogMessageTransmitter,
  NumberType,
  PileMetadata,
  StatusAction,
} from '@dominion/common';
import {
  CardCountMessage,
  CardsMessage,
  LogWSMessage,
  MainPlayerMessage,
  MechanicsMessage,
  MessageType,
  OpponentNamesMessage,
  PileMetadataMessage,
  SharedCardsMessage,
  StatisticMessage,
  StatusMessage,
  TopCardMessage,
  TurnStartMessage,
} from '@dominion/web-client-common';

import { Mechanic } from '../../common/dist/card/Mechanic.cjs';
import { WebSocketMessageWriter } from './WebSocketMessageWriter';

export class WebSocketMessageTransmitter implements GameMessageTransmitter, LogMessageTransmitter {
  constructor(public readonly messageWriter: WebSocketMessageWriter) {}

  sendLogMessage(logMessage: LogMessage): void {
    this.messageWriter.sendMessage({
      type: MessageType.LOG,
      content: logMessage,
    } as LogWSMessage);
  }
  sendMainPlayerName(mainPlayerName: string): void {
    this.messageWriter.sendMessage({
      type: MessageType.PLAYER_NAME,
      content: {
        name: mainPlayerName,
      },
    } as MainPlayerMessage);
  }
  sendOpponentNames(opponentNames: string[]): void {
    this.messageWriter.sendMessage({
      type: MessageType.OPPONENT_NAME,
      content: { names: opponentNames },
    } as OpponentNamesMessage);
  }
  sendTurnStartMessage(currentPlayerName: string): void {
    this.messageWriter.sendMessage({
      type: MessageType.TURN_START,
      content: { playerName: currentPlayerName },
    } as TurnStartMessage);
  }
  sendStatisticUpdate(ownerName: string, type: NumberType, value: number): void {
    this.messageWriter.sendMessage({
      type: MessageType.STATISTIC,
      content: {
        owner: ownerName,
        type: type,
        value: value,
      },
    } as StatisticMessage);
  }
  sendCardsUpdate(ownerName: string, location: CardLocation, cards: CardMetadata[]): void {
    this.messageWriter.sendMessage({
      type: MessageType.CARDS,
      content: {
        owner: ownerName,
        location: location,
        cards: cards,
      },
    } as CardsMessage);
  }
  sendCardCountUpdate(ownerName: string, location: CardLocation, cardCount: number): void {
    this.messageWriter.sendMessage({
      type: MessageType.CARD_COUNT,
      content: {
        owner: ownerName,
        location: location,
        count: cardCount,
      },
    } as CardCountMessage);
  }
  sendTopCardUpdate(ownerName: string, location: CardLocation, topCard: CardMetadata | undefined): void {
    this.messageWriter.sendMessage({
      type: MessageType.TOP_CARD,
      content: {
        owner: ownerName,
        location: location,
        topCard: topCard,
      },
    } as TopCardMessage);
  }
  sendSharedCardsUpdate(location: CardLocation, cards: CardMetadata[]): void {
    this.messageWriter.sendMessage({
      type: MessageType.SHARED_CARDS,
      content: {
        location: location,
        cards: cards,
      },
    } as SharedCardsMessage);
  }
  sendPileMetadata(pileMetadata: PileMetadata): void {
    this.messageWriter.sendMessage({
      type: MessageType.PILE_METADATA,
      content: pileMetadata,
    } as PileMetadataMessage);
  }

  sendStatus(statusMessage: string, action: StatusAction): void {
    this.messageWriter.sendMessage({
      type: MessageType.STATUS,
      content: {
        status: statusMessage,
        action: action,
      },
    } as StatusMessage);
  }

  sendMechanics(mechanics: Set<Mechanic>): void {
    this.messageWriter.sendMessage({
      type: MessageType.MECHANICS,
      content: {
        mechanics: Array.from(mechanics),
      },
    } as MechanicsMessage);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  sendBotCoins(_numCoins: number): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  sendBotCardCounts(_cardCountsObj: CardCount[]): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  sendGameConfiguration(_configuration: GameConfiguration): void {}
}
