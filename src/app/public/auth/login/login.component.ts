import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserLoginService } from '../../../services/user-login.service';
import { CognitoCallback, LoggedInCallback } from '../../../services/cognito.service';

@Component({
  selector: 'awscognito-angular2-app',
  templateUrl: './login.html'
})
export class LoginComponent implements CognitoCallback, LoggedInCallback, OnInit {
  email: string;
  password: string;
  errorMessage: string;

  constructor(public router: Router,
    public userService: UserLoginService) { }

  ngOnInit() {
    this.errorMessage = null;
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
    if (message != null) { // error
      this.errorMessage = message;
      if (this.errorMessage === 'User is not confirmed.') {
        this.router.navigate(['/home/confirmRegistration', this.email]);
      } else if (this.errorMessage === 'User needs to set password.') {
        this.router.navigate(['/home/newPassword']);
      }
    } else {
      this.router.navigate(['/calendar']);
    }
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (isLoggedIn) {
      this.router.navigate(['/calendar']);
    }
  }
}
