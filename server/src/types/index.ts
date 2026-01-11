// Global type augmentations for Express

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
      };
    }
  }
}

// This export is required to make this a module
export {};

