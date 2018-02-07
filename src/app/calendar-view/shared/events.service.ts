import { Injectable } from '@angular/core';
import { CentralApiService } from '../../services/central-api.service';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

@Injectable()
export class EventsService {

  constructor(public centralAPIService: CentralApiService) { }

  fetchEvents(): Observable<any> {
    console.log('within fetch events');
    const payload = {
      operation: 'fetchEvents'
    };
    return this.centralAPIService.callAPI('events', payload, 'post');
  }

}
