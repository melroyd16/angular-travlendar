import { TestBed, inject } from '@angular/core/testing';

import { CentralApiService } from './central-api.service';

describe('CentralApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CentralApiService]
    });
  });

  it('should be created', inject([CentralApiService], (service: CentralApiService) => {
    expect(service).toBeTruthy();
  }));
});
