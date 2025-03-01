import { IUserAuth } from './user.interface';

export interface AuthenticatedRequest extends Request {
  readonly user: IUserAuth;
}
