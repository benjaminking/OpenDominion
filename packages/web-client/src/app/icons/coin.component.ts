import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'coin',
  templateUrl: './coin.component.html',
  styleUrls: ['./coin.component.css'],
  imports: [CommonModule],
})
export class CoinComponent {
  text = input.required<string>();
  size = input<string>('medium');
}
