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
    const simpleObservable = new Observable((observer) => {
      this.centralAPIService.callAPI('profile', {}, 'get').subscribe((data) => {
        console.log(data);
        this.setProfile(data.Item);
        // this.setLocationDetails(data.Item.homeLocation, data.Item.workLocation);
        // this.setUserDetails(data.Item.walkingDistance, data.Item.cyclingDistance,
        //   data.Item.preferredModes, lunchTime.start_time, lunchTime.end_time, dinnerTime.start_time, dinnerTime.end_time);
        observer.next(data);
        observer.complete();
      });
    });
    return simpleObservable;
  }

  setProfile(item: any): void {
    this.userProfile.homeLocation = item.homeLocation;
    this.userProfile.workLocation = item.workLocation;
    this.userProfile.walkingDistance = item.walkingDistance;
    this.userProfile.cyclingDistance = item.cyclingDistance;
    this.userProfile.preferredMode = item.preferredMode;
    this.userProfile.lunchStartTime = item.lunchTime.start_time;
    this.userProfile.lunchEndTime = item.lunchTime.end_time;
    this.userProfile.dinnerStartTime = item.dinnerTime.start_time;
    this.userProfile.dinnerEndTime = item.dinnerTime.end_time;
  }

  setLocationDetails(homeLocation: Location, workLocation: Location): void {
    this.userProfile.homeLocation = homeLocation;
    this.userProfile.workLocation = workLocation;
    console.log(this.userProfile);
  }

  saveLocationDetails(homeLocation: Location, workLocation: Location): Observable<any> {
    const payload = {
      operation: 'saveLocation',
      homeLocation: homeLocation,
      workLocation: workLocation
    };
    return this.centralAPIService.callAPI('profile', payload, 'post');
  }

  saveUserProfile(homeLocation: Location, workLocation: Location, walkingDistance: number,
    cyclingDistance: number, preferredModes: any[], lunchStartTime, lunchEndTime,
    dinnerStartTime, dinnerEndTime): Observable<any> {
    const payload = {
      operation: 'saveProfile',
      homeLocation: homeLocation,
      workLocation: workLocation,
      walkingDistance: walkingDistance,
      cyclingDistance: cyclingDistance,
      preferredModes: preferredModes,
      lunchTime: {
        'end_time': lunchEndTime,
        'start_time': lunchStartTime
      },
      dinnerTime: {
        'end_time': dinnerEndTime,
        'start_time': dinnerStartTime
      }
    };
    console.log(payload);
    return this.centralAPIService.callAPI('profile', payload, 'post');
  }

  setUserDetails(walkingDistance: number, cyclingDistance: number,
    preferredModes: any[]): void {
    this.userProfile.walkingDistance = walkingDistance;
    this.userProfile.cyclingDistance = cyclingDistance;
    this.userProfile.preferredMode = preferredModes;
  }

  getUserProfile(): UserProfile {
    console.log(this.userProfile);
    return this.userProfile;
  }
}
