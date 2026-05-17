import { Client } from '@dominion/client-common';

import { Game } from '../Game';
import { Player } from './Player';

export class PlayerSpecification {
  public constructor(
    private readonly name: string,
    private readonly client: Client,
    private readonly isBot = false,
  ) {}

  public toPlayer(game: Game): Player {
    const player: Player = new Player(this.name, game, this.client, this.isBot);
    return player;
  }
}
