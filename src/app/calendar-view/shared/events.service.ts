import { Injectable } from '@angular/core';
import { CentralApiService } from '../../services/central-api.service';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

@Injectable()
export class EventsService {

  constructor(public centralAPIService: CentralApiService) { }

  fetchEvents(): Observable<any> {
    const payload = {
      operation: 'fetchEvents'
    };
    return this.centralAPIService.callAPI('events', payload, 'post');
  }

  deleteEvent(eventID): Observable<any> {
    console.log('within delete event.');
    const payload = {
      operation: 'deleteEvent',
      eventID: eventID
    };
    return this.centralAPIService.callAPI('events', payload, 'post');
  }

  saveEvent(eventDetails: any, forceSaveEvent: boolean, eventType: string, eventId: string): Observable<any> {
    let payload = {};
    if (eventType === 'save') {
      payload = {
        operation: 'saveEvent',
        eventDetails: eventDetails,
        forceSaveEvent: forceSaveEvent
      };
    } else {
      payload = {
        operation: 'editEvent',
        eventID: eventId,
        eventDetails: eventDetails,
        forceSaveEvent: forceSaveEvent
      };
    }
    console.log(eventDetails.travelMode);
    return this.centralAPIService.callAPI('events', payload, 'post');
  }

}
