import { GameConfiguration, StatusAction } from '@dominion/common';
import {
  CardCount,
  CardLocation,
  CardMetadata,
  DecisionService,
  GameMessageTransmitter,
  LogMessage,
  LogMessageTransmitter,
  NumberType,
  PileMetadata,
} from '@dominion/common';

export class Client {
  public constructor(
    private readonly decisionService: DecisionService,
    private readonly logMessageTransmitter: LogMessageTransmitter,
    private readonly gameMessageTransmitter: GameMessageTransmitter,
    private readonly isBot = false,
  ) {}

  public isBotClient(): boolean {
    return this.isBot;
  }

  public getDecisionService(): DecisionService {
    return this.decisionService;
  }

  public sendLogMessage(logMessage: LogMessage): void {
    this.logMessageTransmitter.sendLogMessage(logMessage);
  }

  public sendMainPlayerName(mainPlayerName: string): void {
    this.gameMessageTransmitter.sendMainPlayerName(mainPlayerName);
  }

  public sendOpponentNames(opponentNames: string[]): void {
    this.gameMessageTransmitter.sendOpponentNames(opponentNames);
  }

  public sendGameConfiguration(gameConfiguration: GameConfiguration): void {
    this.gameMessageTransmitter.sendGameConfiguration(gameConfiguration);
  }

  public sendTurnStartMessage(currentPlayerName: string): void {
    this.gameMessageTransmitter.sendTurnStartMessage(currentPlayerName);
  }

  public sendStatisticUpdate(ownerName: string, type: NumberType, value: number): void {
    this.gameMessageTransmitter.sendStatisticUpdate(ownerName, type, value);
  }

  public sendCardsUpdate(ownerName: string, location: CardLocation, cards: CardMetadata[]): void {
    this.gameMessageTransmitter.sendCardsUpdate(ownerName, location, cards);
  }

  public sendCardCountUpdate(ownerName: string, location: CardLocation, cardCount: number): void {
    this.gameMessageTransmitter.sendCardCountUpdate(ownerName, location, cardCount);
  }

  public sendTopCardUpdate(ownerName: string, location: CardLocation, topCard: CardMetadata | undefined): void {
    this.gameMessageTransmitter.sendTopCardUpdate(ownerName, location, topCard);
  }

  public sendSharedCardsUpdate(location: CardLocation, cards: CardMetadata[]): void {
    this.gameMessageTransmitter.sendSharedCardsUpdate(location, cards);
  }

  public sendPileMetadata(pileMetadata: PileMetadata): void {
    this.gameMessageTransmitter.sendPileMetadata(pileMetadata);
  }

  public sendStatus(statusMessage: string, action: StatusAction = StatusAction.REPLACE): void {
    this.gameMessageTransmitter.sendStatus(statusMessage, action);
  }

  public sendBotCoins(numCoins: number): void {
    this.gameMessageTransmitter.sendBotCoins(numCoins);
  }

  public sendBotCardCounts(cardCountsObj: CardCount[]): void {
    this.gameMessageTransmitter.sendBotCardCounts(cardCountsObj);
  }
}
