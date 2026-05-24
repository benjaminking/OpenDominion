import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CardMetadata } from '../../../../common/dist/card/CardMetadata';
import { MessageDecoderService } from '../message-decoder.service';
import { CardLocation } from '@dominion/common';
import { CardDialogComponent } from '../cards/card-dialog.component';
import { ViewName } from '../view-names';
import { ViewVisibilityService } from '../view-visibility.service';

@Component({
  selector: 'shared',
  templateUrl: './shared.component.html',
  styleUrls: ['./shared.component.css'],
  imports: [CardDialogComponent],
})
export class SharedComponent implements OnInit {
  trash = signal<CardMetadata[]>([]);
  trashViewName = ViewName.TRASH;
  private readonly webSocketMessageDecoder = inject(MessageDecoderService);
  private readonly viewVisibilityService = inject(ViewVisibilityService);

  ngOnInit(): void {
    this.webSocketMessageDecoder.subscribeToSharedCardsUpdate(
      { location: CardLocation.TRASH },
      (sharedCardsContent: { cards: CardMetadata[] }) => {
        this.trash.set(sharedCardsContent.cards);
      },
    );
  }

  toggleTrashVisibility(): void {
    this.viewVisibilityService.toggleViewByName(ViewName.TRASH);
  }
}
