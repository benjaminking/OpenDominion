import { Client } from '@dominion/client-common';
import { DecisionService, LogMessage, ScoreReport, ScoringElement } from '@dominion/common';

import { Game } from '../Game';
import { Turn } from '../turns/Turn';
import { BotStatistics } from './BotStatistics';
import { InstructionExecutor } from './InstructionExecutor';
import { PlayerCards } from './PlayerCards';
import { PlayerEffects } from './PlayerEffects';
import { Statistics } from './Statistics';
import { TurnTracker } from './TurnTracker';

export class Player {
  private readonly ownedCards: PlayerCards;
  private readonly effects: PlayerEffects = new PlayerEffects();
  private readonly instructionExecutor: InstructionExecutor;
  private readonly statistics: Statistics;
  private readonly botStatistics: BotStatistics;
  private readonly turnTracker: TurnTracker;

  constructor(
    private readonly name: string,
    private readonly game: Game,
    private readonly client: Client,
    private readonly isBot = false,
  ) {
    this.ownedCards = new PlayerCards(this);
    this.instructionExecutor = new InstructionExecutor(this.game.getGameState(), this);
    this.statistics = new Statistics(this);
    this.botStatistics = new BotStatistics(this, game.getMessageBroadcaster());
    this.turnTracker = new TurnTracker(new Turn(this, 0, 0));
  }

  public communicateInitialState(): void {
    this.statistics.communicateInitialState();
    this.ownedCards.communicateInitialState();
  }

  public isBotPlayer(): boolean {
    return this.isBot;
  }

  public getGame(): Game {
    return this.game;
  }

  public getOwnedCards(): PlayerCards {
    return this.ownedCards;
  }

  public getEffects(): PlayerEffects {
    return this.effects;
  }

  public getStatistics(): Statistics {
    return this.statistics;
  }

  public getBotStatistics(): BotStatistics {
    return this.botStatistics;
  }

  public getTurnTracker(): TurnTracker {
    return this.turnTracker;
  }

  public getName(): string {
    return this.name;
  }

  public getDecisionService(): DecisionService {
    return this.client.getDecisionService();
  }

  public getInstructionExecutor(): InstructionExecutor {
    return this.instructionExecutor;
  }

  public transmitLogMessage(logMessage: LogMessage): void {
    this.client.sendLogMessage(logMessage);
  }

  public calculateScore(): ScoreReport {
    const scoringElements = [...this.ownedCards.getCardScoringElements(), this.statistics.getVPChipScoringElement()];
    const totalScore = this.calculateTotalScoreFromElements(scoringElements);

    this.statistics.setScore(totalScore);

    return {
      total: totalScore,
      elements: scoringElements,
    };
  }

  private calculateTotalScoreFromElements(elements: ScoringElement[]): number {
    let total = 0;
    for (const element of elements) {
      total += element.totalPoints;
    }
    return total;
  }

  public getClient(): Client {
    return this.client;
  }
}
