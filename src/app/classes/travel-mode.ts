import {TextValue} from './text-value';

export class TravelMode {
  distance: TextValue;
  duration: TextValue;
  mode: String;

  constructor(distance: TextValue, duration: TextValue, mode: String) {
    this.distance = distance;
    this.duration = duration;
    this.mode = mode;
  }
}
