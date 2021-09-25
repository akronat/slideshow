// This module declares types for apis initialised in preload.ts
declare global {
  namespace NodeJS {

    interface ElectronIpc {
      send: (channel: string, data?: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => void;
      getSettings: () => Readonly<any>;
      setSettings: (data: any) => void;
    }

    interface Global {
      electronIpc?: ElectronIpc;
    }
  }
}

export {};
