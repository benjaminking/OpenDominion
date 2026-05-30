import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth/auth.service';
import { TableApiService, TableView } from './services/table-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {
  private isOwnerOfOpenTable = false;

  public constructor(
    private readonly authService: AuthService,
    private readonly tableApiService: TableApiService,
  ) {
    this.authService.sessionChanges().subscribe(() => this.updateTableOwnership());
    this.tableApiService.tableChanges().subscribe(() => this.updateTableOwnership());
  }

  @HostListener('window:beforeunload', ['$event'])
  public onBeforeUnload(event: BeforeUnloadEvent): string | void {
    if (this.isOwnerOfOpenTable) {
      const message = 'You are the owner of an open table. If you leave, the table will be deleted.';
      event.returnValue = message;
      return message;
    }
  }

  private async updateTableOwnership(): Promise<void> {
    const session = this.authService.session();
    if (!session) {
      this.isOwnerOfOpenTable = false;
      return;
    }

    try {
      const tables = await firstValueFrom(this.tableApiService.listOpenTables());
      this.isOwnerOfOpenTable = tables.some((table) => table.ownerUserId === session.userId && table.status === 'OPEN');
    } catch {
      this.isOwnerOfOpenTable = false;
    }
  }
}
