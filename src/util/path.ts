export const joinPath = (base: string, fileName: string) => base + (base.endsWith("/") ? "" : "/") + fileName;
