import { ChoiceType, DecisionService, MultiNamedChoice, NamedChoice } from '@dominion/common';

import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { wrapWithWaitingStatus } from '../messaging/WaitingStatusWrapper';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { Player } from '../players/Player';
import { ActionChoice } from './ActionChoice';

export class ChooseMultipleOptionsBuilder {
  private optionNameMap: Map<string, ActionChoice> = new Map<string, ActionChoice>();
  private decisionName = ''; // TODO: set this when building

  private readonly ie: InstructionExecutor;
  private readonly decisionService: DecisionService;
  private readonly messageBroadcaster: GameMessageBroadcaster;

  constructor(
    private readonly player: Player,
    private prompt: string,
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

  public async choose(numToSelect: number): Promise<void> {
    const choices: NamedChoice[] = this.createNamedChoices();
    const chosenActions: MultiNamedChoice = await wrapWithWaitingStatus(this.messageBroadcaster, this.player, () =>
      this.decisionService.chooseMultipleOptions(this.prompt, this.decisionName, choices, numToSelect),
    );

    for (const chosenActionName of chosenActions.names) {
      if (!this.optionNameMap.has(chosenActionName)) {
        throw new Error('Decision service returned a non-existent option');
      }
    }

    for (const choice of choices) {
      if (chosenActions.names.indexOf(choice.name) >= 0) {
        await this.optionNameMap.get(choice.name)!.performAction();
      }
    }
  }
}
