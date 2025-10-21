import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let mockHandler: HttpHandler;

  beforeEach(() => {
    mockHandler = {
      handle: jest.fn(),
    } as any;
    localStorage.clear();
  });

  it('should add Authorization header when token exists', () => {
    localStorage.setItem('access_token', 'test-token-123');
    const req = new HttpRequest('GET', '/api/tasks');
    let clonedReq: HttpRequest<any>;

    mockHandler.handle = jest.fn((request) => {
      clonedReq = request;
      return null as any;
    });

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, mockHandler.handle);
    });

    expect(clonedReq!.headers.get('Authorization')).toBe('Bearer test-token-123');
  });

  it('should not add Authorization header when no token', () => {
    const req = new HttpRequest('GET', '/api/tasks');
    let passedReq: HttpRequest<any>;

    mockHandler.handle = jest.fn((request) => {
      passedReq = request;
      return null as any;
    });

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, mockHandler.handle);
    });

    expect(passedReq!.headers.has('Authorization')).toBe(false);
  });
});
