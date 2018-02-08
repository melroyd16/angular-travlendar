export class Location {
  place_id: string;
  formatted_address: string;
  lat: any;
  lng: any;
  constructor(id: string = '', address: string = '', lat: any = '', lng: any = '') {
    this.place_id = id;
    this.formatted_address = address;
    this.lat = lat;
    this.lng = lng;
  }
}
