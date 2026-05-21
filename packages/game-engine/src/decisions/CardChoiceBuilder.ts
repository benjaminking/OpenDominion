import {
  CardChoice,
  CardLocation,
  CardSelectionPurpose,
  Choice,
  ChoiceType,
  DecisionService,
  ImpossibleChoice,
  isCardChoice,
  NoneChoice,
} from '@dominion/common';

import { Card } from '../card/Card';
import { CardCollection } from '../card/CardCollection';
import { CardEligibilityFunction } from '../CardEligibilityFunction';
import { GameMessageBroadcaster } from '../messaging/GameMessageBroadcaster';
import { wrapWithWaitingStatus } from '../messaging/WaitingStatusWrapper';
import { InstructionExecutor } from '../players/InstructionExecutor';
import { Player } from '../players/Player';
import { anyCard } from '../StandardCardEligibilityFunctions';
import { CardSelectionLocation } from './CardSelectionLocation';

export class CardChoiceBuilder {
  private name = 'name';
  private selectionType: CardSelectionPurpose = CardSelectionPurpose.GAIN;
  private areaEligibility: Set<CardLocation> = new Set<CardLocation>();
  private cardEligibility: CardEligibilityFunction = anyCard;
  private isFromSet = false;
  private isFromSupply = false;
  private set: CardCollection = CardCollection.emptyCollection();
  private additionalOptions: string[] = [];
  private noneOption = false;

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

  public setPrompt(prompt: string): this {
    this.prompt = prompt;
    return this;
  }

  public setName(n: string): this {
    this.name = n;
    return this;
  }

  public to(type: CardSelectionPurpose): this {
    this.selectionType = type;
    return this;
  }

  public from(location: CardLocation | CardSelectionLocation | CardCollection): this {
    if (location === CardSelectionLocation.SUPPLY) {
      this.isFromSupply = true;
    } else if (location === CardSelectionLocation.ALL_CARDS) {
      this.isFromSupply = true;
      this.set = this.ie.getAllExtraCards();
    } else if (location instanceof CardCollection) {
      this.isFromSet = true;
      this.set = location;
    } else {
      this.areaEligibility.add(location);
    }
    return this;
  }

  public whereCardIs(cardEligibilityFunction: CardEligibilityFunction): this {
    this.cardEligibility = cardEligibilityFunction;
    return this;
  }

  public allowNoneOption(): this {
    this.noneOption = true;
    return this;
  }

  public alsoAllow(options: string[]): this {
    this.additionalOptions = options;
    return this;
  }

  public async choose(): Promise<Card | Choice> {
    if (this.isFromSupply) {
      return this.chooseFromSupply();
    }
    if (this.isFromSet) {
      return this.chooseFromSet();
    }

    return this.chooseFromOtherLocations();
  }

  private async chooseFromSet(): Promise<Card | NoneChoice | ImpossibleChoice> {
    const possibleChoices: CardChoice[] = this.set
      .asCardArray()
      .filter((card) => this.cardEligibility.matches(card))
      .map((card) => ({
        type: ChoiceType.Card,
        card: card.getMetadata(),
        name: card.getName(),
      }));

    if (possibleChoices.length === 0 && this.noneOption) {
      return { type: ChoiceType.None };
    } else if (possibleChoices.length === 0) {
      return {
        type: ChoiceType.Impossible,
      } as ImpossibleChoice;
    }

    const choice = await wrapWithWaitingStatus(this.messageBroadcaster, this.player, () =>
      this.decisionService.chooseCard(
        this.prompt,
        this.selectionType,
        this.name,
        possibleChoices,
        this.noneOption ? { type: ChoiceType.None } : undefined,
      ),
    );

    if (isCardChoice(choice)) {
      const card = this.ie.getCardByMetadata(choice.card);
      if (card !== undefined) {
        return card;
      } else {
        throw new Error('Decision service returned an invalid card');
      }
    }
    return choice;
  }

  private async chooseFromSupply(): Promise<Card | NoneChoice | ImpossibleChoice> {
    const possibleChoices: CardChoice[] = this.ie.getEligibleSupplyChoices(this.cardEligibility);
    if (possibleChoices.length === 0 && this.noneOption) {
      return { type: ChoiceType.None };
    } else if (possibleChoices.length === 0) {
      return {
        type: ChoiceType.Impossible,
      } as ImpossibleChoice;
    }

    const choice = await wrapWithWaitingStatus(this.messageBroadcaster, this.player, () =>
      this.decisionService.chooseCard(
        this.prompt,
        this.selectionType,
        this.name,
        possibleChoices,
        this.noneOption ? { type: ChoiceType.None } : undefined,
      ),
    );

    if (isCardChoice(choice)) {
      const card = this.ie.getCardByMetadata(choice.card);
      if (card !== undefined) {
        return card;
      } else {
        throw new Error('Decision service returned an invalid card');
      }
    }
    return choice;
  }

  private async chooseFromOtherLocations(): Promise<Card | NoneChoice | ImpossibleChoice> {
    const possibleChoices: CardChoice[] = this.ie.getEligibleCardChoices(this.areaEligibility, this.cardEligibility);

    if (possibleChoices.length === 0 && this.noneOption) {
      return { type: ChoiceType.None };
    } else if (possibleChoices.length === 0) {
      return {
        type: ChoiceType.Impossible,
      } as ImpossibleChoice;
    }

    const choice = await wrapWithWaitingStatus(this.messageBroadcaster, this.player, () =>
      this.decisionService.chooseCard(this.prompt, this.selectionType, this.name, possibleChoices),
    );

    if (isCardChoice(choice)) {
      const card: Card | undefined = this.ie.getCardByMetadata(choice.card);
      if (card !== undefined) {
        return card;
      } else {
        throw new Error('Decision service returned an invalid card');
      }
    }
    return choice;
  }
}
