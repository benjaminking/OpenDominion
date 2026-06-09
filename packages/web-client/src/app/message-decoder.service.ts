import { Injectable } from '@angular/core';
import {
  CardChoice,
  CardLocation,
  CardMetadata,
  CardSelectionPurpose,
  EffectChoice,
  ExtraTurnChoice,
  GameResult,
  LogMessage,
  NamedChoice,
  NoneChoice,
  NumberType,
  PileMetadata,
  SimpleTreasuresChoice,
  StatusAction,
} from '@dominion/common';
import {
  MainPlayerMessage,
  Message,
  MessageType,
  OpponentNamesMessage,
  CardCountMessage,
  CardsMessage,
  TopCardMessage,
  PileMetadataMessage,
  SharedCardsMessage,
  StatisticMessage,
  TurnStartMessage,
  SharedCardsContent,
  TopCardContent,
  CardCountContent,
  CardsContent,
  StatisticContent,
  LogWSMessage,
  ChooseCardMessage,
  ChooseCardContent,
  ChooseCardsContent,
  ChooseOneOptionContent,
  ChooseMultipleOptionsContent,
  ChooseEffectContent,
  ChooseExtraTurnContent,
  ActionPhaseChoiceContent,
  BuyPhaseChoiceContent,
  TreasurePhaseChoiceContent,
  ChooseCardsMessage,
  ChooseOneOptionMessage,
  ChooseMultipleOptionsMessage,
  ChooseEffectMessage,
  ChooseExtraTurnMessage,
  ActionPhaseChoiceMessage,
  TreasurePhaseChoiceMessage,
  MainPlayerNameContent,
  OpponentNamesContent,
  TurnStartContent,
  StatusContent,
  StatusMessage,
  GameResultMessage,
  MechanicsContent,
  MechanicsMessage,
} from '@dominion/web-client-common';
import { MessageHandler } from '@dominion/common';
import { Mechanic } from '../../../common/dist/card/Mechanic';

@Injectable({ providedIn: 'root' })
export class MessageDecoderService {
  private readonly logMessageHandler = new MessageHandler<LogMessage>();
  private readonly mainPlayerNameHandler = new MessageHandler<MainPlayerNameContent>();
  private readonly opponentNamesHandler = new MessageHandler<OpponentNamesContent>();
  private readonly turnStartHandler = new MessageHandler<TurnStartContent>();
  private readonly statisticHandler = new MessageHandler<StatisticContent, 'owner' | 'type'>(['owner', 'type']);
  private readonly cardsHandler = new MessageHandler<CardsContent, 'owner' | 'location'>(['owner', 'location']);
  private readonly cardCountHandler = new MessageHandler<CardCountContent, 'owner' | 'location'>(['owner', 'location']);
  private readonly topCardHandler = new MessageHandler<TopCardContent, 'owner' | 'location'>(['owner', 'location']);
  private readonly sharedCardsHandler = new MessageHandler<SharedCardsContent, 'location'>(['location']);
  private readonly pileMetadataHandler = new MessageHandler<PileMetadata>();
  private readonly statusHandler = new MessageHandler<StatusContent>();
  private readonly chooseCardHandler = new MessageHandler<ChooseCardContent>();
  private readonly chooseCardsHandler = new MessageHandler<ChooseCardsContent>();
  private readonly chooseOneOptionHandler = new MessageHandler<ChooseOneOptionContent>();
  private readonly chooseMultipleOptionsHandler = new MessageHandler<ChooseMultipleOptionsContent>();
  private readonly chooseEffectHandler = new MessageHandler<ChooseEffectContent>();
  private readonly chooseExtraTurnHandler = new MessageHandler<ChooseExtraTurnContent>();
  private readonly actionPhaseChoiceHandler = new MessageHandler<ActionPhaseChoiceContent>();
  private readonly treasurePhaseChoiceHandler = new MessageHandler<TreasurePhaseChoiceContent>();
  private readonly buyPhaseChoiceHandler = new MessageHandler<BuyPhaseChoiceContent>();
  private readonly gameResultHandler = new MessageHandler<GameResult>();
  private readonly mechanicsHandler = new MessageHandler<MechanicsContent>();

  connect(ws: WebSocket): void {
    ws.onmessage = (evt) => {
      try {
        const message: Message = JSON.parse(evt.data as string) as Message;
        this.processMessage(message);
      } catch (e) {
        console.error('Failed to decode WebSocket message', e);
      }
    };
  }

  /** Replay raw JSON strings that were buffered before the decoder was attached.
   *  Call after ngAfterViewInit so all child-component subscriptions are live. */
  public replayMessages(rawMessages: string[]): void {
    for (const raw of rawMessages) {
      try {
        const message: Message = JSON.parse(raw) as Message;
        this.processMessage(message);
      } catch (e) {
        console.error('Failed to replay buffered WebSocket message', e);
      }
    }
  }

  public subscribeToLogMessage(callback: (logMessage: LogMessage) => void): void {
    this.logMessageHandler.subscribe({}, callback);
  }

