import { Injectable } from '@angular/core';
import { CentralApiService } from '../../services/central-api.service';
import { Location } from '../../classes/location';
import { UserProfile } from '../../classes/user-profile';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

@Injectable()
export class ProfileService {

  userProfile: UserProfile = {};
  constructor(public centralAPIService: CentralApiService) { }

  fetchUserProfile(): Observable<any> {
    return this.centralAPIService.callAPI('profile', {}, 'get');
  }

  saveLocationDetails(homeLocation: Location, workLocation: Location): Observable<any> {
    const payload = {
      operation: 'saveLocation',
      homeLocation: homeLocation,
      workLocation: workLocation
    };
    return this.centralAPIService.callAPI('profile', payload, 'post');
  }

  setLocationDetails(homeLocation: Location, workLocation: Location): void {
    this.userProfile.homeLocation = homeLocation;
    this.userProfile.workLocation = workLocation;
  }

  getUserProfile(): UserProfile {
    return this.userProfile;
  }
}
