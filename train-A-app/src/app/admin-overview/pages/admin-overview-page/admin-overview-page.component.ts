import { CommonModule } from '@angular/common';
import { Component, inject, inject, OnInit } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { Router, RouterModule } from '@angular/router';
import { CarriageFacade } from 'app/admin-overview/_state/carriage/carriage.facade';
import { StationFacade } from 'app/admin-overview/_state/station/station.facade';
import { StationsPageComponent } from '../stations-page/stations-page.component';
import { CarriagesPageComponent } from '../carriages-page/carriages-page.component';
import { Router, RouterModule } from '@angular/router';
import { RoutesPageComponent } from '../routes-page/routes-page.component';

@Component({
  selector: 'app-admin-overview-page',
  standalone: true,
  imports: [
    MatDividerModule,
    MatListModule,
    CommonModule,
    StationsPageComponent,
    CarriagesPageComponent,
    RoutesPageComponent,
    RouterModule,
  ],
  templateUrl: './admin-overview-page.component.html',
  styleUrl: './admin-overview-page.component.scss',
})
export class AdminOverviewPageComponent {
  public selectedPanelItem: string = '';

  private router: Router = inject(Router);

  public navigateTo(path: string): void {
    this.selectedPanelItem = this.getPanelNameFromPath(path);
    this.router.navigate([path]);
  }

  private getPanelNameFromPath(path: string): string {
    switch (path) {
      case '/admin/stations':
        return 'Stations';
      case '/admin/carriages':
        return 'Carriages';
      case '/admin/routes':
        return 'Routes';
      default:
        return '';
    }
  }

  private stationFacade = inject(StationFacade);

  private carriageFacade = inject(CarriageFacade);

  public ngOnInit(): void {
    this.stationFacade.loadStation();
    this.carriageFacade.loadCarriage();
  }

  selectPanelItem(panelItem: string): void {
    this.selectedPanelItem = panelItem;
  }
}
