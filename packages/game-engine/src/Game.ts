import { GameResult } from '@dominion/common';

import { Logger } from './logging/Logger';
import { GameMessageBroadcaster } from './messaging/GameMessageBroadcaster';
import { PlayerSpecification } from './players';
import { AllPlayers } from './players/AllPlayers';
import { Player } from './players/Player';
import { SharedGameState } from './SharedGameState';

export class Game {
  private readonly gameState: SharedGameState;
  private readonly allPlayers: AllPlayers;
  private readonly logger: Logger;
  private readonly messageBroadcaster: GameMessageBroadcaster;

  constructor(playerSpecs: PlayerSpecification[]) {
    this.messageBroadcaster = new GameMessageBroadcaster();
    this.messageBroadcaster.pauseBroadcasting();

    this.logger = new Logger(this);
    this.gameState = new SharedGameState(this);
    this.allPlayers = this.createPlayers(playerSpecs);
    this.messageBroadcaster.updateWithPlayers(this.allPlayers.getAllPlayers());
  }

  private createPlayers(playerSpecs: PlayerSpecification[]): AllPlayers {
    return new AllPlayers(
      playerSpecs.map((x) => x.toPlayer(this)),
      this,
    );
  }

  public getGameState(): SharedGameState {
    return this.gameState;
  }

  public getPlayers(): AllPlayers {
    return this.allPlayers;
  }

  public getPlayerIndex(player: Player): number {
    return this.allPlayers.getPlayerIndexByName(player.getName());
  }

  public getMessageBroadcaster(): GameMessageBroadcaster {
    return this.messageBroadcaster;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  public choosePlayerOrder() {
    // Perhaps we can support choosing the player order
    this.allPlayers.randomizeOrder();
  }

  public async runGame(): Promise<GameResult> {
    await this.gameState.prepareForStartOfGame();

    this.communicateInitialState();
    await this.gameState.startGame();
    return this.gameState.getGameResult()!;
  }

  private communicateInitialState(): void {
    this.messageBroadcaster.resumeBroadcasting();
    this.gameState.communicateInitialState();
    this.allPlayers.communicateInitialState();
  }
}
