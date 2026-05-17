import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CardMetadata } from '../../../../common/dist/card/CardMetadata';
import { MessageDecoderService } from '../message-decoder.service';
import { CardLocation } from '@dominion/common';
import { CardDialogComponent } from '../cards/card-dialog.component';

@Component({
  selector: 'shared',
  templateUrl: './shared.component.html',
  styleUrls: ['./shared.component.css'],
  imports: [CardDialogComponent],
})
export class SharedComponent implements OnInit {
  trash = signal<CardMetadata[]>([]);
  isTrashVisible: boolean = false;
  private readonly webSocketMessageDecoder = inject(MessageDecoderService);

  ngOnInit(): void {
    this.webSocketMessageDecoder.subscribeToSharedCardsUpdate(
      { location: CardLocation.TRASH },
      (sharedCardsContent: { cards: CardMetadata[] }) => {
        this.trash.set(sharedCardsContent.cards);
      },
    );
  }

  toggleTrashVisibility(): void {
    this.isTrashVisible = !this.isTrashVisible;
  }
}
