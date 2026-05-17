import { CardLocation } from '../card/CardLocation';
import { CardMetadata } from '../card/CardMetadata';
import { GameConfiguration } from '../game/GameConfiguration';
import { NumberType } from '../NumberType';
import { PileMetadata } from '../pile/PileMetadata';
import { CardCount } from './CardCount';
import { StatusAction } from './StatusAction';

export interface GameMessageTransmitter {
  sendMainPlayerName: (mainPlayerName: string) => void;
  sendOpponentNames: (opponentNames: string[]) => void;
  sendGameConfiguration: (GameConfiguration: GameConfiguration) => void;
  sendTurnStartMessage: (currentPlayerName: string) => void;
  sendStatisticUpdate: (ownerName: string, type: NumberType, value: number) => void;
  sendCardsUpdate: (ownerName: string, location: CardLocation, cards: CardMetadata[]) => void;
  sendCardCountUpdate: (ownerName: string, location: CardLocation, cardCount: number) => void;
  sendTopCardUpdate: (ownerName: string, location: CardLocation, topCard: CardMetadata | undefined) => void;
  sendSharedCardsUpdate: (location: CardLocation, cards: CardMetadata[]) => void;
  sendPileMetadata: (pileMetadata: PileMetadata) => void;
  sendStatus: (statusMessage: string, action: StatusAction) => void;
  sendBotCoins: (numCoins: number) => void;
  sendBotCardCounts: (cardCountsObj: CardCount[]) => void;
}
