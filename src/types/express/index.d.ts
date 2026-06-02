// Augment Express Request to carry the authenticated user payload
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      company_id: string;
      erpType: string;
      permissions: string[];
      [key: string]: unknown;
    };
  }
}
