import { StatusAction } from '@dominion/common';

import { Player } from '../players/Player';
import { GameMessageBroadcaster } from './GameMessageBroadcaster';
import { PlayerNameStatus } from './Status';

export function wrapWithWaitingStatus<T>(
  messageBroadcaster: GameMessageBroadcaster,
  targetPlayer: Player,
  wrappedFunction: () => T,
): T {
  messageBroadcaster.sendStatus(new PlayerNameStatus('Waiting for %p...', targetPlayer), StatusAction.PUSH);
  const returnValue: T = wrappedFunction();
  messageBroadcaster.sendStatus(new PlayerNameStatus('', targetPlayer), StatusAction.POP);

  return returnValue;
}
