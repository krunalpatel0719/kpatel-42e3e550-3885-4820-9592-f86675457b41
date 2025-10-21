import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrganizationsService],
    });

    service = TestBed.inject(OrganizationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch organizations list', () => {
    const mockOrgs = [{ id: 1, name: 'Test Org' }];

    service.getOrganizations().subscribe((orgs) => {
      expect(orgs).toEqual(mockOrgs);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/organizations');
    expect(req.request.method).toBe('GET');
    req.flush(mockOrgs);
  });
});
