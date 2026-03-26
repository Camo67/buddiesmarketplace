declare module "email-verifier" {
  type VerifyResult = {
    catchAll?: string;
    disposable?: string;
    dns?: string;
    emailAddress?: string;
    free?: string;
    mxs?: string[];
    smtp?: string;
    validFormat?: string;
  };

  type VerifyCallback = (error: Error | null, data: VerifyResult | null) => void;

  type VerifierOptions = {
    checkCatchAll?: boolean;
    checkDisposable?: boolean;
    checkFree?: boolean;
    validateDNS?: boolean;
    validateSMTP?: boolean;
    retries?: number;
  };

  export default class EmailVerifier {
    constructor(apiKey: string, options?: VerifierOptions);
    verify(email: string, callback: VerifyCallback): void;
    verify(email: string, options: Record<string, unknown>, callback: VerifyCallback): void;
  }
}
