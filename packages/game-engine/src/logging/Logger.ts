import { LogMessage } from '@dominion/common';

import { Game } from '../Game';
import { Player } from '../players/Player';
import { ServerLogMessage } from './ServerLogMessage';

export class Logger {
  private logMessageOrderIndex = 0;

  constructor(private readonly game: Game) {}

  public gameMessage(player: Player, message: ServerLogMessage): void {
    const ownersLogMessage: LogMessage = message.renderLocal(this.logMessageOrderIndex);
    const opponentLogMessage: LogMessage | undefined = message.renderRemote(this.logMessageOrderIndex);

    this.logMessageOrderIndex += 1;

    this.game.getPlayers().getPlayerByName(player.getName())?.transmitLogMessage(ownersLogMessage);
    if (opponentLogMessage === undefined) {
      return;
    }
    for (const opponent of this.game.getPlayers().getOpponentsOfPlayerByName(player.getName())) {
      opponent.transmitLogMessage(opponentLogMessage);
    }
  }
}
