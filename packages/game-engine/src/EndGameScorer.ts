import { GameOutcome, GameResult, PlayerGameResult, ScoreReport } from '@dominion/common';

export class EndGameScorer {
  private scoreByPlayerName: Map<string, ScoreReport> = new Map<string, ScoreReport>();
  private turnsByPlayerName: Map<string, number> = new Map<string, number>();

  public addPlayerScoreReport(playerName: string, scoreReport: ScoreReport, turns: number): void {
    this.scoreByPlayerName.set(playerName, scoreReport);
    this.turnsByPlayerName.set(playerName, turns);
  }

  public getGameResult(): GameResult {
    const outcomesByPlayerName = this.determineOutcomesForPlayers();

    const playerResults: PlayerGameResult[] = [];
    for (const playerName of outcomesByPlayerName.keys()) {
      const scoreReport = this.scoreByPlayerName.get(playerName)!;
      const turns = this.turnsByPlayerName.get(playerName)!;
      playerResults.push({
        playerName,
        scoreReport,
        outcome: outcomesByPlayerName.get(playerName)!,
        turns,
      });
    }
    return { playerResults };
  }

  private determineOutcomesForPlayers(): Map<string, GameOutcome> {
    const playersWithHighestScore = this.getPlayersWithHighestScore();

    if (playersWithHighestScore.size === 1) {
      return this.constructOutcomeMapWithWinner(playersWithHighestScore.values().next().value!);
    }

    const playersWithLowestTurns = this.getPlayersWithLowestTurns();
    const playersWithHighestScoreAndLowestTurns = playersWithHighestScore.intersection(playersWithLowestTurns);

    if (playersWithHighestScoreAndLowestTurns.size === 1) {
      return this.constructOutcomeMapWithWinner(playersWithHighestScoreAndLowestTurns.values().next().value!);
    }

    return this.constructOutcomeMapWithTies(playersWithHighestScoreAndLowestTurns);
  }

  private constructOutcomeMapWithWinner(winningPlayerName: string): Map<string, GameOutcome> {
    const outcomesByPlayerName = new Map<string, GameOutcome>();
    for (const playerName of this.scoreByPlayerName.keys()) {
      outcomesByPlayerName.set(playerName, playerName === winningPlayerName ? GameOutcome.WIN : GameOutcome.LOSS);
    }
    return outcomesByPlayerName;
  }

  private constructOutcomeMapWithTies(tiedPlayerNames: Set<string>): Map<string, GameOutcome> {
    const outcomesByPlayerName = new Map<string, GameOutcome>();
    for (const playerName of this.scoreByPlayerName.keys()) {
      outcomesByPlayerName.set(playerName, tiedPlayerNames.has(playerName) ? GameOutcome.TIE : GameOutcome.LOSS);
    }
    return outcomesByPlayerName;
  }

  private getPlayersWithHighestScore(): Set<string> {
    let highestScore = -Infinity;
    const playersWithHighestScore = new Set<string>();
    for (const playerName of this.scoreByPlayerName.keys()) {
      const score = this.scoreByPlayerName.get(playerName)!.total;
      if (score > highestScore) {
        highestScore = score;
        playersWithHighestScore.clear();
        playersWithHighestScore.add(playerName);
      } else if (score === highestScore) {
        playersWithHighestScore.add(playerName);
      }
    }
    return playersWithHighestScore;
  }

  private getPlayersWithLowestTurns(): Set<string> {
    let lowestTurns = Infinity;
    const playersWithLowestTurns = new Set<string>();
    for (const playerName of this.scoreByPlayerName.keys()) {
      const turns = this.turnsByPlayerName.get(playerName)!;
      if (turns < lowestTurns) {
        lowestTurns = turns;
        playersWithLowestTurns.clear();
        playersWithLowestTurns.add(playerName);
      } else if (turns === lowestTurns) {
        playersWithLowestTurns.add(playerName);
      }
    }
    return playersWithLowestTurns;
  }
}
