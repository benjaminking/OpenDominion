import { CardLocation, NumberType, StatusAction } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { PrivacyType } from '../../src/card/PrivacyType';
import { GameMessageBroadcaster } from '../../src/messaging/GameMessageBroadcaster';
import { PlayerNameStatus } from '../../src/messaging/Status';
import { Player } from '../../src/players/Player';

const createClient = () => ({
  sendBotCardCounts: vi.fn(),
  sendBotCoins: vi.fn(),
  sendCardCountUpdate: vi.fn(),
  sendCardsUpdate: vi.fn(),
  sendGameConfiguration: vi.fn(),
  sendMainPlayerName: vi.fn(),
  sendOpponentNames: vi.fn(),
  sendPileMetadata: vi.fn(),
  sendSharedCardsUpdate: vi.fn(),
  sendStatisticUpdate: vi.fn(),
  sendStatus: vi.fn(),
  sendTopCardUpdate: vi.fn(),
  sendTurnStartMessage: vi.fn(),
});

const createPlayer = (name: string, isBot = false) => {
  const client = createClient();
  return {
    getClient: vi.fn(() => client),
    getName: vi.fn(() => name),
    isBotPlayer: vi.fn(() => isBot),
  } as unknown as Player;
};

const createCardMetadata = (name: string, id: string) => ({
  cost: { coins: 0, debt: 0, potions: 0 },
  id,
  location: CardLocation.HAND,
  name,
  types: [],
});

