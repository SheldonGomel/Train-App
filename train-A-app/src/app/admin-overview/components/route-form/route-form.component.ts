import { AsyncPipe, NgFor } from '@angular/common';
import { AfterViewInit, Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CarriageFacade } from 'app/admin-overview/_state/carriage/carriage.facade';
import { RouteFacade } from 'app/admin-overview/_state/route/route.facade';
import { StationFacade } from 'app/admin-overview/_state/station/station.facade';
import { CarriageFormEditMode } from 'app/admin-overview/models/carriage';
import { Route } from 'app/admin-overview/models/route';
import { Station } from 'app/admin-overview/models/station';
import { RoutePanelService } from 'app/admin-overview/services/route-panel/route-panel.service';
import { combineLatest, map, Observable, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-route-form',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    AsyncPipe,
    ReactiveFormsModule,
    MatButtonModule,
    NgFor,
  ],
  templateUrl: './route-form.component.html',
  styleUrl: './route-form.component.scss',
})
export class RouteFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() editMode: CarriageFormEditMode = 'create';

  @Input() routeForUpdating!: Route | null;

  private carriageFacade = inject(CarriageFacade);

  private stationFacade = inject(StationFacade);

  private route = inject(RouteFacade);

  private panelService = inject(RoutePanelService);

  private fb: FormBuilder = inject(FormBuilder);

  private destroy$: Subject<void> = new Subject<void>();

  // TODO: fix when the page will be ready
  private MIN_ITEMS_IN_ROUTE = 1;

  readonly carriages$ = this.carriageFacade.carriage$;

  readonly stations$ = this.stationFacade.station$;

  public filteredStationOptionsMap: { [key: number]: Observable<Station[]> } = {};

  public routesForm!: FormGroup;

  ngOnInit() {
    this.routesForm = this.fb.group({
      selectStations: this.fb.array(
        [this.createSelectControl()],
        Validators.minLength(this.MIN_ITEMS_IN_ROUTE),
      ),
      selectCarriages: this.fb.array(
        [this.createSelectControl()],
        Validators.minLength(this.MIN_ITEMS_IN_ROUTE),
      ),
    });

    this.updateFilteredStationOptions(0);
  }

  ngAfterViewInit() {
    this.panelService.panelState$.pipe(takeUntil(this.destroy$)).subscribe((updateInfo) => {
      if (updateInfo.panelId === 'panelRoute') {
        this.editMode = updateInfo.editMode ?? 'create';
        this.routeForUpdating = updateInfo.route ?? null;
        if (this.editMode && this.routeForUpdating) {
          this.updateFormValues();
        } else {
          this.cleanFormPanel();
        }
      }
    });
  }

  private updateFormValues() {
    if (this.routeForUpdating) {
      this.stations.clear();
      this.carriages.clear();
      this.routeForUpdating.path.forEach((station) => {
        this.stations.push(this.fb.control(station));
      });

      this.routeForUpdating.carriages.forEach((carriage) => {
        this.carriages.push(this.fb.control(carriage));
      });
      this.routesForm.setValue({
        selectStations: [...this.routeForUpdating.path],
        selectCarriages: [...this.routeForUpdating.carriages],
      });
    }
  }

  get stations(): FormArray {
    return this.routesForm.get('selectStations') as FormArray;
  }

  get carriages(): FormArray {
    return this.routesForm.get('selectCarriages') as FormArray;
  }

  private createSelectControl(): FormControl {
    return this.fb.control(null);
  }

  private updateFilteredStationOptions(index: number) {
    if (index === 0) {
      this.filteredStationOptionsMap[index] = this.stations$;
    } else {
      const lastSelectedStationId = this.stations.at(index - 1)?.value;
      this.filteredStationOptionsMap[index] = combineLatest([this.stations$]).pipe(
        map(([stations]) => {
          return stations.filter((station) =>
            station.connectedTo.some((connection) => connection.id === lastSelectedStationId),
          );
        }),
      );
    }
  }

  public onStationsChange(index: number): void {
    if (index !== this.stations.length - 1) {
      for (let i = this.stations.length - 1; i > index; i -= 1) {
        this.stations.removeAt(i);
      }
    }
    this.stations.push(this.createSelectControl());
    this.updateFilteredStationOptions(index + 1);
  }

  public onCarriagesChange(index: number): void {
    if (index === this.carriages.length - 1) {
      this.carriages.push(this.createSelectControl());
    }
  }

  private removeLastElement<T>(array: T[]): T[] {
    array.pop();
    return array;
  }

  private cleanFormPanel() {
    this.routesForm.reset();
    this.clearFormArray(this.stations);
    this.clearFormArray(this.carriages);
  }

  private clearFormArray(formArray: FormArray) {
    while (formArray.length > 1) {
      formArray.removeAt(1);
    }
  }

  public onSubmit() {
    if (this.routesForm.valid) {
      const newRoute = {
        path: this.removeLastElement(this.stations.value) as number[],
        carriages: this.removeLastElement(this.carriages.value) as string[],
      };
      this.route.addRoute(newRoute);
      this.cleanFormPanel();
      this.panelService.togglePanel('panelRoute', 'save');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
