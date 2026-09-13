// SPDX-FileCopyrightText: Copyright (C) 2023-2026 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

import { robotLinkAddress } from "./robotLinkAddress";

const LINK = {
  path: "/SR121S2",
  socketUrl: "wss://robots.example.com/api/u/ws/v1/SR121S2/foxglove",
};

describe("robotLinkAddress", () => {
  it("keeps the short address while the robot's own socket is the source", () => {
    const url = new URL(
      `https://diag.example.com/SR121S2?ds=foxglove-websocket&ds.url=${encodeURIComponent(LINK.socketUrl)}`,
    );

    expect(robotLinkAddress(url, LINK).href).toBe("https://diag.example.com/SR121S2");
  });

  it("gives the address back to any other source the user opens", () => {
    const url = new URL(
      "https://diag.example.com/SR121S2?ds=foxglove-websocket&ds.url=ws%3A%2F%2Flocalhost%3A8765",
    );

    const address = robotLinkAddress(url, LINK);
    expect(address.pathname).toBe("/");
    expect(address.searchParams.get("ds.url")).toBe("ws://localhost:8765");
  });

  it("changes nothing without a robot link", () => {
    const url = new URL("https://diag.example.com/?ds=remote-file&ds.url=x");

    expect(robotLinkAddress(url, undefined).href).toBe(url.href);
  });
});
