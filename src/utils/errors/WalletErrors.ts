export class WalletNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletNotReadyError';
  }
}