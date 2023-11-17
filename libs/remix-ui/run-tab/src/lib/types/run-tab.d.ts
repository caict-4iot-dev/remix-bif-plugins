export class RunTab extends ViewPlugin {
  constructor(blockchain: any, config: any, fileManager: any, editor: any, filePanel: any, compilersArtefacts: any, networkModule: any, mainView: any, fileProvider: any);
  event: any;
  config: any;
  blockchain: Blockchain;
  fileManager: any;
  editor: any;
  logCallback: (msg: any) => void;
  filePanel: any;
  compilersArtefacts: any;
  networkModule: any;
  fileProvider: any;
  REACT_API: RunTabState;
  el: HTMLDivElement;
  setupEvents(): void;
  getSettings(): any;
  setEnvironmentMode(env: any): Promise<void>;
  createVMAccount(newAccount: any): any;
  sendTransaction(tx: any): any;
  getAccounts(cb: any): any;
  pendingTransactionsCount(): any;
  renderInstanceContainer(): void;
  instanceContainer: any;
  noInstancesText: any;
  renderSettings(): void;
  settingsUI: any;
  renderDropdown(udappUI: any, fileManager: any, compilersArtefacts: any, config: any, editor: any, logCallback: any): void;
  contractDropdownUI: any;
  renderRecorder(udappUI: any, fileManager: any, config: any, logCallback: any): void;
  recorderCount: any;
  recorderInterface: any;
  renderRecorderCard(): void;
  recorderCard: any;
  udappUI: any;
  renderComponent(): void;
  onReady(api: any): void;
  onInitDone(): void;
  recorder: Recorder;
  // syncContracts(): void
}
import { ViewPlugin } from "@remixproject/engine-web";
import { Blockchain } from "./blockchain";
import { RunTabState } from "../reducers/runTab";
import { Recorder } from "./recorder";

