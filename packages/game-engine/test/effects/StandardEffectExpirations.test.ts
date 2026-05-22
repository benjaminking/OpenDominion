import { describe, expect, it } from 'vitest';

import {
  EndOfPlayersNextTurnEffectExpiration,
  NoEffectExpiration,
  OnceThisTurnEffectExpiration,
  RestOfTurnEffectExpiration,
  StartOfPlayersNextTurnEffectExpiration,
} from '../../src/effects/StandardEffectExpirations';
import { Player } from '../../src/players/Player';
import { Turn } from '../../src/turns/Turn';

const createPlayer = (name: string): Player =>
  ({
    getName: () => name,
  }) as Player;

describe('StandardEffectExpirations', () => {
  it('expires once-this-turn effects after use or after the owning turn ends', () => {
    const alice = createPlayer('Alice');
    const bob = createPlayer('Bob');
    const currentTurn = new Turn(alice, 1, 1);
    const expiration = new OnceThisTurnEffectExpiration(currentTurn);

    expect(expiration.hasExpired()).toBe(false);

    expiration.registerEndOfPlayersTurn(bob, currentTurn);
    expect(expiration.hasExpired()).toBe(false);

    expiration.registerUse();
    expect(expiration.hasExpired()).toBe(true);

    const freshExpiration = new OnceThisTurnEffectExpiration(currentTurn);
    freshExpiration.registerEndOfPlayersTurn(alice, currentTurn);
    expect(freshExpiration.hasExpired()).toBe(true);
  });

  it('expires rest-of-turn effects only after the current owners turn ends', () => {
    const alice = createPlayer('Alice');
    const bob = createPlayer('Bob');
    const currentTurn = new Turn(alice, 1, 1);
    const expiration = new RestOfTurnEffectExpiration(currentTurn);

    expect(expiration.hasExpired()).toBe(false);

    expiration.registerEndOfPlayersTurn(bob, currentTurn);
    expect(expiration.hasExpired()).toBe(false);

    expiration.registerEndOfPlayersTurn(alice, currentTurn);
    expect(expiration.hasExpired()).toBe(true);
  });

  it('expires start-of-players-next-turn effects when that players next unofficial turn begins', () => {
    const alice = createPlayer('Alice');
    const bob = createPlayer('Bob');
    const currentTurn = new Turn(alice, 1, 1);
    const expiration = new StartOfPlayersNextTurnEffectExpiration(alice, currentTurn);

    expect(expiration.hasExpired()).toBe(false);

    expiration.registerStartOfPlayersTurn(bob, new Turn(bob, 1, 2));
    expect(expiration.hasExpired()).toBe(false);

    expiration.registerStartOfPlayersTurn(alice, new Turn(alice, 1, 1));
    expect(expiration.hasExpired()).toBe(false);

    expiration.registerStartOfPlayersTurn(alice, new Turn(alice, 2, 2));
    expect(expiration.hasExpired()).toBe(true);
  });

  it('expires end-of-players-next-turn effects when that players next unofficial turn ends', () => {
    const alice = createPlayer('Alice');
    const bob = createPlayer('Bob');
    const currentTurn = new Turn(alice, 1, 1);
    const expiration = new EndOfPlayersNextTurnEffectExpiration(alice, currentTurn);

    expect(expiration.hasExpired()).toBe(false);

    expiration.registerEndOfPlayersTurn(bob, new Turn(bob, 1, 2));
    expect(expiration.hasExpired()).toBe(false);

    expiration.registerEndOfPlayersTurn(alice, new Turn(alice, 1, 1));
    expect(expiration.hasExpired()).toBe(false);

    expiration.registerEndOfPlayersTurn(alice, new Turn(alice, 2, 2));
    expect(expiration.hasExpired()).toBe(true);
  });

  it('never expires no-effect expirations', () => {
    expect(new NoEffectExpiration().hasExpired()).toBe(false);
  });
});
