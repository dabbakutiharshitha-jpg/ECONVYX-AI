import type { User as EconvyxUser } from './index.js';

declare global {
  namespace Express {
    // Keep Passport's Express.User compatible with the application's resolved user.
    interface User extends EconvyxUser {}
  }
}

export {};
