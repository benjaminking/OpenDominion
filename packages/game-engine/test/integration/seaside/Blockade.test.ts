import { CardLocation } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { coppers, offered, offeredEffects, resolveEffects } from './seasideHelpers';

describe('Blockade', () => {
  it('sets the gained card aside and puts it into hand at the start of the next turn', async () => {
    const game = createGame({ kingdom: ['Blockade'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    const gain = game.expectDecision('chooseCard', 'Alice');
    expect(offered(gain)).toContain('Silver');
    expect(offered(gain)).not.toContain('Duchy');
    await game.chooseCard('Silver');
    expect(game.alice.setAside).toEqual(['Silver']);
    expect(game.alice.discard).toEqual([]);
    await game.endTurn();

    expect(game.alice.setAside).toEqual(['Silver']);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toContain('Silver');
    expect(game.alice.setAside).toEqual([]);
  });

  it('stays in play until the clean-up of the turn the set-aside card returns', async () => {
    const game = createGame({ kingdom: ['Blockade'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Blockade']);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual(['Blockade']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Blockade');
  });

  it('gives a Curse to another player who gains a copy of the set-aside card on their own turn', async () => {
    const game = createGame({ kingdom: ['Blockade'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.endTurn();

    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Silver', 'Curse']));
  });

  it('does not curse anyone when its owner gains another copy of the set-aside card', async () => {
    const game = createGame({ kingdom: ['Blockade'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.playAllTreasures();
    await game.buy('Silver');

    expect(game.alice.discard).toContain('Silver');
    expect(game.bob.discard).not.toContain('Curse');
    expect(game.alice.discard).not.toContain('Curse');
  });

  it('sets aside a card for each play and returns both when played twice by Throne Room', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Throne Room', 'Village'] });
    game.alice.setHand(['Throne Room', 'Blockade', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Blockade');
    await game.chooseCard('Silver');
    await game.chooseCard('Village');
    expect(game.alice.setAside).toEqual(['Silver', 'Village']);
    await game.endTurn();
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(expect.arrayContaining(['Silver', 'Village']));
    expect(game.alice.setAside).toEqual([]);
  });

  it('works when played by Golem, which is discarded while the Blockade stays in play', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Golem', 'Village'] });
    game.alice.setHand(['Golem', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Blockade', 'Village', ...coppers(20)]);
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Golem');
    await game.chooseCard('Village');
    await game.chooseCard('Silver');
    expect(game.alice.setAside).toEqual(['Silver']);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Blockade']);
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Silver', 'Curse']));

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toContain('Silver');
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('works when played from the Supply by Band of Misfits, which stays in play until the card returns', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Band Of Misfits'] });
    game.alice.setHand(['Band Of Misfits', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Band Of Misfits');
    await game.chooseCard('Blockade');
    await game.chooseCard('Silver');
    expect(game.alice.setAside).toEqual(['Silver']);
    expect(game.pileSize('Blockade')).toBe(10);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Silver', 'Curse']));

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toContain('Silver');
    expect(game.alice.inPlay).toEqual(['Band Of Misfits']);
    await game.endTurn();
    expect(game.alice.inPlay).toEqual([]);
  });

  it('does not curse a player who revealed Moat to it, but still sets the card aside', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Moat'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Moat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    await game.chooseEffect('Moat');
    await game.chooseCard('Silver');
    expect(game.alice.setAside).toEqual(['Silver']);
    await game.endTurn();

    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.bob.discard).not.toContain('Curse');

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toContain('Silver');
  });

  it('does nothing more when Watchtower trashes the gained card, and is discarded that turn', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Watchtower'] });
    game.alice.setHand(['Blockade', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.alice.log).toContain('Alice has lost track of Silver');
    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.setAside).toEqual([]);
    await game.endTurn();

    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Blockade');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.bob.discard).not.toContain('Curse');
  });

  it('loses track of a gained card that Watchtower puts onto the deck, which stays there', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Watchtower'] });
    game.alice.setHand(['Blockade', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Put it onto your deck');

    expect(game.alice.log).toContain('Alice has lost track of Silver');
    expect(game.alice.deck[0]).toBe('Silver');
    expect(game.alice.setAside).toEqual([]);
    await game.endTurn();

    // Blockade has nothing left to do, so it is discarded, and the Silver is drawn from the deck
    expect(game.alice.inPlay).toEqual([]);
    expect(game.alice.discard).toContain('Blockade');
    expect(game.alice.hand).toContain('Silver');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.bob.discard).not.toContain('Curse');
  });

  it('can keep track of the card it gains from just before gaining it', async () => {
    const game = createGame({ kingdom: ['Blockade'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(10));

    await game.start();
    const locationExpectation = game.alice.ie.createLocationExpectation(CardLocation.DISCARD);
    const silver = await game.alice.ie.gainCardFromPile('Silver');

    expect(game.alice.discard).toEqual(['Silver']);
    expect(locationExpectation.isMet(silver!)).toBe(true);
  });

  it("does not curse a player who gains a copy of the set-aside card on another player's turn", async () => {
    const game = createGame({ kingdom: ['Blockade', 'Jester', 'Village'] });
    game.alice.setHand(['Village', 'Blockade', 'Jester', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(['Silver', ...coppers(10)]);

    await game.start();
    await game.playAction('Village');
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.playAction('Jester');
    await game.chooseOption('Bob gains a copy');

    expect(game.bob.discard).toEqual(['Silver', 'Silver']);
    expect(game.pileSize('Curse')).toBe(10);
  });

  it('curses a player who gains a copy of the set-aside card with Smugglers', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Smugglers'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Smugglers', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.endTurn();

    await game.playAction('Smugglers');
    expect(offered(game.expectDecision('chooseCard', 'Bob'))).toEqual(['Silver']);
    await game.chooseCard('Silver');
    expect(game.bob.discard).toEqual(['Silver', 'Curse']);
  });

  it('curses each other player who gains a copy on their own turn in a 3-player game', async () => {
    const game = createGame({ kingdom: ['Blockade'], players: ['Alice', 'Bob', 'Cara'] });
    const cara = game.player('Cara');
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    cara.setHand(coppers(5));
    cara.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.endTurn();

    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Silver', 'Curse']));

    expect(game.currentPlayerName).toBe('Cara');
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(cara.discard).toEqual(expect.arrayContaining(['Silver', 'Curse']));
    expect(game.pileSize('Curse')).toBe(18);
  });

  it('makes a player who gains a Curse on their turn gain all the Curses when the set-aside card is a Curse', async () => {
    const game = createGame({ kingdom: ['Blockade'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Curse');
    expect(game.alice.setAside).toEqual(['Curse']);
    await game.endTurn();

    await game.buy('Curse');

    expect(game.pileSize('Curse')).toBe(0);
    expect(game.bob.discard.filter((name) => name === 'Curse')).toHaveLength(9);
  });

  it('counts the set-aside card for scoring when gaining it ends the game', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Village', 'Smithy'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));
    game.setPileSize('Village', 0);
    game.setPileSize('Smithy', 0);
    game.setPileSize('Estate', 1);

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Estate');
    expect(game.pileSize('Estate')).toBe(0);
    expect(game.alice.setAside).toEqual(['Estate']);
    await game.endTurn();

    expect(game.isFinished).toBe(true);
    expect(game.alice.score).toBe(1);
  });

  it('gives two Curses for one gain when played twice by Throne Room setting aside two copies of the same card', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Throne Room'] });
    game.alice.setHand(['Throne Room', 'Blockade', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Throne Room');
    await game.chooseCard('Blockade');
    await game.chooseCard('Silver');
    await game.chooseCard('Silver');
    expect(game.alice.setAside).toEqual(['Silver', 'Silver']);
    await game.endTurn();

    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.bob.discard.filter((name) => name === 'Curse')).toHaveLength(2);
  });

  it('returns the card at the start of an Outpost turn, after which gaining a copy no longer curses', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Outpost', 'Village'] });
    game.alice.setHand(['Village', 'Blockade', 'Outpost', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(coppers(5));
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Village');
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.playAction('Outpost');
    await game.endTurn();
    await game.chooseExtraTurn('Outpost');
    await resolveEffects(game);

    expect(game.currentPlayerName).toBe('Alice');
    expect(game.alice.hand).toEqual(['Copper', 'Copper', 'Copper', 'Silver']);
    expect(game.alice.setAside).toEqual([]);
    await game.endTurn();

    expect(game.currentPlayerName).toBe('Bob');
    expect(game.alice.inPlay).toEqual([]);
    await game.playAllTreasures();
    await game.buy('Silver');
    expect(game.bob.discard).not.toContain('Curse');
  });

  it('can gain Potion ($4) but not a card with a Potion in its cost', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Golem', 'Familiar'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));

    await game.start();
    await game.playAction('Blockade');

    const gain = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(gain).toContain('Potion');
    expect(gain).not.toContain('Golem');
    expect(gain).not.toContain('Familiar');
    await game.chooseCard('Potion');
    expect(game.alice.setAside).toEqual(['Potion']);
  });

  it("can gain a $6 card while two Highways are in play, and other players' gains of it are cursed at its normal cost", async () => {
    const game = createGame({ kingdom: ['Blockade', 'Highway'] });
    game.alice.setHand(['Highway', 'Highway', 'Blockade', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Gold', 'Gold', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Highway');
    await game.playAction('Highway');
    await game.playAction('Blockade');
    const gain = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(gain).toContain('Gold');
    expect(gain).not.toContain('Province');
    await game.chooseCard('Gold');
    expect(game.alice.setAside).toEqual(['Gold']);
    await game.endTurn();

    expect(game.costOf('Gold').coins).toBe(6);
    await game.playAllTreasures();
    await game.buy('Gold');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Gold', 'Curse']));
  });

  it('can gain only the top Knight, and gaining a differently named Knight is not gaining a copy', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Knights', 'Bandit Camp'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Gold', 'Silver', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    game.setPile('Knights', ['Sir Martin', 'Dame Anna', 'Sir Martin']);

    await game.start();
    await game.playAction('Blockade');
    // Sir Martin costs $4; Spoils costs $0 but isn't in the Supply
    const gain = offered(game.expectDecision('chooseCard', 'Alice'));
    expect(gain).toContain('Sir Martin');
    expect(gain).not.toContain('Dame Anna');
    expect(gain).not.toContain('Spoils');
    await game.chooseCard('Sir Martin');
    expect(game.alice.setAside).toEqual(['Sir Martin']);
    await game.endTurn();

    await game.playAllTreasures();
    await game.buy('Dame Anna');
    expect(game.bob.discard).toContain('Dame Anna');
    expect(game.bob.discard).not.toContain('Curse');
  });

  it('curses a player who gains a Ruins with the same name as the set-aside one, but not a different Ruins', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Marauder', 'Market'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Market', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    game.setPile('Ruins', ['Ruined Village', 'Ruined Village', 'Survivors']);

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Ruined Village');
    expect(game.alice.setAside).toEqual(['Ruined Village']);
    await game.endTurn();

    await game.playAction('Market');
    await game.buy('Ruined Village');
    expect(game.bob.discard).toEqual(expect.arrayContaining(['Ruined Village', 'Curse']));
    await game.buy('Survivors');

    expect(game.bob.discard.filter((name) => name === 'Curse')).toHaveLength(1);
    expect(game.bob.discard).toContain('Survivors');
  });

  it('still curses a player who trashes the gained copy with Watchtower first, who can then trash the Curse too', async () => {
    const game = createGame({ kingdom: ['Blockade', 'Watchtower'] });
    game.alice.setHand(['Blockade', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(20));
    game.bob.setHand(['Watchtower', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));

    await game.start();
    await game.playAction('Blockade');
    await game.chooseCard('Silver');
    await game.endTurn();

    await game.endActionPhase();
    await game.playAllTreasures();
    await game.buy('Silver');
    const onGain = game.expectDecision('chooseFromMultipleEvents', 'Bob');
    expect([...offeredEffects(onGain)].sort()).toEqual(['Blockade', 'Watchtower']);
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    // Bob still gained a copy, so the Curse comes (the only effect left resolves by itself); Watchtower can trash it
    expect(game.trash).toEqual(['Silver']);
    expect(game.bob.discard).toContain('Curse');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');

    expect(game.trash).toEqual(['Silver', 'Curse']);
    expect(game.pileSize('Curse')).toBe(9);
    expect(game.bob.discard).not.toContain('Curse');
  });
});
