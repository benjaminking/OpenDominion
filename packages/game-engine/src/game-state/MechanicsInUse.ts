import { Mechanic } from '@dominion/common';

import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';

export class MechanicsInUse {
  private readonly mechanics: Set<Mechanic> = new Set<Mechanic>();

  constructor(private readonly messageBroadcaster: GameMessageBroadcaster) {}

  private broadcastMechanics(): void {
    this.messageBroadcaster.sendMechanics(this.mechanics);
  }

  public add(mechanic: Mechanic): void {
    this.mechanics.add(mechanic);
    this.broadcastMechanics();
  }

  public addAll(mechanics: Set<Mechanic>): void {
    mechanics.forEach((mechanic: Mechanic) => this.mechanics.add(mechanic));
    this.broadcastMechanics();
  }

  public forceBroadcast(): void {
    this.broadcastMechanics();
  }
}
