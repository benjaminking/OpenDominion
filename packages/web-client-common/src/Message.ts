import {
  CardChoice,
  CardLocation,
  CardMetadata,
  CardSelectionPurpose,
  Choice,
  EffectChoice,
  ExtraTurnChoice,
  GameConfiguration,
  GameResult,
  LogMessage,
  NamedChoice,
  NoneChoice,
  NumberType,
  PileMetadata,
  SimpleTreasuresChoice,
  StatusAction,
} from '@dominion/common';

import { MessageType } from './MessageType';

export interface Message {
  type: MessageType;
}

export interface LogWSMessage extends Message {
  type: MessageType.LOG;
  content: LogMessage;
}

export interface MainPlayerNameContent {
  name: string;
}

export interface MainPlayerMessage extends Message {
  type: MessageType.PLAYER_NAME;
  content: MainPlayerNameContent;
}

export interface OpponentNamesContent {
  names: string[];
}

export interface OpponentNamesMessage extends Message {
  type: MessageType.OPPONENT_NAME;
  content: OpponentNamesContent;
}

export interface GameConfigurationMessage {
  type: MessageType.GAME_CONFIGURATION;
  content: GameConfiguration;
}

export interface TurnStartContent {
  playerName: string;
}

export interface TurnStartMessage extends Message {
  type: MessageType.TURN_START;
  content: TurnStartContent;
}

export interface StatisticContent {
  owner: string;
  type: NumberType;
  value: number;
}

export interface StatisticMessage extends Message {
  type: MessageType.STATISTIC;
  content: StatisticContent;
}

export interface CardsContent {
  owner: string;
  location: CardLocation;
  cards: CardMetadata[];
}

export interface CardsMessage extends Message {
  type: MessageType.CARDS;
  content: CardsContent;
}

export interface CardCountContent {
  owner: string;
  location: CardLocation;
  count: number;
}

export interface CardCountMessage extends Message {
  type: MessageType.CARD_COUNT;
  content: CardCountContent;
}

export interface TopCardContent {
  owner: string;
  location: CardLocation;
  topCard: CardMetadata;
}

export interface TopCardMessage extends Message {
  type: MessageType.TOP_CARD;
  content: TopCardContent;
}

export interface SharedCardsContent {
  location: CardLocation;
  cards: CardMetadata[];
}

export interface SharedCardsMessage extends Message {
  type: MessageType.SHARED_CARDS;
  content: SharedCardsContent;
}

export interface PileMetadataMessage extends Message {
  type: MessageType.PILE_METADATA;
  content: PileMetadata;
}

export interface StatusContent {
  status: string;
  action: StatusAction;
}

export interface StatusMessage extends Message {
  type: MessageType.STATUS;
  content: StatusContent;
}

export interface ChooseCardContent {
  prompt: string;
  selectionType: CardSelectionPurpose;
  decisionName: string;
  cardChoices: CardChoice[];
  noneChoice: NoneChoice;
}

export interface ChooseCardMessage extends Message {
  type: MessageType.CHOOSE_CARD;
  content: ChooseCardContent;
}

export interface ChooseCardsContent {
  prompt: string;
  selectionType: CardSelectionPurpose;
  decisionName: string;
  numSelectedEligibility: number[];
  cardChoices: CardChoice[];
}

export interface ChooseCardsMessage extends Message {
  type: MessageType.CHOOSE_CARDS;
  content: ChooseCardsContent;
}

export interface ChooseOneOptionContent {
  prompt: string;
  decisionName: string;
  namedChoices: NamedChoice[];
}

export interface ChooseOneOptionMessage extends Message {
  type: MessageType.CHOOSE_ONE_OPTION;
  content: ChooseOneOptionContent;
}

export interface ChooseMultipleOptionsContent {
  prompt: string;
  decisionName: string;
  namedChoices: NamedChoice[];
  numToSelect: number;
}

export interface ChooseMultipleOptionsMessage extends Message {
  type: MessageType.CHOOSE_MULTIPLE_OPTIONS;
  content: ChooseMultipleOptionsContent;
}

export interface ChooseEffectContent {
  extraMessage: string;
  optionalEffects: EffectChoice[];
  mandatoryEffects: EffectChoice[];
}

export interface ChooseEffectMessage extends Message {
  type: MessageType.CHOOSE_EFFECT;
  content: ChooseEffectContent;
}

export interface ChooseExtraTurnContent {
  choices: ExtraTurnChoice[];
}

export interface ChooseExtraTurnMessage extends Message {
  type: MessageType.CHOOSE_EXTRA_TURN;
  content: ChooseExtraTurnContent;
}

export interface ActionPhaseChoiceContent {
  cardChoices: CardChoice[];
}

export interface ActionPhaseChoiceMessage extends Message {
  type: MessageType.ACTION_PHASE_CHOICE;
  content: ActionPhaseChoiceContent;
}

export interface TreasurePhaseChoiceContent {
  cardChoices: CardChoice[];
  simpleTreasuresChoice?: SimpleTreasuresChoice;
}

export interface TreasurePhaseChoiceMessage extends Message {
  type: MessageType.TREASURE_PHASE_CHOICE;
  content: TreasurePhaseChoiceContent;
}

export interface BuyPhaseChoiceContent {
  cardChoices: CardChoice[];
}

export interface BuyPhaseChoiceMessage extends Message {
  type: MessageType.BUY_PHASE_CHOICE;
  content: BuyPhaseChoiceContent;
}

export interface ResolvedChoiceMessage extends Message {
  type: MessageType.RESOLVED_CHOICE;
  content: Choice;
}

export interface ChatContent {
  username: string;
  text: string;
  timestamp: number;
}

export interface ChatMessage extends Message {
  type: MessageType.CHAT;
  content: ChatContent;
}

export interface DmReceiveContent {
  senderUserId: string;
  senderUsername: string;
  text: string;
  timestamp: number;
}

export type GameResultContent = GameResult;

export interface GameResultMessage extends Message {
  type: MessageType.GAME_RESULT;
  content: GameResultContent;
}

export interface DmMessage extends Message {
  type: MessageType.DM;
  content: DmReceiveContent;
}
