import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChosenRide, Ride } from 'app/home/models/trip';
import { Order, TripService } from 'app/trip/services/trip.service';
import { MatTabsModule } from '@angular/material/tabs';
import { Carriage, CarriageDataForSchema } from 'app/admin-overview/models/carriage';
import { Station } from 'app/admin-overview/models/station';
import { Subscription } from 'rxjs';
import { TripFacade } from 'app/home/_state/search.facade';
import { TripStationsComponent } from 'app/home/components/trip-stations/trip-stations.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CarriageFacade } from 'app/admin-overview/_state/carriage/carriage.facade';
import { NotificationService } from 'app/core/services/notification/notification.service';
import { SearchService } from 'app/home/services/search.service';
import { CarriageSchemaComponent } from '../carriage-schema/carriage-schema.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    DatePipe,
    MatIcon,
    MatButtonModule,
    CarriageSchemaComponent,
  ],
  selector: 'app-trip',
  templateUrl: './trip.component.html',
  styleUrls: ['./trip.component.scss'],
})
export class TripComponent implements OnInit, OnDestroy {
  rideId: number = 0;

  fromCity: Station = {
    id: 0,
    city: '',
    latitude: 0,
    longitude: 0,
    connectedTo: [],
  };

  toCity: Station = {
    id: 0,
    city: '',
    latitude: 0,
    longitude: 0,
    connectedTo: [],
  };

  stations: Station[] = [];

  tripDetails: Ride = {
    path: [],
    carriages: [],
    rideId: 0,
    routeId: 0,
    schedule: { segments: [] },
  };

  startStopStations = { start: 0, stop: 0 };

  carriageTypes: Carriage[] = [];

  allCarriageTypes: Carriage[] = [];

  carriagePrices: { type: string; price: number; seats: number }[] = [];

  train: Carriage[] = [];

  middleStations = {
    second: 'err',
    penult: 'err',
  };

  ride: ChosenRide = {
    routeId: 0,
    fromCity: '',
    toCity: '',
    stations: [],
    carriages: [],
    occupiedSeats: [],
    schedule: [],
  };

  carriageSchemas: { [type: string]: CarriageDataForSchema & { seats?: number } } = {};

  subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private tripService: TripService,
    private tripFacade: TripFacade,
    private carriageFacade: CarriageFacade,
    private dialog: MatDialog,
    private router: Router,
    private notificationService: NotificationService,
    private searchService: SearchService,
  ) {
    this.carriageFacade.loadCarriage();
    this.subscriptions.add(
      this.carriageFacade.carriage$.subscribe((cs) => {
        this.allCarriageTypes = cs;
        cs.forEach((carriage) => {
          this.carriageSchemas[carriage.name] = {
            name: carriage.name,
            rows: carriage.rows,
            leftSeats: carriage.leftSeats,
            rightSeats: carriage.rightSeats,
            seats: 0,
          };
        });
      }),
    );
    this.subscriptions.add(
      this.tripFacade.ride$.subscribe((ride: ChosenRide) => {
        this.ride = ride;
      }),
    );
  }

  ngOnInit(): void {
    this.rideId = Number(this.route.snapshot.paramMap.get('rideId')) || 0;
    this.subscriptions.add(
      this.route.queryParams.subscribe((params) => {
        const fromStationId = Number(params['from']) || 0;
        const toStationId = Number(params['to']) || 0;
        this.subscriptions.add(
          this.searchService.getStations().subscribe((stations) => {
            this.fromCity = stations.find((st) => st.id === fromStationId) ?? this.fromCity;
            this.toCity = stations.find((st) => st.id === toStationId) ?? this.toCity;
            this.fetchTripDetails();
          }),
        );
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  getCity(id: number) {
    return (
      this.stations.find((st) => {
        return st.id === this.tripDetails.path[id];
      })?.city ?? ''
    );
  }

  fetchTripDetails() {
    if (this.rideId) {
      this.subscriptions.add(
        this.tripService.getTripDetails(this.rideId).subscribe((data: Ride) => {
          this.tripDetails = data;
          const { carriages } = data;
          carriages.forEach((car) => {
            if (!this.carriageTypes.find((ct) => ct.name === car)) {
              const carriageIsInTrane = this.allCarriageTypes.find((ct) => ct.name === car);
              if (carriageIsInTrane) this.carriageTypes.push(carriageIsInTrane);
            }
            const carSch = this.carriageSchemas[car];
            this.carriageSchemas[car] = {
              ...carSch,
              seats: carSch?.seats
                ? carSch.seats + carSch.rows * (carSch.leftSeats + carSch.rightSeats)
                : carSch.rows * (carSch.leftSeats + carSch.rightSeats),
            };
          });
        }),
      );
    } else {
      console.warn('Missing parameters: Cannot fetch trip details');
    }
  }

  back() {
    this.router.navigate(['/home']);
  }

  letsBook() {
    const order: Order = {
      rideId: this.rideId,
      seat: Math.ceil(Math.random() * 100),
      stationStart: this.ride.stations[0].id,
      stationEnd: this.ride.stations[this.ride.stations.length - 1].id,
    };
    this.subscriptions.add(
      this.tripService.sendBooking(order).subscribe(
        (order) => {
          console.log(order);
          if (order.id) {
            this.notificationService.openSuccessSnackBar('Success!');
          } else {
            this.notificationService.openFailureSnackBar('Failed!');
          }
        },
        (err) => {
          this.notificationService.openFailureSnackBar(`Failed! ${err.error.message}`);
        },
      ),
    );
  }

  openDialog(): void {
    this.dialog.open(TripStationsComponent, {
      width: '400px',
      data: {
        path: { stations: this.ride.stations, id: this.tripDetails.routeId },
        schedule: this.ride.schedule,
        allStations: this.stations,
      },
    });
  }
}
