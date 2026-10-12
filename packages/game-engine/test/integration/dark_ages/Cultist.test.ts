import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame, GameHarness } from '../gameHarness';

const COPPERS = Array<string>(20).fill('Copper');

/** Replaces the Ruins pile with the given cards, listed top card first. */
const setRuinsPile = (game: GameHarness, names: string[]): void => {
  game.setPileSize('Ruins', 0);
  for (const name of [...names].reverse()) {
    const card = game.alice.createCard(name, CardLocation.PILE);
    card.markAsSupplyCard();
    game.state.piles.returnCardToPile(card);
  }
};

describe('Cultist', () => {
  it('gives Ruins to each other player in turn order until the Ruins pile runs out', async () => {
    const game = createGame({ players: ['Alice', 'Bob', 'Cara'], kingdom: ['Cultist'] });
    game.alice.setHand(['Cultist', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    setRuinsPile(game, ['Abandoned Mine']);

    await game.start();
    await game.playAction('Cultist');

    expect(game.alice.hand).toHaveLength(6);
    expect(game.bob.discard).toEqual(['Abandoned Mine']);
    expect(game.player('Cara').discard).toEqual([]);
    expect(game.pileSize('Ruins')).toBe(0);
    game.expectDecision('treasurePhase', 'Alice');
  });

  it('may play another Cultist from hand without using an Action, giving out Ruins again', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Cultist', 'Cultist', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    setRuinsPile(game, ['Abandoned Mine', 'Ruined Village', 'Survivors']);

    await game.start();
    await game.playAction('Cultist');
    game.expectDecision('chooseCard', 'Alice');
    expect(game.pending.noneAllowed).toBe(true);
    await game.chooseCard('Cultist');

    expect(game.alice.inPlay).toEqual(['Cultist', 'Cultist']);
    expect(game.alice.hand).toHaveLength(3 + 2 + 2);
    expect(game.alice.actions).toBe(0);
    expect(game.bob.discard).toEqual(['Abandoned Mine', 'Ruined Village']);
  });

  it('draws 3 cards when trashed by your own card', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Junk Dealer'] });
    game.alice.setHand(['Junk Dealer', 'Cultist', 'Estate', 'Estate', 'Estate']);
    game.alice.setDeck(['Copper', 'Silver', 'Silver', 'Silver', ...COPPERS]);

    await game.start();
    await game.playAction('Junk Dealer');
    await game.chooseCard('Cultist');

    expect(game.trash).toEqual(['Cultist']);
    expect(game.alice.hand).toEqual(['Estate', 'Estate', 'Estate', 'Copper', 'Silver', 'Silver', 'Silver']);
  });

  it("draws 3 cards for its owner when trashed by another player's Knight, not drawing the revealed cards", async () => {
    const game = createGame({ kingdom: ['Cultist', 'Knights'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Cultist', 'Copper', 'Silver', 'Silver', 'Silver', 'Gold']);

    await game.start();
    await game.playAction('Sir Martin');

    expect(game.trash).toEqual(['Cultist']);
    expect(game.bob.hand).toEqual(['Estate', 'Estate', 'Estate', 'Estate', 'Estate', 'Silver', 'Silver', 'Silver']);
    expect(game.bob.discard).toEqual(['Copper']);
    expect(game.bob.deck).toEqual(['Gold']);
    expect(game.currentPlayerName).toBe('Alice');
  });

  it('draws 3 cards for each Cultist trashed at the same time', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Count'] });
    game.alice.setHand(['Count', 'Cultist', 'Cultist', 'Estate', 'Estate']);
    game.alice.setDeck(['Silver', 'Silver', 'Silver', 'Gold', 'Gold', 'Gold', ...COPPERS]);

    await game.start();
    await game.playAction('Count');
    await game.chooseOption('Gain a Copper');
    await game.chooseOption('Trash your hand');

    expect(game.trash).toEqual(['Cultist', 'Cultist', 'Estate', 'Estate']);
    expect(game.alice.hand).toEqual(['Silver', 'Silver', 'Silver', 'Gold', 'Gold', 'Gold']);
  });

  it('reshuffles for its when-trashed draw without the cards revealed to the Knight', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Knights'] });
    game.alice.setHand(['Sir Martin', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Estate', 'Estate', 'Estate', 'Estate', 'Estate']);
    game.bob.setDeck(['Cultist', 'Copper', 'Silver']);
    game.bob.setDiscard(['Gold', 'Gold']);

    await game.start();
    await game.playAction('Sir Martin');

    expect(game.trash).toEqual(['Cultist']);
    expect(game.bob.hand.slice(5).sort()).toEqual(['Gold', 'Gold', 'Silver']);
    expect(game.bob.discard).toEqual(['Copper']);
    expect(game.bob.deck).toEqual([]);
  });
});

describe('Cultist: interactions', () => {
  it('chains three Cultists with one Action, giving out a Ruins for each', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Cultist', 'Cultist', 'Cultist', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    setRuinsPile(game, ['Abandoned Mine', 'Ruined Village', 'Survivors', 'Ruined Market']);

    await game.start();
    await game.playAction('Cultist');
    await game.chooseCard('Cultist');
    await game.chooseCard('Cultist');

    // No Cultist left in hand: no further prompt
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Cultist', 'Cultist', 'Cultist']);
    expect(game.alice.hand).toHaveLength(2 + 6);
    expect(game.alice.actions).toBe(0);
    expect(game.bob.discard).toEqual(['Abandoned Mine', 'Ruined Village', 'Survivors']);
    expect(game.pileCards('Ruins')).toEqual(['Ruined Market']);
  });

  it('a player who reveals Moat gains no Ruins, and the next player gets the top one (3 players)', async () => {
    const game = createGame({ players: ['Alice', 'Bob', 'Cara'], kingdom: ['Cultist', 'Moat'] });
    game.alice.setHand(['Cultist', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    setRuinsPile(game, ['Abandoned Mine', 'Ruined Village']);

    await game.start();
    await game.playAction('Cultist');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Moat');

    expect(game.bob.discard).toEqual([]);
    expect(game.player('Cara').discard).toEqual(['Abandoned Mine']);
    expect(game.pileCards('Ruins')).toEqual(['Ruined Village']);
  });

  it('does not give a Ruins to a player whose Lighthouse is in play', async () => {
    const game = createGame({ players: ['Bob', 'Alice'], kingdom: ['Cultist', 'Lighthouse'] });
    game.bob.setHand(['Lighthouse', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(COPPERS);
    game.alice.setHand(['Cultist', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    const ruins = game.pileSize('Ruins');

    await game.start();
    await game.playAction('Lighthouse');
    await game.endTurn();
    await game.playAction('Cultist');

    expect(game.alice.hand).toHaveLength(6);
    expect(game.pileSize('Ruins')).toBe(ruins);
    expect(game.bob.cards(CardLocation.DISCARD).filter((card) => card.getPileName() === 'Ruins')).toHaveLength(0);
  });

  it('emptying the Ruins pile as the third empty Supply pile ends the game after the turn', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Cultist', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    setRuinsPile(game, ['Survivors']);
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);

    await game.start();
    await game.playAction('Cultist');
    expect(game.bob.discard).toEqual(['Survivors']);
    expect(game.isFinished).toBe(false);
    await game.endTurn();

    expect(game.isFinished).toBe(true);
    expect(game.gameResult).toBeDefined();
  });

  it('a player may reveal Watchtower to trash the Ruins they gain', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Watchtower'] });
    game.alice.setHand(['Cultist', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(COPPERS);
    game.bob.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    setRuinsPile(game, ['Abandoned Mine', 'Ruined Village']);

    await game.start();
    await game.playAction('Cultist');
    game.expectDecision('chooseFromMultipleEvents', 'Bob');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Abandoned Mine']);
    expect(game.bob.discard).toEqual([]);
    expect(game.pileCards('Ruins')).toEqual(['Ruined Village']);
  });

  it('played by a player in the middle of the table gives Ruins starting from their left, wrapping around (4 players)', async () => {
    const game = createGame({ players: ['Alice', 'Bob', 'Cara', 'Dan'], kingdom: ['Cultist'] });
    const cara = game.player('Cara');
    const dan = game.player('Dan');
    for (const player of [game.alice, game.bob, dan]) {
      player.setHand(['Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
      player.setDeck(COPPERS);
    }
    cara.setHand(['Cultist', 'Copper', 'Copper', 'Copper', 'Copper']);
    cara.setDeck(COPPERS);
    setRuinsPile(game, ['Abandoned Mine', 'Ruined Village']);

    await game.start();
    await game.endTurn();
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Cara');
    await game.playAction('Cultist');

    // Dan (Cara's left), then Alice; the pile runs out before Bob
    expect(dan.discard).toEqual(['Abandoned Mine']);
    expect(game.alice.discard.filter((name) => name !== 'Copper')).toEqual(['Ruined Village']);
    expect(game.bob.discard.filter((name) => name !== 'Copper')).toEqual([]);
    expect(game.pileSize('Ruins')).toBe(0);
  });

  it('draws only the 1 card left when the deck and discard pile hold just one card', async () => {
    const game = createGame({ kingdom: ['Cultist'] });
    game.alice.setHand(['Cultist', 'Copper']);
    game.alice.setDeck(['Silver']);

    await game.start();
    await game.playAction('Cultist');

    expect(game.alice.hand).toEqual(['Copper', 'Silver']);
    expect(game.bob.cards(CardLocation.DISCARD).filter((card) => card.getPileName() === 'Ruins')).toHaveLength(1);
  });

  it('played twice by Throne Room: the first play may chain the other Cultist; the second play has none left to play', async () => {
    const game = createGame({ kingdom: ['Cultist', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Cultist', 'Cultist', 'Estate']);
    game.alice.setDeck(['Silver', 'Silver', 'Gold', 'Gold', 'Copper', 'Copper', ...COPPERS]);
    setRuinsPile(game, ['Abandoned Mine', 'Ruined Village', 'Survivors', 'Ruined Market']);

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Cultist');
    // First play of the Throned Cultist: may play the other one
    game.expectDecision('chooseCard', 'Alice');
    await game.chooseCard('Cultist');

    // Second play of the Throned Cultist: no Cultist left in hand
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.alice.inPlay).toEqual(['Throne Room', 'Cultist', 'Cultist']);
    expect(game.alice.hand).toEqual(['Estate', 'Silver', 'Silver', 'Gold', 'Gold', 'Copper', 'Copper']);
    expect(game.bob.discard).toEqual(['Abandoned Mine', 'Ruined Village', 'Survivors']);
    expect(game.alice.actions).toBe(0);
  });
});
