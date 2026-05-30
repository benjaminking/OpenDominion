import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CardLocation,
  CardMetadata,
  CardScoringElement,
  CardType,
  GameOutcome,
  GameResult,
  LandscapeScoringElement,
  PlayerGameResult,
  ScoringElementType,
  VPChipScoringElement,
} from '@dominion/common';
import { CardInfoLookup } from '@dominion/card-info';
import { CardComponent } from '../cards/card.component';

@Component({
  selector: 'game-result-table',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './game-result-table.component.html',
  styleUrl: './game-result-table.component.css',
})
export class GameResultTableComponent {
  result = input.required<GameResult>();

  protected readonly ScoringElementType = ScoringElementType;
  protected readonly GameOutcome = GameOutcome;

  playerResults = computed(() => this.result().playerResults);

  asCardElement(element: unknown): CardScoringElement {
    return element as CardScoringElement;
  }

  asLandscapeElement(element: unknown): LandscapeScoringElement {
    return element as LandscapeScoringElement;
  }

  asVPChipElement(element: unknown): VPChipScoringElement {
    return element as VPChipScoringElement;
  }

  cardMetadataFor(cardName: string): CardMetadata {
    const info = CardInfoLookup.lookUpCardInfo(cardName);
    return {
      name: cardName,
      id: cardName,
      location: CardLocation.PILE,
      types: info.types as CardType[],
      cost: info.cost,
    };
  }

  outcomeLabel(result: PlayerGameResult): string {
    switch (result.outcome) {
      case GameOutcome.WIN:
        return 'Winner';
      case GameOutcome.TIE:
        return 'Tie';
      case GameOutcome.LOSS:
        return 'Loss';
      case GameOutcome.FORFEIT:
        return 'Forfeit';
    }
  }

  outcomeCssClass(result: PlayerGameResult): string {
    switch (result.outcome) {
      case GameOutcome.WIN:
        return 'outcome-win';
      case GameOutcome.TIE:
        return 'outcome-tie';
      case GameOutcome.LOSS:
        return 'outcome-loss';
      case GameOutcome.FORFEIT:
        return 'outcome-forfeit';
    }
  }
}
