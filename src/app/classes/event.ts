import {Location} from './location';
import {TravelMode} from './travel-mode';

export class Event {
  eventTitle?: String;
  eventStart?: any;
  eventEnd?: any;
  destination?: Location;
  origin?: Location;
  travelMode?: TravelMode;

  constructor(
    eventTitle: String = '',
    eventStart: any = '',
    eventEnd: any = '',
    destination: Location = null,
    origin: Location = null,
    travelMode: TravelMode = null
  ) {
    this.eventTitle = eventTitle;
    this.eventStart = eventStart;
    this.eventEnd = eventEnd;
    this.destination = destination;
    this.origin = origin;
    this.travelMode = travelMode;
  }
}
