// This module declares types for apis initialised in preload.ts
declare global {
  namespace NodeJS {

    interface ElectronIpc {
      minimize: () => void,
      maximize: () => void,
      close: () => void,
      openDevTools: () => void,
      getSettings: () => Readonly<any>;
      setSettings: (data: any) => void;
    }

    interface Global {
      electronIpc?: ElectronIpc;
    }
  }
}

export {};
