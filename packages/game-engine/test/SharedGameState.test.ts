import { CardCategory, CardInfo, CardLocation, CardType, Expansion } from '@dominion/common';
import { describe, expect, it, vi } from 'vitest';

import { Card } from '../src/card/Card';
import { CardCollection } from '../src/card/CardCollection';
import { Cost } from '../src/card/Cost';
import { CostModifier } from '../src/effects/CostModifier';
import { Effect } from '../src/effects/Effect';
import { EffectSource } from '../src/effects/EffectSource';
import { EffectTriggerType } from '../src/effects/EffectTriggerType';
import { Game } from '../src/Game';
import { SharedGameState } from '../src/game-state/SharedGameState';
import { GameMessageBroadcaster } from '../src/messaging/GameMessageBroadcaster';
import { Pile } from '../src/piles/Pile';
import { AllPlayers } from '../src/players/AllPlayers';
import { Player } from '../src/players/Player';
import { TurnTracker } from '../src/players/TurnTracker';
import { anyCard } from '../src/StandardCardEligibilityFunctions';
import { Turn } from '../src/turns/Turn';
import { TurnPhase } from '../src/turns/TurnPhase';

const createPlayerStub = (
  name: string,
  options?: { score?: number; turnNumber?: number; unofficialTurnNumber?: number },
) => {
  const instructionExecutor = {
    processEffectsByType: vi.fn(async () => undefined),
    gainFromPile: vi.fn(async (_pileName: string): Promise<Card | undefined> => undefined),
  };
  const effects = {
    processEffectsByType: vi.fn(
      async (_trigger: EffectTriggerType, _triggeringPlayer: Player, _cards?: Card | CardCollection) => undefined,
    ),
    clearBlocksForAttackCard: vi.fn(),
    isAttackBlocked: vi.fn(() => false),
    addEffect: vi.fn(),
  };
  const statistics = {
    getTurnNumber: vi.fn(() => options?.turnNumber ?? 1),
    getUnofficialTurnNumber: vi.fn(() => options?.unofficialTurnNumber ?? 1),
    getScore: vi.fn(() => options?.score ?? 0),
    spendCoins: vi.fn(),
    spendPotions: vi.fn(),
    useBuy: vi.fn(),
  };
  const ownedCards = {
    reportCardCosts: vi.fn(),
    getCardByMetadata: vi.fn((_metadata: { id: string }): Card | undefined => undefined),
  };
  const botStatistics = {
    removeCardFromStatistics: vi.fn(),
  };

  const player = {
    getName: vi.fn(() => name),
    getInstructionExecutor: vi.fn(() => instructionExecutor),
    getEffects: vi.fn(() => effects),
    getStatistics: vi.fn(() => statistics),
    getOwnedCards: vi.fn(() => ownedCards),
    getBotStatistics: vi.fn(() => botStatistics),
  } as unknown as Player;

  const turnTracker = new TurnTracker(new Turn(player, options?.turnNumber ?? 1, options?.unofficialTurnNumber ?? 1));
  (player as unknown as { getTurnTracker: () => TurnTracker }).getTurnTracker = () => turnTracker;

  return {
    player,
    instructionExecutor,
    effects,
    statistics,
    ownedCards,
    turnTracker,
  };
};

const createSharedGameState = (playerStubs: ReturnType<typeof createPlayerStub>[]) => {
  const players = playerStubs.map((stub) => stub.player);
  const playersCollection = new AllPlayers(players, {} as Game);

  const game = {
    getMessageBroadcaster: vi.fn(() => ({
      updateSharedCards: vi.fn(),
    })),
    getLogger: vi.fn(() => ({
      gameMessage: vi.fn(),
    })),
    getPlayers: vi.fn(() => playersCollection),
    getPlayerIndex: vi.fn((player: unknown) => players.indexOf(player as never)),
  };

  return new SharedGameState(game as never);
};

const createCard = (name: string, id: string, types: CardType[] = [CardType.ACTION], cost: Cost = Cost.Simple(0)) => {
  const cardInfo: CardInfo = {
    category: CardCategory.CARD,
    name,
    text: `${name} text`,
    font_size: 'small',
    cost: cost.toCommonCost(),
    types,
    expansion: Expansion.TESTING,
    mechanics: [],
  };
  const card = new Card(
    { cost: vi.fn(() => cost), registerEffectTrigger: vi.fn() } as unknown as SharedGameState,
    cardInfo,
  );
  card.setId(id);
  return card;
};

