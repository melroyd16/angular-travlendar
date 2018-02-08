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



  saveUserProfile(homeLocation: Location, workLocation: Location, walkingDistance: number,
     cyclingDistance: number, preferredModes:any[] ): Observable<any> {
    const payload = {
      operation: 'saveProfile',
      homeLocation: homeLocation,
      workLocation: workLocation,
      walkingDistance: walkingDistance,
      cyclingDistance: cyclingDistance,
      preferredModes: preferredModes
    };
    console.log(payload);
    return this.centralAPIService.callAPI('profile', payload, 'post');
  }

  setUserDetails(homeLocation: Location, workLocation: Location, walkingDistance: number,
     cyclingDistance: number, preferredModes:any[]): void {
    this.userProfile.homeLocation = homeLocation;
    this.userProfile.workLocation = workLocation;
    this.userProfile.walkingDistance = walkingDistance;
    this.userProfile.cyclingDistance = cyclingDistance;
    this.userProfile.preferredMode= preferredModes;
  }



  getUserProfile(): UserProfile {
    return this.userProfile;
  }
}
