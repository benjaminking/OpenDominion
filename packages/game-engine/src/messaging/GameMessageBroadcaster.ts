import { CardCount, CardLocation, Mechanic, NumberType, PileMetadata } from '@dominion/common';
import { StatusAction } from '@dominion/common';

import { CardCollection } from '../card/CardCollection';
import { OrderedStack } from '../card/OrderedStack';
import { PrivacyType } from '../card/PrivacyType';
import { Player } from '../players/Player';
import { PlayerNameStatus } from './Status';

export class GameMessageBroadcaster {
  private shouldBroadcast = true;
  private players: Player[] = [];

  // TODO: see if there's a way to not have to reach inside each player and get their client
  public updateWithPlayers(players: Player[]): void {
    this.players = players;
  }

  public pauseBroadcasting(): void {
    this.shouldBroadcast = false;
  }

  public resumeBroadcasting(): void {
    this.shouldBroadcast = true;
  }

  public sendPlayerNames(): void {
    if (!this.shouldBroadcast) {
      return;
    }
    for (let playerIndex = 0; playerIndex < this.players.length; ++playerIndex) {
      const mainPlayer = this.players[playerIndex];
      mainPlayer.getClient().sendMainPlayerName(mainPlayer.getName());

      const opponentNames: string[] = [];
      for (let otherPlayerOffset = 1; otherPlayerOffset < this.players.length; ++otherPlayerOffset) {
        const otherPlayerIndex = (playerIndex + otherPlayerOffset) % this.players.length;
        opponentNames.push(this.players[otherPlayerIndex].getName());
      }
      mainPlayer.getClient().sendOpponentNames(opponentNames);
    }
  }

  public sendTurnStartMessage(currentPlayer: Player): void {
    if (!this.shouldBroadcast) {
      return;
    }
    for (const player of this.players) {
      player.getClient().sendTurnStartMessage(currentPlayer.getName());
    }
  }

  public updateStatistic(owner: Player, type: NumberType, value: number): void {
    if (!this.shouldBroadcast) {
      return;
    }
    for (const player of this.players) {
      player.getClient().sendStatisticUpdate(owner.getName(), type, value);
    }
  }

  public updatePlayerCards(
    owner: Player,
    location: CardLocation,
    privacyType: PrivacyType,
    cards: CardCollection,
  ): void {
    if (!this.shouldBroadcast) {
      return;
    }
    for (const player of this.players) {
      this.updateCardsForPlayer(player, owner, location, privacyType, cards);
    }
  }

  private updateCardsForPlayer(
    player: Player,
    cardsOwner: Player,
    location: CardLocation,
    privacyType: PrivacyType,
    cards: CardCollection,
  ): void {
    if (!this.shouldBroadcast) {
      return;
    }
    if (player.getName() === cardsOwner.getName()) {
      this.updateCardsForOwner(player, location, privacyType, cards);
    } else {
      this.updateCardsForNonOwner(player, cardsOwner, location, privacyType, cards);
    }
  }

  private updateCardsForOwner(
    owner: Player,
    location: CardLocation,
    privacyType: PrivacyType,
    cards: CardCollection,
  ): void {
    if (!this.shouldBroadcast) {
      return;
    }
    switch (privacyType) {
      case PrivacyType.ALL_VISIBLE:
      case PrivacyType.SIZE_VISIBLE_TO_OPPONENTS: {
        owner.getClient().sendCardsUpdate(owner.getName(), location, cards.toCardMetadataArray());
        break;
      }
      case PrivacyType.SIZE_VISIBLE_TO_ALL: {
        owner.getClient().sendCardCountUpdate(owner.getName(), location, cards.size());
        break;
      }
      case PrivacyType.TOP_CARD_VISIBLE_TO_ALL: {
        owner
          .getClient()
          .sendTopCardUpdate(owner.getName(), location, (cards as OrderedStack).getTopCard()?.getMetadata());
      }
    }
  }

  private updateCardsForNonOwner(
    nonOwner: Player,
    cardsOwner: Player,
    location: CardLocation,
    privacyType: PrivacyType,
    cards: CardCollection,
  ) {
    if (!this.shouldBroadcast) {
      return;
    }
    switch (privacyType) {
      case PrivacyType.ALL_VISIBLE: {
        nonOwner.getClient().sendCardsUpdate(cardsOwner.getName(), location, cards.toCardMetadataArray());
        break;
      }
      case PrivacyType.SIZE_VISIBLE_TO_OPPONENTS:
      case PrivacyType.SIZE_VISIBLE_TO_ALL: {
        nonOwner.getClient().sendCardCountUpdate(cardsOwner.getName(), location, cards.size());
        break;
      }
      case PrivacyType.TOP_CARD_VISIBLE_TO_ALL: {
        nonOwner
          .getClient()
          .sendTopCardUpdate(cardsOwner.getName(), location, (cards as OrderedStack).getTopCard()?.getMetadata());
      }
    }
  }

  public updateSharedCards(location: CardLocation, privacyType: PrivacyType, cards: CardCollection): void {
    if (!this.shouldBroadcast) {
      return;
    }
    for (const player of this.players) {
      this.updateSharedCardsForPlayer(player, location, privacyType, cards);
    }
  }

  private updateSharedCardsForPlayer(
    player: Player,
    location: CardLocation,
    privacyType: PrivacyType,
    cards: CardCollection,
  ): void {
    if (!this.shouldBroadcast) {
      return;
    }
    switch (privacyType) {
      case PrivacyType.ALL_VISIBLE: {
        player.getClient().sendSharedCardsUpdate(location, cards.toCardMetadataArray());
        break;
      }
    }
  }

  public sendPileMetadata(pileMetadata: PileMetadata): void {
    if (!this.shouldBroadcast) {
      return;
    }
    for (const player of this.players) {
      player.getClient().sendPileMetadata(pileMetadata);
    }
  }

  public sendStatus(status: PlayerNameStatus, action: StatusAction = StatusAction.REPLACE): void {
    if (!this.shouldBroadcast) {
      return;
    }
    for (const player of this.players) {
      player.getClient().sendStatus(status.renderForPlayer(player), action);
    }
  }

  public updateBotCoins(numCoins: number): void {
    if (!this.shouldBroadcast) {
      return;
    }
    for (const player of this.players) {
      if (player.isBotPlayer()) {
        player.getClient().sendBotCoins(numCoins);
      }
    }
  }

  public updateBotCardCounts(cardCountsObj: CardCount[]): void {
    if (!this.shouldBroadcast) {
      return;
    }
    for (const player of this.players) {
      if (player.isBotPlayer()) {
        player.getClient().sendBotCardCounts(cardCountsObj);
      }
    }
  }

  public sendMechanics(mechanics: Set<Mechanic>): void {
    if (!this.shouldBroadcast) {
      return;
    }
    for (const player of this.players) {
      player.getClient().sendMechanics(mechanics);
    }
  }
}
