import { TestBed, inject } from '@angular/core/testing';

import { UserParameterService } from './user-parameter.service';

describe('UserParameterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserParameterService]
    });
  });

  it('should be created', inject([UserParameterService], (service: UserParameterService) => {
    expect(service).toBeTruthy();
  }));
});
