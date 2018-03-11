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
export class NewPasswordUser {
  username: string;
  existingPassword: string;
  password: string;
}

@Component({
  selector: 'awscognito-angular2-app',
  template: ''
})
export class LogoutComponent implements LoggedInCallback {

  constructor(public router: Router,
    public userService: UserLoginService) {
    this.userService.isAuthenticated(this);
  }

  isLoggedIn(message: string, isLoggedIn: boolean) {
    if (isLoggedIn) {
      this.userService.logout();
      this.router.navigate(['/home']);
    }

    this.router.navigate(['/home']);
  }
}


@Component({
  selector: 'awscognito-angular2-app',
  templateUrl: './landinghome.html'
})
export class HomeLandingComponent {
  loginEmail: string;
  fp1Email: string;
  rcEmail: string;
  loginPassword: string;
  fp2Password: string;
  errorMessage: string;
  modalDisplay: string;
  registrationUser: RegistrationUser;
  newPasswordUser: NewPasswordUser;
  registeredEmail: string;
  confirmationCode: string;
  verificationCode: string;
  private sub: any;

  constructor(public router: Router,
    public userService: UserLoginService,
    public userRegistration: UserRegistrationService) {
    this.onInit();
  }

  onInit() {
    this.registrationUser = new RegistrationUser();
    this.newPasswordUser = new NewPasswordUser();
    this.errorMessage = null;
  }

  ngOnInit() {
    this.errorMessage = null;
    this.modalDisplay = 'loginModal';
    this.userService.isAuthenticated(this);
  }

  onLogin() {
    if (this.loginEmail == null || this.loginPassword == null) {
      this.errorMessage = 'All fields are required';
      return;
    }
    this.errorMessage = null;
    this.userService.authenticate(this.loginEmail, this.loginPassword, this);
  }

  cognitoCallback(message: string, result: any) {
    if (this.modalDisplay === 'loginModal') {
      if (message != null) { // error
        this.errorMessage = message;
        if (this.errorMessage === 'User is not confirmed.') {
          this.registeredEmail = this.loginEmail;
          this.toggleModals('loginModal', 'confirmRegisterModal');
        } else if (this.errorMessage === 'User needs to set password.') {
          this.toggleModals('loginModal', 'newPasswordModal');
        }
      } else {
        $('#loginModal').modal('toggle');
        this.router.navigate(['/calendar']);
      }
    } else if (this.modalDisplay === 'registerModal') {
      if (message != null) {
        this.errorMessage = message;
      } else {
        this.registeredEmail = result.user.username;
        this.toggleModals('registerModal', 'confirmRegisterModal');
      }
    } else if (this.modalDisplay === 'confirmRegisterModal' || this.modalDisplay === 'newPasswordModal') {
      if (message != null) {
        this.errorMessage = message;
      } else {
        this.toggleModals(this.modalDisplay, 'loginModal');
      }
    } else if (this.modalDisplay === 'fp1Modal') {
      if (message == null && result == null) { // error
        this.toggleModals('fp1Modal', 'fp2Modal');
      } else { // success
        this.errorMessage = message;
      }
    } else if (this.modalDisplay === 'fp2Modal') {
      if (message != null) { // error
        this.errorMessage = message;
      } else { // success
        this.toggleModals('fp2Modal', 'loginModal');
      }
    } else if (this.modalDisplay === 'resendCodeModal') {
      if (message != null) {
        this.errorMessage = 'Something went wrong...please try again';
      } else {
        this.registeredEmail = this.rcEmail;
        this.toggleModals('resendCodeModal', 'confirmRegisterModal');
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
    this.modalDisplay = modal2;
  }

  onRegister() {
    this.errorMessage = null;
    this.userRegistration.register(this.registrationUser, this);
  }

  onConfirmRegistration() {
    this.errorMessage = null;
    this.userRegistration.confirmRegistration(this.registeredEmail, this.confirmationCode, this);
  }

  onNewPassword() {
    this.errorMessage = null;
    this.userRegistration.newPassword(this.newPasswordUser, this);
  }

  forgotPasswordCheckEmail() {
    this.errorMessage = null;
    this.userService.forgotPassword(this.fp1Email, this);
  }

  confirmFp2Password() {
    this.errorMessage = null;
    this.userService.confirmNewPassword(this.fp1Email, this.verificationCode, this.fp2Password, this);
  }

  resendCode() {
    this.userRegistration.resendCode(this.rcEmail, this);
  }
  resetModal() {
    this.modalDisplay = 'loginModal';
    this.errorMessage = null;
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
