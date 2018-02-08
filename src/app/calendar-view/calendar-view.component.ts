import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours
} from 'date-fns';
import { Subject } from 'rxjs/Subject';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent
} from 'angular-calendar';

import { UserLoginService } from '../services/user-login.service';
import { LoggedInCallback } from '../services/cognito.service';
import { Router } from '@angular/router';

import { ProfileService } from '../profile/shared/profile.service';
import { EventsService } from './shared/events.service';
import { Location } from '../classes/location';
import { Event } from '../classes/event';

import * as moment from 'moment';

const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3'
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  }
};

@Component({
  selector: 'app-calendar-view',
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.scss']
})
export class CalendarViewComponent implements OnInit {
  @ViewChild('modalContent') modalContent: TemplateRef<any>;

  view = 'month';
  displayLocationModal: boolean;
  eventsLoaded = false;
  homeLocation: Location;
  workLocation: Location;
  locationTypes: String[];
  selectedPriorLocation: String;
  event: Event;
  otherLocationDetails: Location;
  eventStartMinDate: Date = new Date();
  viewDate: Date = new Date();
  activeDayIsOpen = false;
  displayEventModal = false;

  modalData: {
    action: string;
    event: CalendarEvent;
  };

  actions: CalendarEventAction[] = [
    {
      label: '<i class="fa fa-fw fa-pencil"></i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edited', event);
      }
    },
    {
      label: '<i class="fa fa-fw fa-times"></i>',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter(iEvent => iEvent !== event);
        this.handleEvent('Deleted', event);
      }
    }
  ];

  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [];

  constructor(private modal: NgbModal, public router: Router,
    public userService: UserLoginService,
    public profileService: ProfileService,
    public eventsService: EventsService) {
    this.userService.isAuthenticated(this);
    this.locationTypes = ['home', 'work', 'prior event location', 'other'];
    this.selectedPriorLocation = 'home';
  }

  ngOnInit() {
    const userProfile = this.profileService.getUserProfile();
    if (!this.profileService.userProfile || !this.profileService.userProfile.homeLocation) {
      this.profileService.fetchUserProfile().subscribe((locationDetails) => {
        if (!locationDetails.Item || !locationDetails.Item.homeLocation) {
          $('#locationModal').modal('toggle');
        } else {
          this.homeLocation = locationDetails.Item.homeLocation;
          this.workLocation = locationDetails.Item.workLocation;
        }
      });
    } else {
      this.homeLocation = this.profileService.userProfile.homeLocation;
      this.workLocation = this.profileService.userProfile.workLocation;
    }
    console.log(userProfile);
    this.eventsService.fetchEvents().subscribe((eventList) => {
      this.eventsLoaded = true;
      for (let i = 0; i < eventList.Items.length; i++) {
        this.events.push({
          title: eventList.Items[i].eventTitle,
          start: new Date(eventList.Items[i].eventStart),
          end: new Date(eventList.Items[i].eventEnd),
          color: colors.red,
          draggable: true,
          resizable: {
            beforeStart: true,
            afterEnd: true
          }
        });
      }
    });
    this.initEvent();
  }

  initEvent(): void {
    this.event = new Event();
    this.event.eventStart = new Date();
    this.event.eventEnd = moment().add('hours', 1);
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (!isLoggedIn) {
      this.router.navigate(['/home/login']);
    }
  }

  selectAddress(place: any, location: string) {
    switch (location) {
      case 'home':
        this.homeLocation = new Location(place.place_id, place.formatted_address);
        break;
      case 'work':
        this.workLocation = new Location(place.place_id, place.formatted_address);
        break;
      case 'event':
        this.event.destination = new Location(place.place_id, place.formatted_address);
        break;
      case 'event':
        this.otherLocationDetails = new Location(place.place_id, place.formatted_address);
        break;
    }
  }

  saveLocation(): void {
    this.profileService.saveLocationDetails(this.homeLocation, this.workLocation).subscribe((data) => {
      this.profileService.setLocationDetails(this.homeLocation, this.workLocation);
      $('#locationModal').modal('toggle');
    });
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  saveEvent(): void {
    console.log(this.event);
    console.log(this.selectedPriorLocation);
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd
  }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.handleEvent('Dropped or resized', event);
    this.refresh.next();
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.modalData = { event, action };
    this.modal.open(this.modalContent, { size: 'lg' });
  }

  openEventModal(): void {
    this.displayEventModal = true;
  }

  addEvent(): void {
    this.events.push({
      title: 'New event',
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
      color: colors.red,
      draggable: true,
      resizable: {
        beforeStart: true,
        afterEnd: true
      }
    });
    this.refresh.next();
  }
}
