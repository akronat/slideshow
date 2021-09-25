declare global {
  namespace NodeJS {

    interface ElectronIpc {
      send: (channel: string, data?: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
    }

    interface Global {
      electronIpc: ElectronIpc;
    }
  }
}

export {};
