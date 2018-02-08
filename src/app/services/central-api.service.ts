import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

@Injectable()
export class CentralApiService {

  constructor(private http: HttpClient) { }

  callAPI(module: string, payload: any, method: string): Observable<any> {

    // Spinner Loader

    let url = '';
    switch (module) {
      case 'calendar':
        url = environment.calendar_api;
        break;
      case 'profile':
        url = environment.profile_api;
        break;
      case 'events':
        url = environment.events_api;
        break;
      default:
        url = environment.calendar_api;
    }
    return this.http[method](url, payload);
  }

}