describe('GameMessageBroadcaster', () => {
  it('sends each player their own name and opponents in turn order', () => {
    const alice = createPlayer('Alice');
    const bob = createPlayer('Bob');
    const cara = createPlayer('Cara');
    const broadcaster = new GameMessageBroadcaster();

    broadcaster.updateWithPlayers([alice, bob, cara]);
    broadcaster.sendPlayerNames();

    expect(alice.getClient().sendMainPlayerName).toHaveBeenCalledWith('Alice');
    expect(alice.getClient().sendOpponentNames).toHaveBeenCalledWith(['Bob', 'Cara']);
    expect(bob.getClient().sendMainPlayerName).toHaveBeenCalledWith('Bob');
    expect(bob.getClient().sendOpponentNames).toHaveBeenCalledWith(['Cara', 'Alice']);
    expect(cara.getClient().sendMainPlayerName).toHaveBeenCalledWith('Cara');
    expect(cara.getClient().sendOpponentNames).toHaveBeenCalledWith(['Alice', 'Bob']);
  });

  it('pauses and resumes fan-out broadcasts', () => {
    const alice = createPlayer('Alice');
    const bob = createPlayer('Bob');
    const broadcaster = new GameMessageBroadcaster();

    broadcaster.updateWithPlayers([alice, bob]);
    broadcaster.pauseBroadcasting();
    broadcaster.sendTurnStartMessage(alice);

    expect(alice.getClient().sendTurnStartMessage).not.toHaveBeenCalled();
    expect(bob.getClient().sendTurnStartMessage).not.toHaveBeenCalled();

    broadcaster.resumeBroadcasting();
    broadcaster.sendTurnStartMessage(alice);

    expect(alice.getClient().sendTurnStartMessage).toHaveBeenCalledWith('Alice');
    expect(bob.getClient().sendTurnStartMessage).toHaveBeenCalledWith('Alice');
  });

  it('routes player card updates according to privacy rules for owners and non-owners', () => {
    const owner = createPlayer('Alice');
    const opponent = createPlayer('Bob');
    const broadcaster = new GameMessageBroadcaster();
    const visibleCards = [createCardMetadata('Village', 'village-id')];
    const topCard = {
      getMetadata: vi.fn(() => visibleCards[0]),
    };
    const cards = {
      getTopCard: vi.fn(() => topCard),
      size: vi.fn(() => visibleCards.length),
      toCardMetadataArray: vi.fn(() => visibleCards),
    } as never;

    broadcaster.updateWithPlayers([owner, opponent]);

    broadcaster.updatePlayerCards(owner, CardLocation.HAND, PrivacyType.SIZE_VISIBLE_TO_OPPONENTS, cards);
    expect(owner.getClient().sendCardsUpdate).toHaveBeenCalledWith('Alice', CardLocation.HAND, visibleCards);
    expect(opponent.getClient().sendCardCountUpdate).toHaveBeenCalledWith('Alice', CardLocation.HAND, 1);

    broadcaster.updatePlayerCards(owner, CardLocation.DECK, PrivacyType.TOP_CARD_VISIBLE_TO_ALL, cards);
    expect(owner.getClient().sendTopCardUpdate).toHaveBeenCalledWith('Alice', CardLocation.DECK, visibleCards[0]);
    expect(opponent.getClient().sendTopCardUpdate).toHaveBeenCalledWith('Alice', CardLocation.DECK, visibleCards[0]);

    broadcaster.updatePlayerCards(owner, CardLocation.REVEAL_LIMBO, PrivacyType.ALL_VISIBLE, cards);
    expect(owner.getClient().sendCardsUpdate).toHaveBeenCalledWith('Alice', CardLocation.REVEAL_LIMBO, visibleCards);
    expect(opponent.getClient().sendCardsUpdate).toHaveBeenCalledWith('Alice', CardLocation.REVEAL_LIMBO, visibleCards);
  });

  it('fans out shared-card, statistic, pile, configuration, and status updates', () => {
    const alice = createPlayer('Alice');
    const bob = createPlayer('Bob');
    const broadcaster = new GameMessageBroadcaster();
    const sharedCards = {
      toCardMetadataArray: vi.fn(() => [createCardMetadata('Curse', 'curse-id')]),
    } as never;
    const configuration = { seed: 'abc' } as never;
    const pileMetadata = { name: 'Village', size: 10 } as never;
    const status = {
      renderForPlayer: vi.fn((player: Player) => `waiting:${player.getName()}`),
    } as unknown as PlayerNameStatus;

    broadcaster.updateWithPlayers([alice, bob]);
    broadcaster.updateSharedCards(CardLocation.REVEAL_LIMBO, PrivacyType.ALL_VISIBLE, sharedCards);
    broadcaster.sendGameConfiguration(configuration);
    broadcaster.updateStatistic(alice, NumberType.BUYS, 2);
    broadcaster.sendPileMetadata(pileMetadata);
    broadcaster.sendStatus(status, StatusAction.PUSH);

    expect(alice.getClient().sendSharedCardsUpdate).toHaveBeenCalledWith(CardLocation.REVEAL_LIMBO, [
      createCardMetadata('Curse', 'curse-id'),
    ]);
    expect(bob.getClient().sendSharedCardsUpdate).toHaveBeenCalledWith(CardLocation.REVEAL_LIMBO, [
      createCardMetadata('Curse', 'curse-id'),
    ]);
    expect(alice.getClient().sendGameConfiguration).toHaveBeenCalledWith(configuration);
    expect(bob.getClient().sendGameConfiguration).toHaveBeenCalledWith(configuration);
    expect(alice.getClient().sendStatisticUpdate).toHaveBeenCalledWith('Alice', NumberType.BUYS, 2);
    expect(bob.getClient().sendStatisticUpdate).toHaveBeenCalledWith('Alice', NumberType.BUYS, 2);
    expect(alice.getClient().sendPileMetadata).toHaveBeenCalledWith(pileMetadata);
    expect(bob.getClient().sendPileMetadata).toHaveBeenCalledWith(pileMetadata);
    expect(alice.getClient().sendStatus).toHaveBeenCalledWith('waiting:Alice', StatusAction.PUSH);
    expect(bob.getClient().sendStatus).toHaveBeenCalledWith('waiting:Bob', StatusAction.PUSH);
  });

  it('only sends bot-specific updates to bot players', () => {
    const human = createPlayer('Alice', false);
    const bot = createPlayer('Bot', true);
    const broadcaster = new GameMessageBroadcaster();
    const cardCounts = [{ card: createCardMetadata('Copper', 'copper-id'), count: 7 }] as never;

    broadcaster.updateWithPlayers([human, bot]);
    broadcaster.updateBotCoins(5);
    broadcaster.updateBotCardCounts(cardCounts);

    expect(human.getClient().sendBotCoins).not.toHaveBeenCalled();
    expect(human.getClient().sendBotCardCounts).not.toHaveBeenCalled();
    expect(bot.getClient().sendBotCoins).toHaveBeenCalledWith(5);
    expect(bot.getClient().sendBotCardCounts).toHaveBeenCalledWith(cardCounts);
  });
});