  public subscribeToMainPlayerName(callback: (mainPlayerNameContent: { name: string }) => void): void {
    this.mainPlayerNameHandler.subscribe({}, callback);
  }

  public subscribeToOpponentNames(callback: (opponentNamesContent: { names: string[] }) => void): void {
    this.opponentNamesHandler.subscribe({}, callback);
  }

  public subscribeToTurnStart(callback: (turnStartContent: { playerName: string }) => void): void {
    this.turnStartHandler.subscribe({}, callback);
  }

  public subscribeToStatisticUpdate(
    key: { owner: string; type: NumberType },
    callback: (statisticContent: { value: number }) => void,
  ): void {
    this.statisticHandler.subscribe(key, callback);
  }

  public subscribeToCardsUpdate(
    key: { owner: string; location: CardLocation },
    callback: (cardsUpdateContent: { cards: CardMetadata[] }) => void,
  ): void {
    this.cardsHandler.subscribe(key, callback);
  }

  public subscribeToCardCountUpdate(
    key: { owner: string; location: CardLocation },
    callback: (cardCountContent: { count: number }) => void,
  ): void {
    this.cardCountHandler.subscribe(key, callback);
  }

  public subscribeToTopCardUpdate(
    key: { owner: string; location: CardLocation },
    callback: (topCardContent: { topCard: CardMetadata | undefined }) => void,
  ): void {
    this.topCardHandler.subscribe(key, callback);
  }

  public subscribeToSharedCardsUpdate(
    key: { location: CardLocation },
    callback: (sharedCardsContent: { cards: CardMetadata[] }) => void,
  ): void {
    this.sharedCardsHandler.subscribe(key, callback);
  }

  public subscribeToPileMetadata(callback: (metadata: PileMetadata) => void): void {
    this.pileMetadataHandler.subscribe({}, callback);
  }

  public subscribeToStatus(callback: (statusContent: { status: string; action: StatusAction }) => void): void {
    this.statusHandler.subscribe({}, callback);
  }

  public subscribeToChooseCardMessage(
    callback: (chooseCardContent: {
      prompt: string;
      selectionType: CardSelectionPurpose;
      cardChoices: CardChoice[];
      noneChoice?: NoneChoice;
    }) => void,
  ): void {
    this.chooseCardHandler.subscribe({}, callback);
  }

  public subscribeToChooseCardsMessage(
    callback: (chooseCardsContent: {
      prompt: string;
      selectionType: CardSelectionPurpose;
      numSelectedEligibility: number[];
      cardChoices: CardChoice[];
    }) => void,
  ): void {
    this.chooseCardsHandler.subscribe({}, callback);
  }

  public subscribeToChooseOneOptionMessage(
    callback: (chooseOneOptionContent: { prompt: string; namedChoices: NamedChoice[] }) => void,
  ): void {
    this.chooseOneOptionHandler.subscribe({}, callback);
  }

  public subscribeToChooseMultipleOptionsMessage(
    callback: (chooseMultipleOptionsContent: {
      prompt: string;
      namedChoices: NamedChoice[];
      numToSelect: number;
    }) => void,
  ): void {
    this.chooseMultipleOptionsHandler.subscribe({}, callback);
  }

  public subscribeToChooseEffectMessage(
    callback: (chooseEffectContent: {
      extraMessage: string;
      optionalEffects: EffectChoice[];
      mandatoryEffects: EffectChoice[];
    }) => void,
  ): void {
    this.chooseEffectHandler.subscribe({}, callback);
  }

  public subscribeToChooseExtraTurnMessage(callback: (extraTurnContent: { choices: ExtraTurnChoice[] }) => void): void {
    this.chooseExtraTurnHandler.subscribe({}, callback);
  }

  public subscribeToActionPhaseChoiceMessage(
    callback: (actionPhaseChoiceContent: { cardChoices: CardChoice[] }) => void,
  ): void {
    this.actionPhaseChoiceHandler.subscribe({}, callback);
  }

  public subscribeToTreasurePhaseChoiceMessage(
    callback: (treasurePhaseChoiceContent: {
      cardChoices: CardChoice[];
      simpleTreasuresChoice?: SimpleTreasuresChoice;
    }) => void,
  ): void {
    this.treasurePhaseChoiceHandler.subscribe({}, callback);
  }

  public subscribeToBuyPhaseChoiceMessage(
    callback: (buyPhaseChoiceContent: { cardChoices: CardChoice[] }) => void,
  ): void {
    this.buyPhaseChoiceHandler.subscribe({}, callback);
  }

  public subscribeToGameResult(callback: (result: GameResult) => void): void {
    this.gameResultHandler.subscribe({}, callback);
  }

  public subscribeToMechanics(callback: (mechanicsContent: { mechanics: Mechanic[] }) => void): void {
    this.mechanicsHandler.subscribe({}, callback);
  }

  public clearCachedGameResult(): void {
    this.gameResultHandler.clearMostRecentValues();
  }

