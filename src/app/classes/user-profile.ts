import { Location } from './location';

export class UserProfile {
  homeLocation?: Location;
  workLocation?: Location;
  constructor(home: Location, work: Location) {
    this.homeLocation = home;
    this.workLocation = work;
  }
}
