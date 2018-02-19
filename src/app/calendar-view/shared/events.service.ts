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

  saveEvent(eventDetails: any, forceSaveEvent: boolean): Observable<any> {
    const payload = {
      operation: 'saveEvent',
      eventDetails: eventDetails,
      forceSaveEvent: forceSaveEvent
    };
    return this.centralAPIService.callAPI('events', payload, 'post');
  }

}
