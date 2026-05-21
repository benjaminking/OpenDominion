import {
  CardLocation,
  CardType,
  ChoiceType,
  NumberType,
  type CardMetadata,
  type GameConfiguration,
} from '@dominion/common';
import { MessageType } from '@dominion/web-client-common';
import { describe, expect, it, vi } from 'vitest';

import { MessageDecoderService } from '../src/app/message-decoder.service';

function createCard(name: string, id: string): CardMetadata {
  return {
    name,
    id,
    location: CardLocation.HAND,
    types: [CardType.ACTION],
    cost: { coins: 3 },
  };
}

function createGameConfiguration(): GameConfiguration {
  return {
    usingBoons: false,
    usingCoffers: true,
    usingDebtTokens: false,
    usingExile: true,
    usingFavors: false,
    usingIslandMat: false,
    usingHexes: false,
    usingJourneyTokens: true,
    usingLoot: false,
    usingNativeVillageMat: false,
    usingPlatinumAndColony: true,
    usingPotions: false,
    usingRuins: true,
    usingShelters: false,
    usingSpoils: true,
    usingVillagers: false,
    usingVPTokens: true,
  };
}

function dispatchMessage(ws: WebSocket, message: object): void {
  ws.onmessage?.({ data: JSON.stringify(message) } as MessageEvent);
}

