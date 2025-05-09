declare module 'net-snmp' {
  export const Version1: number;
  export const Version2c: number;

  export interface SessionOptions {
    port?: number;
    timeout?: number;
    retries?: number;
    version?: number;
  }

  export interface Varbind {
    oid: string;
    type: number;
    value: any;
  }

  export function createSession(
    target: string,
    community: string,
    options?: SessionOptions
  ): Session;

  export class Session {
    get(oids: string[], callback: (error: Error | null, varbinds: Varbind[]) => void): void;
    set(varbinds: Varbind[], callback: (error: Error | null) => void): void;
    close(): void;
  }

  export const ObjectType: {
    OctetString: number;
    Integer: number;
    IpAddress: number;
    Counter: number;
    Gauge: number;
    TimeTicks: number;
    Opaque: number;
    Counter64: number;
  };
} 