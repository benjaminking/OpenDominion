import { CardChoice, CardLocation, CardSelectionPurpose, DecisionService } from '@dominion/common';

import { ChoiceType } from '../../../common/dist/index.cjs';
import { CardCollection } from '../card/CardCollection';
import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { wrapWithWaitingStatus } from '../messaging/WaitingStatusWrapper';
import { NumSelectedEligibilityFunction } from '../NumSelectedEligibilityFunction';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { Player } from '../players/Player';
import { anyCard } from '../StandardCardEligibilityFunctions';
import { anyNumber } from '../StandardNumberEligibilityFunctions';

export class CardMultiChoiceBuilder {
  private name = 'name';
  private selectionType: CardSelectionPurpose = CardSelectionPurpose.GAIN;
  private areaEligibility: Set<CardLocation> = new Set<CardLocation>();
  private cardEligibility: CardEligibilityFunction = anyCard;
  private isFromSet = false;
  private set: CardCollection = CardCollection.emptyCollection();
  private numSelectedEligibility: NumSelectedEligibilityFunction = anyNumber;

  private readonly ie: InstructionExecutor;
  private readonly decisionService: DecisionService;
  private readonly messageBroadcaster: GameMessageBroadcaster;

  public constructor(
    private readonly player: Player,
    private prompt = 'Choose a card',
  ) {
    this.ie = player.getInstructionExecutor();
    this.decisionService = player.getDecisionService();
    this.messageBroadcaster = player.getGame().getMessageBroadcaster();
  }

  public setPrompt(p: string): this {
    this.prompt = p;
    return this;
  }

  public setName(n: string): this {
    this.name = n;
    return this;
  }

  public to(type: CardSelectionPurpose): this {
    // TODO: make this an enum
    this.selectionType = type;
    return this;
  }

  public from(location: CardLocation | CardCollection): this {
    if (location instanceof CardCollection) {
      this.isFromSet = true;
      this.set = location;
    } else if (Array.isArray(location)) {
      this.isFromSet = true;
      this.set = CardCollection.fromCards(location);
    } else {
      this.areaEligibility.add(location);
    }
    return this;
  }

  public whereCardIs(cardEligibilityFunction: CardEligibilityFunction): this {
    this.cardEligibility = cardEligibilityFunction;
    return this;
  }

  public whereNumCardsIs(numSelectedEligibilityFunction: NumSelectedEligibilityFunction): this {
    this.numSelectedEligibility = numSelectedEligibilityFunction;
    return this;
  }

  public async choose(): Promise<CardCollection> {
    let choices: CardChoice[];
    if (this.isFromSet) {
      choices = this.set
        .asCardArray()
        .filter((card) => this.cardEligibility.matches(card))
        .map((card) => ({
          type: ChoiceType.Card,
          card: card.getMetadata(),
          name: card.getName(),
        }));
    } else {
      choices = this.ie.getEligibleCardChoices(this.areaEligibility, this.cardEligibility);
    }

    const choice = await wrapWithWaitingStatus(this.messageBroadcaster, this.player, () =>
      this.decisionService.chooseCards(
        this.prompt,
        this.selectionType,
        this.name,
        this.numSelectedEligibility.toAllowedNumbers(),
        choices,
      ),
    );
    return this.ie.getCardsByMetadata(choice.cards);
  }
}
