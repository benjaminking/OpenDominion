import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'potion',
  templateUrl: './potion.component.html',
  styleUrls: ['./potion.component.css'],
  imports: [CommonModule],
})
export class PotionComponent {
  size = input<string>('medium');
}