// The last card in the array is the top card of the pile.
const createPile = (name: string, cardsBottomToTop: Card[]): Pile => {
  for (const card of cardsBottomToTop) {
    card.setLocation(CardLocation.PILE);
  }
  const broadcaster = { sendPileMetadata: vi.fn() } as unknown as GameMessageBroadcaster;
  return new Pile(name, CardCollection.fromCards(cardsBottomToTop), new Set(), new Set(), broadcaster);
};

const findPlayerNameByInstructionExecutor = (
  playerStubs: ReturnType<typeof createPlayerStub>[],
  instructionExecutor: object,
) => {
  const matchingStub = playerStubs.find((stub) => stub.instructionExecutor === instructionExecutor);
  if (matchingStub === undefined) {
    throw new Error('Instruction executor did not map to a known player stub.');
  }
  return matchingStub.player.getName();
};

describe('SharedGameState', () => {
  it('rotates the current player, reports left-of-current, and builds turn order from the active seat', () => {
    const alice = createPlayerStub('Alice', { score: 5, turnNumber: 2, unofficialTurnNumber: 3 });
    const bob = createPlayerStub('Bob', { score: 8, turnNumber: 4, unofficialTurnNumber: 6 });
    const cara = createPlayerStub('Cara', { score: 3, turnNumber: 1, unofficialTurnNumber: 2 });
    const state = createSharedGameState([alice, bob, cara]);

    expect(state.getCurrentPlayer()).toBe(alice.player);
    expect(state.getPlayerLeftOfCurrent()).toBe(bob.player);

    state.switchCurrentPlayer();

    expect(state.getCurrentPlayer()).toBe(bob.player);
    expect(state.getPlayerLeftOfCurrent()).toBe(cara.player);
    expect(state.getCurrentTurnOrder()).toEqual([bob.player, cara.player, alice.player]);

    state.switchToPlayer(cara.player);

    const turn = state.getCurrentTurn();
    expect(state.getCurrentPlayer()).toBe(cara.player);
    expect(turn.getOwner()).toBe(cara.player);
    expect(turn.getNumber()).toBe(1);
    expect(turn.getUnofficialNumber()).toBe(2);
  });

  it('executes shared callbacks in current turn order and can exclude the current player', async () => {
    const alice = createPlayerStub('Alice');
    const bob = createPlayerStub('Bob');
    const cara = createPlayerStub('Cara');
    const playerStubs = [alice, bob, cara];
    const state = createSharedGameState(playerStubs);
    const allPlayersVisited: string[] = [];
    const otherPlayersVisited: string[] = [];

    state.switchToPlayer(bob.player);

    await state.executeForEachPlayer(async (instructionExecutor) => {
      allPlayersVisited.push(findPlayerNameByInstructionExecutor(playerStubs, instructionExecutor));
    });
    await state.executeForEachOtherPlayer(async (instructionExecutor) => {
      otherPlayersVisited.push(findPlayerNameByInstructionExecutor(playerStubs, instructionExecutor));
    });

    expect(allPlayersVisited).toEqual(['Bob', 'Cara', 'Alice']);
    expect(otherPlayersVisited).toEqual(['Cara', 'Alice']);
  });

  it('looks up scores by player name and defaults missing players to 0', () => {
    const alice = createPlayerStub('Alice', { score: 11 });
    const bob = createPlayerStub('Bob', { score: 7 });
    const state = createSharedGameState([alice, bob]);

    expect(state.getScoreByName('Alice')).toBe(11);
    expect(state.getScoreByName('Missing')).toBe(0);
  });

  it('identifies shared locations and exposes only shared card areas', () => {
    const state = createSharedGameState([createPlayerStub('Alice')]);

    expect(state.isSharedLocation(CardLocation.PILE)).toBe(true);
    expect(state.isSharedLocation(CardLocation.TRASH)).toBe(true);
    expect(state.isSharedLocation(CardLocation.HAND)).toBe(false);

    expect(state.getCardsFromArea(CardLocation.TRASH)).toBe(state.trash);
    expect(state.getCardsFromArea(CardLocation.PILE).isEmpty()).toBe(true);
    expect(() => state.getCardsFromArea(CardLocation.HAND)).toThrow(
      'Trying to get a player-owned card collection from the shared game state',
    );
  });

  it('routes triggered effects to the correct player set based on the registered effect source', async () => {
    const alice = createPlayerStub('Alice');
    const bob = createPlayerStub('Bob');
    const cara = createPlayerStub('Cara');
    const state = createSharedGameState([alice, bob, cara]);
    const cards = new CardCollection();

    await state.triggerEffect(EffectTriggerType.BUY, alice.player, cards);

    expect(alice.effects.processEffectsByType).not.toHaveBeenCalled();
    expect(bob.effects.processEffectsByType).not.toHaveBeenCalled();
    expect(cara.effects.processEffectsByType).not.toHaveBeenCalled();

    state.registerEffectTrigger(EffectTriggerType.BUY, EffectSource.SELF);
    await state.triggerEffect(EffectTriggerType.BUY, alice.player, cards);

    expect(alice.effects.processEffectsByType).toHaveBeenCalledTimes(1);
    expect(alice.effects.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, alice.player, cards);
    expect(bob.effects.processEffectsByType).not.toHaveBeenCalled();
    expect(cara.effects.processEffectsByType).not.toHaveBeenCalled();

    vi.clearAllMocks();

    const otherPlayersOnlyState = createSharedGameState([alice, bob, cara]);
    otherPlayersOnlyState.registerEffectTrigger(EffectTriggerType.BUY, EffectSource.OTHER_PLAYER);
    await otherPlayersOnlyState.triggerEffect(EffectTriggerType.BUY, alice.player, cards);

    expect(alice.effects.processEffectsByType).not.toHaveBeenCalled();
    expect(bob.effects.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, alice.player, cards);
    expect(cara.effects.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, alice.player, cards);

    vi.clearAllMocks();

    const allPlayersState = createSharedGameState([alice, bob, cara]);
    allPlayersState.registerEffectTrigger(EffectTriggerType.BUY, EffectSource.SELF);
    allPlayersState.registerEffectTrigger(EffectTriggerType.BUY, EffectSource.OTHER_PLAYER);
    await allPlayersState.triggerEffect(EffectTriggerType.BUY, alice.player, cards);

    expect(alice.effects.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, alice.player, cards);
    expect(bob.effects.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, alice.player, cards);
    expect(cara.effects.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.BUY, alice.player, cards);
  });

  it('applies added cost modifiers in order using the current turn', () => {
    const alice = createPlayerStub('Alice', { turnNumber: 4, unofficialTurnNumber: 6 });
    const state = createSharedGameState([alice]);
    const card = {
      getOriginalCost: vi.fn(() => Cost.Simple(8)),
      adjustCost: vi.fn((cost: Cost) => cost),
    };
    const firstModifier: Pick<CostModifier, 'apply' | 'getCostRecalculationTriggers'> = {
      apply: vi.fn((receivedCard, receivedCost, receivedTurn) => {
        expect(receivedCard).toBe(card);
        expect(receivedCost.coins).toBe(8);
        expect(receivedTurn.getOwner()).toBe(alice.player);
        expect(receivedTurn.getNumber()).toBe(4);
        expect(receivedTurn.getUnofficialNumber()).toBe(6);
        return receivedCost.plus(-2);
      }),
      getCostRecalculationTriggers: vi.fn(() => []),
    };
    const secondModifier: Pick<CostModifier, 'apply' | 'getCostRecalculationTriggers'> = {
      apply: vi.fn((_receivedCard, receivedCost) => receivedCost.plus(-1)),
      getCostRecalculationTriggers: vi.fn(() => []),
    };

    state.addCostModifier(firstModifier as CostModifier);
    state.addCostModifier(secondModifier as CostModifier);

    const cost = state.cost(card as never);

    expect(firstModifier.apply).toHaveBeenCalledTimes(1);
    expect(secondModifier.apply).toHaveBeenCalledTimes(1);
    expect(card.adjustCost).toHaveBeenCalledTimes(1);
    expect(cost.coins).toBe(5);
  });

  it('tracks the active effect stack in LIFO order and exposes the attack-blocked flag', () => {
    const state = createSharedGameState([createPlayerStub('Alice')]);
    const firstEffect = { id: 'first' } as never;
    const secondEffect = { id: 'second' } as never;

    expect(state.attackWasBlocked).toBe(false);

    state.attackWasBlocked = true;
    state.pushActiveEffectOntoStack(firstEffect);
    state.pushActiveEffectOntoStack(secondEffect);

    expect(state.attackWasBlocked).toBe(true);
    expect(state.popActiveEffectOffOfStack()).toBe(secondEffect);
    expect(state.popActiveEffectOffOfStack()).toBe(firstEffect);
    expect(() => state.popActiveEffectOffOfStack()).toThrow(
      'Tried to pop an effect off the global stack when it was empty.',
    );
  });

  it('clears attack blocks for each player in turn order and only attacks unblocked opponents', async () => {
    const alice = createPlayerStub('Alice');
    const bob = createPlayerStub('Bob');
    const cara = createPlayerStub('Cara');
    const state = createSharedGameState([alice, bob, cara]);
    const attackCard = {
      getId: vi.fn(() => 'militia-id'),
    };
    const clearedPlayers: string[] = [];
    const attackedPlayers: string[] = [];

    bob.effects.clearBlocksForAttackCard.mockImplementation(() => {
      clearedPlayers.push('Bob');
    });
    cara.effects.clearBlocksForAttackCard.mockImplementation(() => {
      clearedPlayers.push('Cara');
    });
    alice.effects.clearBlocksForAttackCard.mockImplementation(() => {
      clearedPlayers.push('Alice');
    });
    bob.effects.isAttackBlocked.mockReturnValue(true);
    cara.effects.isAttackBlocked.mockReturnValue(false);

    state.switchToPlayer(bob.player);
    state.clearBlocksForAttackCard(attackCard as never);
    await state.performAttack(bob.player, attackCard as never, async (attackedPlayer) => {
      attackedPlayers.push(attackedPlayer.getName());
    });

    expect(clearedPlayers).toEqual(['Bob', 'Cara', 'Alice']);
    expect(attackedPlayers).toEqual(['Cara', 'Alice']);
  });

  it('reports the number of players and the player to the left of any player, wrapping around', () => {
    const alice = createPlayerStub('Alice');
    const bob = createPlayerStub('Bob');
    const cara = createPlayerStub('Cara');
    const state = createSharedGameState([alice, bob, cara]);

    expect(state.getNumPlayers()).toBe(3);
    expect(state.getPlayerLeftOfPlayer(alice.player)).toBe(bob.player);
    expect(state.getPlayerLeftOfPlayer(cara.player)).toBe(alice.player);
    expect(state.getCurrentTurnOrder()).toEqual([alice.player, bob.player, cara.player]);
  });

  describe('card movement blocking', () => {
    it('lets cards move until they are blocked and counts nested blocks per card', () => {
      const state = createSharedGameState([createPlayerStub('Alice')]);
      const bandOfMisfits = createCard('Band of Misfits', 'misfits-0');
      const otherCard = createCard('Village', 'village-0');

      expect(state.isCardAbleToMove(bandOfMisfits)).toBe(true);

      state.blockCardFromMoving(bandOfMisfits);
      state.blockCardFromMoving(bandOfMisfits);
      expect(state.isCardAbleToMove(bandOfMisfits)).toBe(false);
      expect(state.isCardAbleToMove(otherCard)).toBe(true);

      state.releaseCardToMoveAgain(bandOfMisfits);
      expect(state.isCardAbleToMove(bandOfMisfits)).toBe(false);

      state.releaseCardToMoveAgain(bandOfMisfits);
      expect(state.isCardAbleToMove(bandOfMisfits)).toBe(true);
    });

    it('tracks blocks by card id rather than by object', () => {
      const state = createSharedGameState([createPlayerStub('Alice')]);
      const card = createCard('Village', 'village-0');
      const sameIdCard = createCard('Village', 'village-0');

      state.blockCardFromMoving(card);

      expect(state.isCardAbleToMove(sameIdCard)).toBe(false);
    });

    it('leaves a card that was never blocked able to move when it is released', () => {
      const state = createSharedGameState([createPlayerStub('Alice')]);
      const card = createCard('Village', 'village-0');

      state.releaseCardToMoveAgain(card);

      expect(state.isCardAbleToMove(card)).toBe(true);
    });
  });

  describe('piles', () => {
    it('checks whether the top card of a pile is a copy of a card or matches a name', () => {
      const state = createSharedGameState([createPlayerStub('Alice')]);
      state.piles.addKingdomPile(createPile('Village', [createCard('Village', 'village-pile-0')]));
      state.piles.addKingdomPile(createPile('Smithy', []));

      expect(state.isCopyOfCardOnTopOfPile('Village', 'Village')).toBe(true);
      expect(state.isCopyOfCardOnTopOfPile(createCard('Village', 'village-elsewhere'), 'Village')).toBe(true);
      expect(state.isCopyOfCardOnTopOfPile(createCard('Smithy', 'smithy-elsewhere'), 'Village')).toBe(false);
      expect(state.isCopyOfCardOnTopOfPile('Smithy', 'Smithy')).toBe(false);
      expect(state.isCopyOfCardOnTopOfPile('Gold', 'Gold')).toBe(false);
    });

    it('checks whether a specific card is anywhere in a pile', () => {
      const state = createSharedGameState([createPlayerStub('Alice')]);
      const coronet = createCard('Coronet', 'coronet-0', [CardType.REWARD]);
      const courser = createCard('Courser', 'courser-0', [CardType.REWARD]);
      state.piles.addNonSupplyPile(createPile('Rewards', [coronet, courser]));

      expect(state.isCardInPile(coronet, 'Rewards')).toBe(true);
      expect(state.isCardInPile(createCard('Coronet', 'coronet-1', [CardType.REWARD]), 'Rewards')).toBe(false);
      expect(state.isCardInPile(coronet, 'Prizes')).toBe(false);
    });
  });

  describe('getCardByMetadata', () => {
    it('finds any reward or prize in its own pile, not just the top card', () => {
      const state = createSharedGameState([createPlayerStub('Alice')]);
      const coronet = createCard('Coronet', 'coronet-0', [CardType.ACTION, CardType.REWARD]);
      const courser = createCard('Courser', 'courser-0', [CardType.ACTION, CardType.REWARD]);
      const bagOfGold = createCard('Bag of Gold', 'bag-0', [CardType.ACTION, CardType.PRIZE]);
      const princess = createCard('Princess', 'princess-0', [CardType.ACTION, CardType.PRIZE]);
      state.piles.addNonSupplyPile(createPile('Rewards', [coronet, courser]));
      state.piles.addNonSupplyPile(createPile('Prizes', [bagOfGold, princess]));

      expect(state.getCardByMetadata(coronet.getMetadata())).toBe(coronet);
      expect(state.getCardByMetadata(bagOfGold.getMetadata())).toBe(bagOfGold);
      expect(state.getCardByMetadata(princess.getMetadata())).toBe(princess);
    });

    it('only finds the top cards of supply piles', () => {
      const state = createSharedGameState([createPlayerStub('Alice')]);
      const bottomVillage = createCard('Village', 'village-pile-0');
      const topVillage = createCard('Village', 'village-pile-1');
      state.piles.addKingdomPile(createPile('Village', [bottomVillage, topVillage]));

      expect(state.getCardByMetadata(topVillage.getMetadata())).toBe(topVillage);
      expect(state.getCardByMetadata(bottomVillage.getMetadata())).toBeUndefined();
    });

    it('looks up trashed cards in the trash and other cards among the current player owned cards', () => {
      const alice = createPlayerStub('Alice');
      const bob = createPlayerStub('Bob');
      const state = createSharedGameState([alice, bob]);
      const trashed = createCard('Estate', 'estate-0', [CardType.VICTORY]);
      state.trash.addCard(trashed);
      trashed.setLocation(CardLocation.TRASH);
      const inHand = createCard('Copper', 'copper-0', [CardType.TREASURE]);
      inHand.setLocation(CardLocation.HAND);
      bob.ownedCards.getCardByMetadata.mockReturnValue(inHand);
      state.switchToPlayer(bob.player);

      expect(state.getCardByMetadata(trashed.getMetadata())).toBe(trashed);
      expect(state.getCardByMetadata(inHand.getMetadata())).toBe(inHand);
      expect(bob.ownedCards.getCardByMetadata).toHaveBeenCalledWith(inHand.getMetadata());
      expect(alice.ownedCards.getCardByMetadata).not.toHaveBeenCalled();
    });
  });

  it('records the turn phase on every player when it changes', () => {
    const alice = createPlayerStub('Alice');
    const bob = createPlayerStub('Bob');
    const state = createSharedGameState([alice, bob]);

    state.setTurnPhase(TurnPhase.BUY);
    alice.turnTracker.addGainedCard(createCard('Gold', 'gold-0', [CardType.TREASURE]));
    bob.turnTracker.addGainedCard(createCard('Curse', 'curse-0', [CardType.CURSE]));

    expect(state.getTurnPhase()).toBe(TurnPhase.BUY);
    expect(alice.turnTracker.numMatchingCardsGainedThisTurnByPhase(anyCard, TurnPhase.BUY)).toBe(1);
    expect(bob.turnTracker.numMatchingCardsGainedThisTurnByPhase(anyCard, TurnPhase.BUY)).toBe(1);
    expect(bob.turnTracker.numMatchingCardsGainedThisTurnByPhase(anyCard, TurnPhase.ACTION)).toBe(0);
  });

  it('copies a global effect to every player and registers its trigger', async () => {
    const alice = createPlayerStub('Alice');
    const bob = createPlayerStub('Bob');
    const state = createSharedGameState([alice, bob]);
    const effect = {
      getTrigger: () => EffectTriggerType.GAIN,
      getSource: () => EffectSource.ANYONE,
    } as unknown as Effect;

    state.addGlobalEffect(effect);
    await state.triggerEffect(EffectTriggerType.GAIN, bob.player);

    expect(alice.effects.addEffect).toHaveBeenCalledWith(effect);
    expect(bob.effects.addEffect).toHaveBeenCalledWith(effect);
    expect(alice.effects.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.GAIN, bob.player, undefined);
    expect(bob.effects.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.GAIN, bob.player, undefined);
  });

  it('trashes cards, updates their location, and passes the trashing player to trash effects', async () => {
    const alice = createPlayerStub('Alice');
    const bob = createPlayerStub('Bob');
    const state = createSharedGameState([alice, bob]);
    const estate = createCard('Estate', 'estate-0', [CardType.VICTORY]);
    const cards = CardCollection.fromCards([estate]);
    state.registerEffectTrigger(EffectTriggerType.TRASH, EffectSource.ANYONE);

    expect(await state.trashCards(bob.player, cards)).toBe(cards);

    expect(state.trash.contains(estate)).toBe(true);
    expect(estate.getLocation()).toBe(CardLocation.TRASH);
    expect(alice.effects.processEffectsByType).toHaveBeenCalledWith(EffectTriggerType.TRASH, bob.player, cards);
  });

  describe('buyFromPile', () => {
    const setUpBuy = (cost: Cost) => {
      const alice = createPlayerStub('Alice');
      const state = createSharedGameState([alice]);
      const card = createCard('Alchemist', 'alchemist-pile-0', [CardType.ACTION], cost);
      const pile = createPile('Alchemist', [card]);
      state.piles.addKingdomPile(pile);
      alice.instructionExecutor.gainFromPile.mockImplementation(async (pileName: string) =>
        state.piles.removeTopCardFromPile(pileName),
      );
      return { alice, state, card, pile };
    };

    it('spends the coins and a buy, then gains the card for the current player', async () => {
      const { alice, state, card, pile } = setUpBuy(Cost.Simple(4));

      expect(await state.buyFromPile('Alchemist')).toBe(card);

      expect(alice.statistics.spendCoins).toHaveBeenCalledWith(4);
      expect(alice.statistics.useBuy).toHaveBeenCalledTimes(1);
      expect(alice.instructionExecutor.gainFromPile).toHaveBeenCalledWith('Alchemist');
      expect(pile.size()).toBe(0);
    });

    it("spends the potion in a card's cost when it is bought", async () => {
      const { alice, state } = setUpBuy(Cost.Potion(3));

      await state.buyFromPile('Alchemist');

      expect(alice.statistics.spendCoins).toHaveBeenCalledWith(3);
      expect(alice.statistics.spendPotions).toHaveBeenCalledWith(1);
    });

    it('records the bought card for the buyer and passes it to buy effects', async () => {
      const { alice, state, card } = setUpBuy(Cost.Simple(4));
      state.registerEffectTrigger(EffectTriggerType.BUY, EffectSource.SELF);
      const addBoughtCardSpy = vi.spyOn(alice.turnTracker, 'addBoughtCard');

      await state.buyFromPile('Alchemist');

      const buyTargets = alice.effects.processEffectsByType.mock.calls
        .filter(([trigger]) => trigger === EffectTriggerType.BUY)
        .map(([, , cards]) => (cards instanceof CardCollection ? cards.asCardArray() : [cards]));
      expect(buyTargets).toEqual([[card]]);
      expect(addBoughtCardSpy).toHaveBeenCalledWith(card);
    });
  });
});
