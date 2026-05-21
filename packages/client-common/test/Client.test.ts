import {
  CardLocation,
  CardType,
  ChoiceType,
  DecisionService,
  GameConfiguration,
  GameMessageTransmitter,
  NamedChoice,
  NumberType,
  StatusAction,
} from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Client } from '../src/Client';
import { createCardMetadata } from './TestFixtures';

describe('Client', () => {
  it('exposes bot identity and decision service', async () => {
    const selectedOption = {
      type: ChoiceType.ChooseOne,
      name: 'Village',
    } as NamedChoice;
    const decisionService = {
      chooseOneOption: vi.fn((_prompt: string, _decisionName: string, _namedChoices: NamedChoice[]) =>
        Promise.resolve(selectedOption),
      ),
    } as unknown as DecisionService;
    const logMessageTransmitter = {
      sendLogMessage: vi.fn(),
    };
    const gameMessageTransmitter = {
      sendMainPlayerName: vi.fn(),
      sendOpponentNames: vi.fn(),
      sendGameConfiguration: vi.fn(),
      sendTurnStartMessage: vi.fn(),
      sendStatisticUpdate: vi.fn(),
      sendCardsUpdate: vi.fn(),
      sendCardCountUpdate: vi.fn(),
      sendTopCardUpdate: vi.fn(),
      sendSharedCardsUpdate: vi.fn(),
      sendPileMetadata: vi.fn(),
      sendStatus: vi.fn(),
      sendBotCoins: vi.fn(),
      sendBotCardCounts: vi.fn(),
    } as unknown as GameMessageTransmitter;

    const client = new Client(decisionService, logMessageTransmitter, gameMessageTransmitter, true);

    expect(client.isBotClient()).toBe(true);
    expect(client.getDecisionService()).toBe(decisionService);

    await expect(client.getDecisionService().chooseOneOption('', '', [])).resolves.toEqual(selectedOption);
  });

  it('forwards all message calls to the configured transmitters', () => {
    const decisionService = {
      chooseOneOption: vi.fn((_prompt: string, _decisionName: string, _namedChoices: NamedChoice[]) =>
        Promise.resolve({ type: ChoiceType.ChooseOne, name: 'Village' } as NamedChoice),
      ),
    } as unknown as DecisionService;
    const logMessageTransmitter = {
      sendLogMessage: vi.fn(),
    };
    const gameMessageTransmitter = {
      sendMainPlayerName: vi.fn(),
      sendOpponentNames: vi.fn(),
      sendGameConfiguration: vi.fn(),
      sendTurnStartMessage: vi.fn(),
      sendStatisticUpdate: vi.fn(),
      sendCardsUpdate: vi.fn(),
      sendCardCountUpdate: vi.fn(),
      sendTopCardUpdate: vi.fn(),
      sendSharedCardsUpdate: vi.fn(),
      sendPileMetadata: vi.fn(),
      sendStatus: vi.fn(),
      sendBotCoins: vi.fn(),
      sendBotCardCounts: vi.fn(),
    } as unknown as GameMessageTransmitter;

    const client = new Client(decisionService, logMessageTransmitter, gameMessageTransmitter);
    const handCards = [createCardMetadata('Village', { coins: 3, types: [CardType.ACTION] })];
    const pileMetadata = {
      name: 'Village',
      size: 10,
      categories: [],
      cost: { coins: 3, debt: 0, potions: 0 },
      topCard: handCards[0],
      types: [CardType.ACTION],
    };
    const configuration = { randomizerSeed: 'abc' } as unknown as GameConfiguration;

    client.sendLogMessage({ message: 'hello' } as never);
    client.sendMainPlayerName('Alice');
    client.sendOpponentNames(['Bob']);
    client.sendGameConfiguration(configuration);
    client.sendTurnStartMessage('Alice');
    client.sendStatisticUpdate('Alice', NumberType.BUYS, 2);
    client.sendCardsUpdate('Alice', CardLocation.HAND, handCards);
    client.sendCardCountUpdate('Alice', CardLocation.DECK, 5);
    client.sendTopCardUpdate('Alice', CardLocation.DISCARD, handCards[0]);
    client.sendSharedCardsUpdate(CardLocation.TRASH, handCards);
    client.sendPileMetadata(pileMetadata as never);
    client.sendStatus('waiting');
    client.sendStatus('queued', StatusAction.PUSH);
    client.sendBotCoins(6);
    client.sendBotCardCounts([{ name: 'Copper', count: 7, card: createCardMetadata('Copper') }] as never);

    expect(logMessageTransmitter.sendLogMessage).toHaveBeenCalledWith({ message: 'hello' });
    expect(gameMessageTransmitter.sendMainPlayerName).toHaveBeenCalledWith('Alice');
    expect(gameMessageTransmitter.sendOpponentNames).toHaveBeenCalledWith(['Bob']);
    expect(gameMessageTransmitter.sendGameConfiguration).toHaveBeenCalledWith(configuration);
    expect(gameMessageTransmitter.sendTurnStartMessage).toHaveBeenCalledWith('Alice');
    expect(gameMessageTransmitter.sendStatisticUpdate).toHaveBeenCalledWith('Alice', NumberType.BUYS, 2);
    expect(gameMessageTransmitter.sendCardsUpdate).toHaveBeenCalledWith('Alice', CardLocation.HAND, handCards);
    expect(gameMessageTransmitter.sendCardCountUpdate).toHaveBeenCalledWith('Alice', CardLocation.DECK, 5);
    expect(gameMessageTransmitter.sendTopCardUpdate).toHaveBeenCalledWith('Alice', CardLocation.DISCARD, handCards[0]);
    expect(gameMessageTransmitter.sendSharedCardsUpdate).toHaveBeenCalledWith(CardLocation.TRASH, handCards);
    expect(gameMessageTransmitter.sendPileMetadata).toHaveBeenCalledWith(pileMetadata);
    expect(gameMessageTransmitter.sendStatus).toHaveBeenNthCalledWith(1, 'waiting', StatusAction.REPLACE);
    expect(gameMessageTransmitter.sendStatus).toHaveBeenNthCalledWith(2, 'queued', StatusAction.PUSH);
    expect(gameMessageTransmitter.sendBotCoins).toHaveBeenCalledWith(6);
    expect(gameMessageTransmitter.sendBotCardCounts).toHaveBeenCalledTimes(1);
  });
});
