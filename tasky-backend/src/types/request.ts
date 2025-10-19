import type { Request } from "express";
//!(req as any).user?.userId ====> this is disables the typescript error without proper typing
// Alternative: you can also declare module augmentation (preferable for global use)
// in that way we don't need to import AuthenticatedRequest every time
//we dont import request and extend it we are editing the global namespace of express
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        directManagerId?: string;
        email?: string;
        [key: string]: any;
      };
    }
  }
}

// Extend the Express Request interface to include user data
// //importing the normal Request interface from express and extending it and add our data
// //! in that way we should always use AuthenticatedRequest in our controllers where we expect user data
// //! check the following middleware that adds the user data to the noraml req
// export interface AuthenticatedRequest extends Request {
//   user?: {
//     userId: string;
//     role: string;
//     directManagerId?: string;
//     email?: string;
//     [key: string]: any;
//   };
// }