  private processMessage(message: Message): void {
    console.log(message);
    switch (message.type) {
      case MessageType.LOG: {
        const logMessage: LogWSMessage = message as LogWSMessage;
        this.logMessageHandler.handleMessage(logMessage.content);
        break;
      }
      case MessageType.PLAYER_NAME: {
        const mainPlayerMessage: MainPlayerMessage = message as MainPlayerMessage;
        this.mainPlayerNameHandler.handleMessage(mainPlayerMessage.content);
        break;
      }
      case MessageType.OPPONENT_NAME: {
        const opponentNamesMessage: OpponentNamesMessage = message as OpponentNamesMessage;
        this.opponentNamesHandler.handleMessage(opponentNamesMessage.content);
        break;
      }
      case MessageType.TURN_START: {
        const turnStartMessage: TurnStartMessage = message as TurnStartMessage;
        this.turnStartHandler.handleMessage(turnStartMessage.content);
        break;
      }
      case MessageType.STATISTIC: {
        const statisticMessage: StatisticMessage = message as StatisticMessage;
        this.statisticHandler.handleMessage(statisticMessage.content);
        break;
      }
      case MessageType.CARDS: {
        const cardsMessage: CardsMessage = message as CardsMessage;
        this.cardsHandler.handleMessage(cardsMessage.content);
        break;
      }
      case MessageType.CARD_COUNT: {
        const cardCountMessage: CardCountMessage = message as CardCountMessage;
        this.cardCountHandler.handleMessage(cardCountMessage.content);
        break;
      }
      case MessageType.TOP_CARD: {
        const topCardMessage: TopCardMessage = message as TopCardMessage;
        this.topCardHandler.handleMessage(topCardMessage.content);
        break;
      }
      case MessageType.SHARED_CARDS: {
        const sharedCardsMessage: SharedCardsMessage = message as SharedCardsMessage;
        this.sharedCardsHandler.handleMessage(sharedCardsMessage.content);
        break;
      }
      case MessageType.PILE_METADATA: {
        const pileMetadataMessage: PileMetadataMessage = message as PileMetadataMessage;
        this.pileMetadataHandler.handleMessage(pileMetadataMessage.content);
        break;
      }
      case MessageType.STATUS: {
        const statusMessage: StatusMessage = message as StatusMessage;
        this.statusHandler.handleMessage(statusMessage.content);
        break;
      }
      case MessageType.CHOOSE_CARD: {
        const chooseCardMessage: ChooseCardMessage = message as ChooseCardMessage;
        this.chooseCardHandler.handleMessage(chooseCardMessage.content);
        break;
      }
      case MessageType.CHOOSE_CARDS: {
        const chooseCardsMessage: ChooseCardsMessage = message as ChooseCardsMessage;
        this.chooseCardsHandler.handleMessage(chooseCardsMessage.content);
        break;
      }
      case MessageType.CHOOSE_ONE_OPTION: {
        const chooseOneOptionMessage: ChooseOneOptionMessage = message as ChooseOneOptionMessage;
        this.chooseOneOptionHandler.handleMessage(chooseOneOptionMessage.content);
        break;
      }
      case MessageType.CHOOSE_MULTIPLE_OPTIONS: {
        const chooseMultipleOptionsMessage: ChooseMultipleOptionsMessage = message as ChooseMultipleOptionsMessage;
        this.chooseMultipleOptionsHandler.handleMessage(chooseMultipleOptionsMessage.content);
        break;
      }
      case MessageType.CHOOSE_EFFECT: {
        const chooseEffectMessage: ChooseEffectMessage = message as ChooseEffectMessage;
        this.chooseEffectHandler.handleMessage(chooseEffectMessage.content);
        break;
      }
      case MessageType.CHOOSE_EXTRA_TURN: {
        const chooseExtraTurnMessage: ChooseExtraTurnMessage = message as ChooseExtraTurnMessage;
        this.chooseExtraTurnHandler.handleMessage(chooseExtraTurnMessage.content);
        break;
      }
      case MessageType.ACTION_PHASE_CHOICE: {
        const actionPhaseChoiceMessage: ActionPhaseChoiceMessage = message as ActionPhaseChoiceMessage;
        this.actionPhaseChoiceHandler.handleMessage(actionPhaseChoiceMessage.content);
        break;
      }
      case MessageType.TREASURE_PHASE_CHOICE: {
        const treasurePhaseChoiceMessage: TreasurePhaseChoiceMessage = message as TreasurePhaseChoiceMessage;
        this.treasurePhaseChoiceHandler.handleMessage(treasurePhaseChoiceMessage.content);
        break;
      }
      case MessageType.BUY_PHASE_CHOICE: {
        const buyPhaseChoiceMessage: ActionPhaseChoiceMessage = message as ActionPhaseChoiceMessage;
        this.buyPhaseChoiceHandler.handleMessage(buyPhaseChoiceMessage.content);
        break;
      }
      case MessageType.GAME_RESULT: {
        const gameResultMessage: GameResultMessage = message as GameResultMessage;
        this.gameResultHandler.handleMessage(gameResultMessage.content);
        break;
      }
      case MessageType.MECHANICS: {
        const mechanicsMessage: MechanicsMessage = message as MechanicsMessage;
        this.mechanicsHandler.handleMessage(mechanicsMessage.content);
        break;
      }
    }
  }
}
