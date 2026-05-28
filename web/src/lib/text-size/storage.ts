const STORAGE_KEY = "text-size-large";

export function getTextSizeLargeFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setTextSizeLargeToStorage(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, enabled.toString());
}
