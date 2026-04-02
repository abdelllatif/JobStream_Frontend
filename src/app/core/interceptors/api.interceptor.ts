import { HttpInterceptorFn } from '@angular/common/http';
import { API_URL } from '../constants/api.constants';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http') || req.url.startsWith('assets/')) {
    return next(req);
  }

  const apiReq = req.clone({
    url: `${API_URL}${req.url.startsWith('/') ? '' : '/'}${req.url}`
  });

  return next(apiReq);
};
