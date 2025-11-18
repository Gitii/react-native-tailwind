export type PlatformOS = "ios" | "android";

export const mockPlatform = {
  OS: "ios" as PlatformOS,
  select: <T>(specifics: { ios?: T; android?: T; default?: T }): T | undefined => {
    const os = mockPlatform.OS;
    if (os === "ios") return specifics.ios ?? specifics.default;
    if (os === "android") return specifics.android ?? specifics.default;
    return specifics.default;
  },
};

export function setPlatform(os: PlatformOS) {
  mockPlatform.OS = os;
}

// Callback registry for when platform changes
const platformChangeCallbacks: Array<() => void> = [];

export function onPlatformChange(callback: () => void) {
  platformChangeCallbacks.push(callback);
}

export function setPlatformAndNotify(os: PlatformOS) {
  mockPlatform.OS = os;
  platformChangeCallbacks.forEach((cb) => cb());
}
