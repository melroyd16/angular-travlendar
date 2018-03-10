import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserLoginService } from '../services/user-login.service';
import { UserRegistrationService } from '../services/user-registration.service';
import { CognitoCallback, LoggedInCallback } from '../services/cognito.service';

declare let AWS: any;
declare let AWSCognito: any;

@Component({
  selector: 'awscognito-angular2-app',
  template: '<p>Hello and welcome!"</p>'
})
export class AboutComponent {

}

export class RegistrationUser {
  name: string;
  email: string;
  password: string;
}

@Component({
  selector: 'awscognito-angular2-app',
  templateUrl: './landinghome.html'
})
export class HomeLandingComponent {
  email: string;
  password: string;
  errorMessage: string;
  modalDisplay: string;
  registrationUser: RegistrationUser;
  router: Router;
  errorMessage: string;

  constructor(public router: Router,
    public userService: UserLoginService) {
    this.onInit();
  }

  onInit() {
    this.registrationUser = new RegistrationUser();
    this.errorMessage = null;
  }

  ngOnInit() {
    this.errorMessage = null;
    this.modalDisplay = 'login';
    this.userService.isAuthenticated(this);
  }

  onLogin() {
    if (this.email == null || this.password == null) {
      this.errorMessage = 'All fields are required';
      return;
    }
    this.errorMessage = null;
    this.userService.authenticate(this.email, this.password, this);
  }

  cognitoCallback(message: string, result: any) {
    if (this.modalDisplay === 'login') {
      if (message != null) { // error
        this.errorMessage = message;
        if (this.errorMessage === 'User is not confirmed.') {
          this.router.navigate(['/home/confirmRegistration', this.email]);
        } else if (this.errorMessage === 'User needs to set password.') {
          this.router.navigate(['/home/newPassword']);
        }
      } else {
        $('#loginModal').modal('toggle');
        this.router.navigate(['/calendar']);
      }
    } else if (this.modalDisplay === 'register') {
      if (message != null) { // error
        this.errorMessage = message;
      } else { // success
        // move to the next step
        this.router.navigate(['/home/confirmRegistration', result.user.username]);
      }
    }
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (isLoggedIn) {
      this.router.navigate(['/calendar']);
    }
  }

  toggleModals(modal1: string, modal2: string) {
    $('#' + modal1).modal('toggle');
    $('#' + modal2).modal('toggle');
  }

  onRegister() {
    this.errorMessage = null;
    this.userRegistration.register(this.registrationUser, this);
  }

}

@Component({
  selector: 'awscognito-angular2-app',
  templateUrl: './home.html'
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit() {

  }
}
