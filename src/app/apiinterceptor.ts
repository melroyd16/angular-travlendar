import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { Callback, CognitoUtil } from './services/cognito.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  idToken: string;
  constructor(public cognitoUtil: CognitoUtil) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.cognitoUtil.getIdToken(new IdTokenCallback(this));
    const authReq = req.clone({ setHeaders: { Authorization: this.idToken } });
    return next.handle(authReq);
  }
}

export class IdTokenCallback implements Callback {
  constructor(public jwt: AuthInterceptor) { }

  callback() { }

  callbackWithParam(result) {
    this.jwt.idToken = result;
  }
}
