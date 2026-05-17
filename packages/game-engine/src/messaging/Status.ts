import { Player } from '../players/Player';

export class PlayerNameStatus {
  // In the template, %p stands for the player name and %p is the possessive version of the name
  constructor(
    private readonly template: string,
    private readonly targetPlayer: Player,
  ) {}

  public renderForPlayer(player: Player): string {
    if (player.getName() === this.targetPlayer.getName()) {
      return this.renderWithPersonalPronouns();
    }
    return this.renderWithTargetPlayerName();
  }

  private renderWithPersonalPronouns(): string {
    const filledInTemplate = this.template.replace('%p', 'you').replace('%q', 'your');
    if (filledInTemplate.startsWith('your')) {
      return 'Your' + filledInTemplate.substring(4);
    }
    return filledInTemplate;
  }

  private renderWithTargetPlayerName(): string {
    return this.template.replace('%p', this.targetPlayer.getName()).replace('%q', this.targetPlayer.getName() + "'s");
  }
}
