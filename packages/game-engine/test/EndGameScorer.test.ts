import { GameOutcome, ScoreReport } from '@dominion/common';
import { describe, expect, it } from 'vitest';

import { EndGameScorer } from '../src/EndGameScorer';

function createScore(total: number): ScoreReport {
  return {
    total,
    elements: [],
  };
}

describe('EndGameScorer', () => {
  it('marks the sole highest score as a win and others as losses', () => {
    const scorer = new EndGameScorer();

    scorer.addPlayerScoreReport('Alice', createScore(36), 18);
    scorer.addPlayerScoreReport('Bob', createScore(29), 18);
    scorer.addPlayerScoreReport('Cara', createScore(10), 18);

    const byName = new Map(scorer.getGameResult().playerResults.map((r) => [r.playerName, r]));

    expect(byName.get('Alice')?.outcome).toBe(GameOutcome.WIN);
    expect(byName.get('Bob')?.outcome).toBe(GameOutcome.LOSS);
    expect(byName.get('Cara')?.outcome).toBe(GameOutcome.LOSS);
    expect(byName.get('Alice')?.turns).toBe(18);
  });

  it('marks tied players as ties when both score and turns are tied', () => {
    const fullTieScorer = new EndGameScorer();
    fullTieScorer.addPlayerScoreReport('Alice', createScore(33), 20);
    fullTieScorer.addPlayerScoreReport('Bob', createScore(33), 20);
    fullTieScorer.addPlayerScoreReport('Cara', createScore(25), 20);

    const fullTieByName = new Map(fullTieScorer.getGameResult().playerResults.map((r) => [r.playerName, r]));

    expect(fullTieByName.get('Alice')?.outcome).toBe(GameOutcome.TIE);
    expect(fullTieByName.get('Bob')?.outcome).toBe(GameOutcome.TIE);
    expect(fullTieByName.get('Cara')?.outcome).toBe(GameOutcome.LOSS);
  });

  it('breaks score ties using the fewest turns among top scorers', () => {
    const scorer = new EndGameScorer();

    scorer.addPlayerScoreReport('Alice', createScore(30), 17);
    scorer.addPlayerScoreReport('Bob', createScore(30), 19);
    scorer.addPlayerScoreReport('Cara', createScore(28), 12);

    const byName = new Map(scorer.getGameResult().playerResults.map((r) => [r.playerName, r]));

    expect(byName.get('Alice')?.outcome).toBe(GameOutcome.WIN);
    expect(byName.get('Bob')?.outcome).toBe(GameOutcome.LOSS);
    expect(byName.get('Cara')?.outcome).toBe(GameOutcome.LOSS);
  });
});
