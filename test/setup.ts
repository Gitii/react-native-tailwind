import { vi } from "vitest";
import { mockPlatform } from "./mocks/react-native";

vi.mock("react-native", () => ({
  Platform: mockPlatform,
}));
