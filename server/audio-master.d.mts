export function masterKey(script: string, model: string, credential: string): string;
export function getMaster(key: string): Buffer | null;
export function putMaster(key: string, pcm: Buffer): void;
export function pendingMaster(key: string): Promise<Buffer> | undefined;
export function beginMaster(key: string): boolean;
export function finishMaster(key: string, pcm?: Buffer, error?: unknown): void;
