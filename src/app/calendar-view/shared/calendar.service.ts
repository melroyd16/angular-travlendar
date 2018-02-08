import { Injectable } from '@angular/core';
import { CentralApiService } from '../../services/central-api.service';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

import { Location } from '../../classes/location';

@Injectable()
export class CalendarService {

  constructor(public centralAPIService: CentralApiService) { }

  origin: Location;
  destination: Location;

  fetchTravelModes(travelMode: string): any {
    const deferredObject = $.Deferred();
    const service = new google.maps.DistanceMatrixService();
    const originll = new google.maps.LatLng(this.origin.lat, this.origin.lng);
    const destinationll = new google.maps.LatLng(this.destination.lat, this.destination.lng);
    const parameter = {
      origins: [originll],
      destinations: [destinationll],
      unitSystem: google.maps.UnitSystem.IMPERIAL,
      travelMode: google.maps.TravelMode[travelMode.toUpperCase()],
      avoidHighways: false,
      avoidTolls: false
    };
    service.getDistanceMatrix(parameter, function(response, status) {
      if (status !== google.maps.DistanceMatrixStatus.OK) {
        deferredObject.reject(status);
      } else {
        deferredObject.resolve(response);
      }
    });
    return deferredObject.promise();
  }

  fetchTransitDetails(origin: Location, destination: Location): Observable<any> {
    const deferredObject = $.Deferred();
    this.origin = origin;
    this.destination = destination;
    const simpleObservable = new Observable((observer) => {
      $.when(this.fetchTravelModes('driving'), this.fetchTravelModes('walking'),
        this.fetchTravelModes('bicycling'), this.fetchTravelModes('transit'))
        .then(function(val1, val2, val3, val4) {
          const travelModeArray = [];
          travelModeArray.push({
            mode: 'driving',
            icon: 'car',
            value: val1.rows[0].elements[0]
          });
          travelModeArray.push({
            mode: 'walking',
            icon: 'male',
            value: val2.rows[0].elements[0]
          });
          travelModeArray.push({
            mode: 'bicycling',
            icon: 'bicycle',
            value: val3.rows[0].elements[0]
          });
          travelModeArray.push({
            mode: 'transit',
            icon: 'bus',
            value: val4.rows[0].elements[0]
          });
          observer.next(travelModeArray);
          observer.complete();
        })
        .fail(function() { });
    });
    return simpleObservable;
  }
}
