import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserRegistrationService } from '../../../services/user-registration.service';
import { UserLoginService } from '../../../services/user-login.service';
import { CognitoCallback } from '../../../services/cognito.service';

export class NewPasswordUser {
  username: string;
  existingPassword: string;
  password: string;
}
/**
 * This component is responsible for displaying and controlling
 * the registration of the user.
 */
@Component({
  selector: 'awscognito-angular2-app',
  templateUrl: './newpassword.html'
})
export class NewPasswordComponent implements CognitoCallback, OnInit {
  registrationUser: NewPasswordUser;
  router: Router;
  errorMessage: string;

  constructor(public userRegistration: UserRegistrationService, public userService: UserLoginService, router: Router) {
    this.router = router;
    this.onInit();
  }

  onInit() {
    this.registrationUser = new NewPasswordUser();
    this.errorMessage = null;
  }

  ngOnInit() {
    this.errorMessage = null;
    this.userService.isAuthenticated(this);
  }

  onRegister() {
    this.errorMessage = null;
    this.userRegistration.newPassword(this.registrationUser, this);
  }

  cognitoCallback(message: string, result: any) {
    if (message != null) { // error
      this.errorMessage = message;
    } else { // success
      // move to the next step
      this.router.navigate(['/calendar']);
    }
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (isLoggedIn) {
      this.router.navigate(['/calendar']);
    }
  }
}
