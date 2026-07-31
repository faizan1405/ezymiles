import { vi } from "vitest";

// Mock server-only — build-time guard, not needed in tests.
vi.mock("server-only", () => ({}));
