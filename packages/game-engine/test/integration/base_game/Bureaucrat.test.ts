import { describe, expect, it } from 'vitest';

import { createGame } from '../gameHarness';
import { offered } from './baseGameHelpers';

const coppers = (n: number): string[] => Array<string>(n).fill('Copper');

describe('Bureaucrat', () => {
  it('makes each target put a Victory card of their choice onto their deck, or reveal a hand without one', async () => {
    const game = createGame({ kingdom: ['Bureaucrat', 'Gardens'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(['Bureaucrat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Duchy', 'Gardens', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold']);
    const cara = game.player('Cara');
    cara.setHand(['Copper', 'Silver', 'Village']);

    await game.start();
    await game.playAction('Bureaucrat');
    expect(game.alice.deck[0]).toBe('Silver');

    // Only Victory cards are offered, and choosing one is mandatory
    const decision = game.expectDecision('chooseCard', 'Bob');
    expect(decision.cardChoices.map((choice) => choice.card.name).sort()).toEqual(['Duchy', 'Estate', 'Gardens']);
    expect(decision.noneAllowed).toBe(false);
    await game.chooseCard('Duchy');

    // Cara has no Victory card: she reveals her hand without being asked anything
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.deck).toEqual(['Duchy', 'Gold']);
    expect(game.bob.hand).toEqual(['Estate', 'Gardens', 'Copper', 'Silver']);
    expect(cara.hand).toEqual(['Copper', 'Silver', 'Village']);
    expect(game.alice.log).toContain('Cara reveals Copper, Silver, Village');
  });

  it('puts the Victory card on an empty deck, making it the only card there', async () => {
    const game = createGame({ kingdom: ['Bureaucrat'] });
    game.alice.setHand(['Bureaucrat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Estate', 'Copper', 'Copper']);
    game.bob.setDiscard(['Gold', 'Gold']);

    await game.start();
    await game.playAction('Bureaucrat');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseCard('Estate');
    }

    expect(game.bob.deck).toEqual(['Estate']);
    expect(game.bob.discard).toEqual(['Gold', 'Gold']);
  });

  it('still attacks when the Silver pile is empty', async () => {
    const game = createGame({ kingdom: ['Bureaucrat'] });
    game.alice.setHand(['Bureaucrat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', 'Copper', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setHand(['Estate', 'Copper', 'Copper']);
    game.setPileSize('Silver', 0);

    await game.start();
    await game.playAction('Bureaucrat');
    if (game.pending.kind === 'chooseCard') {
      await game.chooseCard('Estate');
    }

    expect(game.alice.deck[0]).toBe('Gold');
    expect(game.bob.deck).toEqual(['Estate']);
  });

  it('lets a target choose a Victory card that is also another type (Nobles, Tunnel)', async () => {
    const game = createGame({ kingdom: ['Bureaucrat', 'Nobles', 'Tunnel'] });
    game.alice.setHand(['Bureaucrat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Nobles', 'Tunnel', 'Copper', 'Copper', 'Silver']);
    game.bob.setDeck(['Gold']);

    await game.start();
    await game.playAction('Bureaucrat');
    const decision = game.expectDecision('chooseCard', 'Bob');
    expect(offered(decision).sort()).toEqual(['Nobles', 'Tunnel']);
    await game.chooseCard('Tunnel');

    // Putting Tunnel onto the deck isn't discarding it, so Tunnel's reaction isn't offered
    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.deck).toEqual(['Tunnel', 'Gold']);
    expect(game.bob.discard).toEqual([]);
  });

  it('reveals nothing and asks nothing of a target with an empty hand', async () => {
    const game = createGame({ kingdom: ['Bureaucrat'] });
    game.alice.setHand(['Bureaucrat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand([]);
    game.bob.setDeck(['Estate']);

    await game.start();
    await game.playAction('Bureaucrat');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.deck).toEqual(['Estate']);
    expect(game.alice.log.filter((line) => line.startsWith('Bob reveals'))).toEqual([]);
  });

  it('gains the Silver onto the deck, where the attacker may trash it with Watchtower', async () => {
    const game = createGame({ kingdom: ['Bureaucrat', 'Watchtower'] });
    game.alice.setHand(['Bureaucrat', 'Watchtower', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(['Gold', ...coppers(10)]);
    game.bob.setHand(['Estate', 'Copper', 'Copper']);

    await game.start();
    await game.playAction('Bureaucrat');
    await game.chooseEffect('Watchtower');
    await game.chooseOption('Trash it');
    // The attack still happens after the gain
    await game.chooseCard('Estate');

    expect(game.trash).toEqual(['Silver']);
    expect(game.alice.deck[0]).toBe('Gold');
    expect(game.bob.deck).toEqual(['Estate']);
  });

  it('attacks the other players in turn order from the attacker, on a later player turn', async () => {
    const game = createGame({ kingdom: ['Bureaucrat'], players: ['Alice', 'Bob', 'Cara'] });
    game.alice.setHand(coppers(5));
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Bureaucrat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.bob.setDeck(coppers(10));
    const cara = game.player('Cara');
    cara.setHand(['Estate', 'Duchy', 'Copper']);

    await game.start();
    await game.endTurn();
    expect(game.currentPlayerName).toBe('Bob');
    // Alice's new hand: 5 Coppers and no Victory card; Cara is attacked first, then Alice
    await game.playAction('Bureaucrat');
    game.expectDecision('chooseCard', 'Cara');
    await game.chooseCard('Duchy');

    game.expectDecision('treasurePhase', 'Bob');
    expect(cara.deck).toEqual(['Duchy']);
    const reveals = game.bob.log.filter((line) => line.startsWith('Alice reveals') || line.startsWith('Cara reveals'));
    expect(reveals).toEqual(['Cara reveals Duchy', 'Alice reveals Copper, Copper, Copper, Copper, Copper']);
  });

  it('offers every Victory card whatever its other types, but not Hovel or Curse, with 4 players', async () => {
    const game = createGame({
      kingdom: ['Bureaucrat', 'Mill', 'Farm', 'Knights'],
      players: ['Alice', 'Bob', 'Cara', 'Dave'],
      useShelters: true,
    });
    game.alice.setHand(['Bureaucrat', 'Copper', 'Copper', 'Copper', 'Copper']);
    game.alice.setDeck(coppers(10));
    game.bob.setHand(['Mill', 'Farm', 'Dame Josephine', 'Overgrown Estate', 'Copper']);
    // Hovel is a Reaction-Shelter and Necropolis an Action-Shelter: neither is a Victory card
    const cara = game.player('Cara');
    cara.setHand(['Hovel', 'Necropolis', 'Curse', 'Copper']);
    const dave = game.player('Dave');
    dave.setHand(['Farm', 'Silver']);

    await game.start();
    await game.playAction('Bureaucrat');
    const decision = game.expectDecision('chooseCard', 'Bob');
    expect(offered(decision).sort()).toEqual(['Dame Josephine', 'Farm', 'Mill', 'Overgrown Estate']);
    await game.chooseCard('Dame Josephine');
    // Cara reveals her hand without being asked; Dave must put his Farm back
    expect(offered(game.expectDecision('chooseCard', 'Dave'))).toEqual(['Farm']);
    await game.chooseCard('Farm');

    game.expectDecision('treasurePhase', 'Alice');
    expect(game.bob.deck).toEqual(['Dame Josephine']);
    expect(cara.hand).toEqual(['Hovel', 'Necropolis', 'Curse', 'Copper']);
    expect(cara.deck).toEqual([]);
    expect(game.alice.log).toContain('Cara reveals Hovel, Necropolis, Curse, Copper');
    expect(dave.deck).toEqual(['Farm']);
    expect(dave.hand).toEqual(['Silver']);
  });
});
