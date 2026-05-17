import { Component, inject, Signal, WritableSignal, signal } from '@angular/core';
import { GlobalSettingsService } from './global-settings.service';
import { using } from 'rxjs';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  readonly settingsService = inject(GlobalSettingsService);
  isSettingsPanelOpen: WritableSignal<boolean> = signal(false);

  toggleSettings() {
    this.isSettingsPanelOpen.set(!this.isSettingsPanelOpen());
  }
}
