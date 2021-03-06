import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {first} from 'rxjs/operators';

import {AlertService, AuthenticationService, UserService} from '@/_services';

@Component({
  templateUrl: 'login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService,
    private alertService: AlertService,
    private userService: UserService
  ) {
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    // redirect to home if already logged in
    if (this.authenticationService.currentUserValue) {
      this.router.navigate([this.returnUrl]);
    }
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  ngOnInit() {
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.loading = true;
      this.authenticationService.loginToken(token)
        .pipe(first())
        .subscribe(
          apiResponseUser => {
            if (apiResponseUser.ok) {
              this.router.navigate([this.returnUrl]);
            } else {
              this.alertService.error(apiResponseUser.msg);
              this.loading = false;
            }
          },
          error => {
            this.alertService.error('API Service Unavailable. ' + error);
            this.loading = false;
          });
    }

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  loginGoogle() {
    this.authenticationService.googleLogin()
      .then(data => {
        this.loading = false;
        console.log('g redirect to: ' + this.returnUrl);
        this.router.navigate([this.returnUrl]);
      })
      .catch(data => {
        this.alertService.error(data.message);
        this.loading = false;
      });
  }

  loginFacebook() {
    this.authenticationService.facebookLogin()
      .then(data => {
        this.loading = false;
        console.log('f redirect to: ' + this.returnUrl);
        this.router.navigate([this.returnUrl]);
      })
      .catch(data => {
        this.alertService.error(data.message);
        this.loading = false;
      });
  }


  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authenticationService.login(this.f.email.value, this.f.password.value)
      .then(data => {
        this.authenticationService.storeFirebaseUser(data.user);
        this.loading = false;
        console.log('regirect to: ' + this.returnUrl);
        this.router.navigate([this.returnUrl]);
      })
      .catch(data => {
        this.alertService.error(data.message);
        this.loading = false;
      });
  }
}
