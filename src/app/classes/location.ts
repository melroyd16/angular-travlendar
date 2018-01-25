export class Location {
  place_id: string;
  formatted_address: string;
  constructor(id: string, address: string) {
    this.place_id = id;
    this.formatted_address = address;
  }
}
