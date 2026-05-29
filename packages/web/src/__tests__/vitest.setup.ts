import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";
import { installMatchMediaMock, resetViewport } from "./viewport";

installMatchMediaMock();

beforeEach(() => {
  resetViewport();
});
