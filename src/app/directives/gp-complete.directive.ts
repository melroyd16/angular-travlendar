import {Directive, ElementRef, EventEmitter, OnInit, Output} from '@angular/core';

@Directive({
  selector: '[appGpComplete]'
})
export class GpCompleteDirective implements OnInit {
  @Output() onSelect: EventEmitter<any> = new EventEmitter();

  private element: HTMLInputElement;

  constructor(el: ElementRef) {
    this.element = el.nativeElement;
  }

  ngOnInit() {
    const autocomplete = new google.maps.places.Autocomplete(this.element, {});
    google.maps.event.addListener(autocomplete, 'place_changed', () => {
      const place = autocomplete.getPlace();
      this.onSelect.emit(place);
    });
  }
}