describe('MessageDecoderService', () => {
  it('routes incoming player name messages to subscribers', () => {
    const service = new MessageDecoderService();
    const callback = vi.fn();
    const ws = {} as WebSocket;

    service.subscribeToMainPlayerName(callback);
    service.connect(ws);

    dispatchMessage(ws, {
      type: MessageType.PLAYER_NAME,
      content: { name: 'Alice' },
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ name: 'Alice' });
  });

  it('replays the latest keyed update to later subscribers with the index fields removed', () => {
    const service = new MessageDecoderService();
    const callback = vi.fn();
    const ws = {} as WebSocket;

    service.connect(ws);

    dispatchMessage(ws, {
      type: MessageType.STATISTIC,
      content: {
        owner: 'Alice',
        type: NumberType.ACTIONS,
        value: 3,
      },
    });

    service.subscribeToStatisticUpdate({ owner: 'Alice', type: NumberType.ACTIONS }, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ value: 3 });
  });

  it('only notifies card-count subscribers whose keys match the message', () => {
    const service = new MessageDecoderService();
    const matchingCallback = vi.fn();
    const nonMatchingCallback = vi.fn();
    const ws = {} as WebSocket;

    service.subscribeToCardCountUpdate({ owner: 'Alice', location: CardLocation.HAND }, matchingCallback);
    service.subscribeToCardCountUpdate({ owner: 'Bob', location: CardLocation.HAND }, nonMatchingCallback);
    service.connect(ws);

    dispatchMessage(ws, {
      type: MessageType.CARD_COUNT,
      content: {
        owner: 'Alice',
        location: CardLocation.HAND,
        count: 5,
      },
    });

    expect(matchingCallback).toHaveBeenCalledTimes(1);
    expect(matchingCallback).toHaveBeenCalledWith({ count: 5 });
    expect(nonMatchingCallback).not.toHaveBeenCalled();
  });

  it('replays the latest cards, top-card, and game-configuration updates to later subscribers', () => {
    const service = new MessageDecoderService();
    const ws = {} as WebSocket;
    const silver = createCard('Silver', 'silver-1');
    const configuration = createGameConfiguration();
    let latestCards: CardMetadata[] | undefined;
    let latestTopCard: CardMetadata | undefined;
    let latestConfiguration: GameConfiguration | undefined;

    service.connect(ws);

    dispatchMessage(ws, {
      type: MessageType.CARDS,
      content: {
        owner: 'Alice',
        location: CardLocation.HAND,
        cards: [silver],
      },
    });
    dispatchMessage(ws, {
      type: MessageType.TOP_CARD,
      content: {
        owner: 'Alice',
        location: CardLocation.DISCARD,
        topCard: silver,
      },
    });
    dispatchMessage(ws, {
      type: MessageType.GAME_CONFIGURATION,
      content: configuration,
    });

    service.subscribeToCardsUpdate({ owner: 'Alice', location: CardLocation.HAND }, ({ cards }) => {
      latestCards = cards;
    });
    service.subscribeToTopCardUpdate({ owner: 'Alice', location: CardLocation.DISCARD }, ({ topCard }) => {
      latestTopCard = topCard;
    });
    service.subscribeToGameConfiguration((gameConfiguration) => {
      latestConfiguration = gameConfiguration;
    });

    expect(latestCards).toEqual([silver]);
    expect(latestTopCard).toEqual(silver);
    expect(latestConfiguration).toEqual(configuration);
  });

  it('routes status, choose-effect, and extra-turn messages to their subscribers', () => {
    const service = new MessageDecoderService();
    const ws = {} as WebSocket;
    const mission = createCard('Mission', 'mission-1');
    let latestStatus:
      | {
          status: string;
          action: string;
        }
      | undefined;
    let latestEffect:
      | {
          extraMessage: string;
          optionalEffects: { type: ChoiceType.Effect; effectName: string; effectId: string }[];
          mandatoryEffects: { type: ChoiceType.Effect; effectName: string; effectId: string }[];
        }
      | undefined;
    let latestExtraTurn:
      | {
          choices: { type: ChoiceType.ExtraTurn; card: CardMetadata; name: string }[];
        }
      | undefined;

    service.subscribeToStatus((content) => {
      latestStatus = content;
    });
    service.subscribeToChooseEffectMessage((content) => {
      latestEffect = content;
    });
    service.subscribeToChooseExtraTurnMessage((content) => {
      latestExtraTurn = content;
    });
    service.connect(ws);

    dispatchMessage(ws, {
      type: MessageType.STATUS,
      content: {
        status: 'Choose a card',
        action: 'PUSH',
      },
    });
    dispatchMessage(ws, {
      type: MessageType.CHOOSE_EFFECT,
      content: {
        extraMessage: 'Resolve an effect',
        optionalEffects: [{ type: ChoiceType.Effect, effectName: 'Trash a card', effectId: 'effect-1' }],
        mandatoryEffects: [],
      },
    });
    dispatchMessage(ws, {
      type: MessageType.CHOOSE_EXTRA_TURN,
      content: {
        choices: [{ type: ChoiceType.ExtraTurn, card: mission, name: 'Mission' }],
      },
    });

    expect(latestStatus).toEqual({ status: 'Choose a card', action: 'PUSH' });
    expect(latestEffect).toEqual({
      extraMessage: 'Resolve an effect',
      optionalEffects: [{ type: ChoiceType.Effect, effectName: 'Trash a card', effectId: 'effect-1' }],
      mandatoryEffects: [],
    });
    expect(latestExtraTurn).toEqual({
      choices: [{ type: ChoiceType.ExtraTurn, card: mission, name: 'Mission' }],
    });
  });

  it('routes remaining message variants to their corresponding subscribers', () => {
    const service = new MessageDecoderService();
    const ws = {} as WebSocket;
    const silver = createCard('Silver', 'silver-1');
    let latestOpponentNames: string[] | undefined;
    let latestTurnStart: string | undefined;
    let latestLogText: string | undefined;
    let latestChooseCardPrompt: string | undefined;
    let latestChooseCardsPrompt: string | undefined;
    let latestChooseOnePrompt: string | undefined;
    let latestChooseMultiplePrompt: string | undefined;
    let latestActionChoicesCount: number | undefined;
    let latestTreasureChoicesCount: number | undefined;
    let latestBuyChoicesCount: number | undefined;
    let latestSharedCardsCount: number | undefined;
    let latestPileName: string | undefined;

    service.subscribeToOpponentNames((content) => {
      latestOpponentNames = content.names;
    });
    service.subscribeToTurnStart((content) => {
      latestTurnStart = content.playerName;
    });
    service.subscribeToLogMessage((content) => {
      latestLogText = content.text;
    });
    service.subscribeToChooseCardMessage((content) => {
      latestChooseCardPrompt = content.prompt;
    });
    service.subscribeToChooseCardsMessage((content) => {
      latestChooseCardsPrompt = content.prompt;
    });
    service.subscribeToChooseOneOptionMessage((content) => {
      latestChooseOnePrompt = content.prompt;
    });
    service.subscribeToChooseMultipleOptionsMessage((content) => {
      latestChooseMultiplePrompt = content.prompt;
    });
    service.subscribeToActionPhaseChoiceMessage((content) => {
      latestActionChoicesCount = content.cardChoices.length;
    });
    service.subscribeToTreasurePhaseChoiceMessage((content) => {
      latestTreasureChoicesCount = content.cardChoices.length;
    });
    service.subscribeToBuyPhaseChoiceMessage((content) => {
      latestBuyChoicesCount = content.cardChoices.length;
    });
    service.subscribeToSharedCardsUpdate({ location: CardLocation.TRASH }, (content) => {
      latestSharedCardsCount = content.cards.length;
    });
    service.subscribeToPileMetadata((content) => {
      latestPileName = content.name;
    });
    service.connect(ws);

    dispatchMessage(ws, {
      type: MessageType.OPPONENT_NAME,
      content: { names: ['Bob', 'Carol'] },
    });
    dispatchMessage(ws, {
      type: MessageType.TURN_START,
      content: { playerName: 'Bob' },
    });
    dispatchMessage(ws, {
      type: MessageType.LOG,
      content: {
        orderIndex: 5,
        playerName: 'Alice',
        text: 'Alice gains Silver',
        knownCards: [silver],
        numUnknownCards: 0,
        type: 'NORMAL',
      },
    });
    dispatchMessage(ws, {
      type: MessageType.CHOOSE_CARD,
      content: {
        prompt: 'Choose a card',
        selectionType: 'gain',
        cardChoices: [{ type: ChoiceType.Card, card: silver }],
      },
    });
    dispatchMessage(ws, {
      type: MessageType.CHOOSE_CARDS,
      content: {
        prompt: 'Choose cards',
        selectionType: 'gain',
        numSelectedEligibility: [1],
        cardChoices: [{ type: ChoiceType.Card, card: silver }],
      },
    });
    dispatchMessage(ws, {
      type: MessageType.CHOOSE_ONE_OPTION,
      content: {
        prompt: 'Choose one',
        namedChoices: [{ type: ChoiceType.ChooseOne, name: 'Gold' }],
      },
    });
    dispatchMessage(ws, {
      type: MessageType.CHOOSE_MULTIPLE_OPTIONS,
      content: {
        prompt: 'Choose multiple',
        namedChoices: [{ type: ChoiceType.ChooseOne, name: 'Gold' }],
        numToSelect: 1,
      },
    });
    dispatchMessage(ws, {
      type: MessageType.ACTION_PHASE_CHOICE,
      content: {
        cardChoices: [{ type: ChoiceType.Card, card: silver }],
      },
    });
    dispatchMessage(ws, {
      type: MessageType.TREASURE_PHASE_CHOICE,
      content: {
        cardChoices: [{ type: ChoiceType.Card, card: silver }],
      },
    });
    dispatchMessage(ws, {
      type: MessageType.BUY_PHASE_CHOICE,
      content: {
        cardChoices: [{ type: ChoiceType.Card, card: silver }],
      },
    });
    dispatchMessage(ws, {
      type: MessageType.SHARED_CARDS,
      content: {
        location: CardLocation.TRASH,
        cards: [silver],
      },
    });
    dispatchMessage(ws, {
      type: MessageType.PILE_METADATA,
      content: {
        name: 'Silver',
        size: 40,
        cost: { coins: 3 },
        topCard: silver,
        types: [CardType.TREASURE],
        categories: ['Supply', 'Basic treasure'],
      },
    });

    expect(latestOpponentNames).toEqual(['Bob', 'Carol']);
    expect(latestTurnStart).toBe('Bob');
    expect(latestLogText).toBe('Alice gains Silver');
    expect(latestChooseCardPrompt).toBe('Choose a card');
    expect(latestChooseCardsPrompt).toBe('Choose cards');
    expect(latestChooseOnePrompt).toBe('Choose one');
    expect(latestChooseMultiplePrompt).toBe('Choose multiple');
    expect(latestActionChoicesCount).toBe(1);
    expect(latestTreasureChoicesCount).toBe(1);
    expect(latestBuyChoicesCount).toBe(1);
    expect(latestSharedCardsCount).toBe(1);
    expect(latestPileName).toBe('Silver');
  });

  it('logs malformed websocket payloads instead of throwing', () => {
    const service = new MessageDecoderService();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ws = {} as WebSocket;

    service.connect(ws);

    expect(() => {
      ws.onmessage?.({ data: '{not valid json' } as MessageEvent);
    }).not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to decode WebSocket message', expect.any(SyntaxError));

    consoleErrorSpy.mockRestore();
  });
});
