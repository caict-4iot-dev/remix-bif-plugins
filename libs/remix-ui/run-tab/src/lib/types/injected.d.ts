export = InjectedProvider;
declare class InjectedProvider {
  constructor(executionContext: any);
  executionContext: any;
  getAccounts(cb: any): any;
  newAccount(passwordPromptCb: any, cb: any): void;
  resetEnvironment(): Promise<void>;
  getBalanceInEther(address: any): Promise<string>;
  getGasPrice(cb: any): void;
  signMessage(message: any, account: any, _passphrase: any, cb: any): void;
  getProvider(): string;
}
