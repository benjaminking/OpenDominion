import { ChoiceType, DecisionService, NamedChoice } from '@dominion/common';

import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { wrapWithWaitingStatus } from '../messaging/WaitingStatusWrapper';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { Player } from '../players/Player';
import { ActionChoice } from './ActionChoice';

export class ChooseOneOptionBuilder {
  private optionNameMap: Map<string, ActionChoice> = new Map<string, ActionChoice>();
  private decisionName = ''; // TODO: set this when building

  private readonly ie: InstructionExecutor;
  private readonly decisionService: DecisionService;
  private readonly messageBroadcaster: GameMessageBroadcaster;

  constructor(
    private readonly player: Player,
    private readonly prompt = 'Choose one: ',
  ) {
    this.ie = player.getInstructionExecutor();
    this.decisionService = player.getDecisionService();
    this.messageBroadcaster = player.getGame().getMessageBroadcaster();
  }

  public from(option: ActionChoice): this {
    this.optionNameMap.set(option.getName(), option);
    return this;
  }

  private createNamedChoices(): NamedChoice[] {
    const namedChoices: NamedChoice[] = [];
    for (const name of this.optionNameMap.keys()) {
      namedChoices.push({
        type: ChoiceType.ChooseOne,
        name: name,
      });
    }
    return namedChoices;
  }

  public async choose(): Promise<ActionChoice> {
    const choices: NamedChoice[] = this.createNamedChoices();

    const choice = await wrapWithWaitingStatus(this.messageBroadcaster, this.player, () =>
      this.decisionService.chooseOneOption(this.prompt, this.decisionName, choices),
    );

    if (!this.optionNameMap.has(choice.name)) {
      throw new Error('Decision service returned a non-existent option');
    }

    const chosenOption = this.optionNameMap.get(choice.name);
    await chosenOption!.performAction();
    return chosenOption!;
  }
}
