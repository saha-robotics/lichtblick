// SPDX-FileCopyrightText: Copyright (C) 2023-2026 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

import { resolveRobotLink, robotFromPath } from "./robotLink";

const CONFIG = {
  socketUrl: "wss://robots.example.com/api/u/ws/v1/{robot}/foxglove",
  sessionUrl: "https://robots.example.com/api/u/v1/session",
  signInUrl: "https://remote.example.com/lb/{robot}",
};

function response(status: number, body?: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function deps(options: { config?: Response; session?: Response | Error; href?: string } = {}) {
  const storage = new Map<string, string>();
  const fetch = jest.fn(async (input: string) => {
    if (input.includes("/runtime/robot-link.json")) {
      return options.config ?? response(200, CONFIG);
    }
    if (options.session instanceof Error) {
      throw options.session;
    }
    return options.session ?? response(204);
  });
  return {
    href: options.href ?? "https://diag.example.com/SR121S2",
    fetch,
    storage: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => void storage.set(k, v),
      removeItem: (k: string) => void storage.delete(k),
    },
    replace: jest.fn(),
    now: () => 1_000_000,
    stored: storage,
  };
}

describe("robotFromPath", () => {
  it.each([
    ["/SR121S2", "SR121S2"],
    ["/SR121S2/", "SR121S2"],
    ["/sr-1_a", "sr-1_a"],
  ])("reads %s as a robot", (path, robot) => {
    expect(robotFromPath(path)).toBe(robot);
  });

  it.each([
    "/",
    "/index.html",
    "/layouts/saha-default.json",
    "/a/b",
    "/x",
  ])("leaves %s alone", (path) => {
    expect(robotFromPath(path)).toBeUndefined();
  });
});

describe("resolveRobotLink", () => {
  it("turns /<robot> into a connection to that robot when the session holds", async () => {
    const d = deps();

    const result = await resolveRobotLink(d);

    expect(result.kind).toBe("connect");
    const link = new URL(result.kind === "connect" ? result.deepLink : "");
    expect(link.pathname).toBe("/SR121S2");
    expect(link.searchParams.get("ds")).toBe("foxglove-websocket");
    expect(link.searchParams.get("ds.url")).toBe(
      "wss://robots.example.com/api/u/ws/v1/SR121S2/foxglove",
    );
    expect(d.fetch).toHaveBeenCalledWith(CONFIG.sessionUrl, {
      credentials: "include",
      cache: "no-store",
    });
    expect(d.replace).not.toHaveBeenCalled();
  });

  it("sends an expired session round through sign-in, once", async () => {
    const d = deps({ session: response(401) });

    expect((await resolveRobotLink(d)).kind).toBe("redirected");
    expect(d.replace).toHaveBeenCalledWith("https://remote.example.com/lb/SR121S2");

    // Back from sign-in and still refused: open anyway rather than loop.
    const again = await resolveRobotLink(d);
    expect(again.kind).toBe("connect");
    expect(d.replace).toHaveBeenCalledTimes(1);
  });

  it("does nothing for links that already name a data source, or plain pages", async () => {
    for (const href of [
      "https://diag.example.com/SR121S2?ds=remote-file&ds.url=https%3A%2F%2Fb%2Ff.mcap",
      "https://diag.example.com/?ds=foxglove-websocket&ds.url=ws%3A%2F%2Flocalhost%3A8765",
      "https://diag.example.com/",
    ]) {
      const d = deps({ href });
      expect((await resolveRobotLink(d)).kind).toBe("none");
      expect(d.fetch).not.toHaveBeenCalled();
    }
  });

  it("is off where the deployment serves no robot-link config", async () => {
    const d = deps({ config: response(404) });

    expect((await resolveRobotLink(d)).kind).toBe("none");
    expect(d.replace).not.toHaveBeenCalled();
  });

  it("connects when the session check itself cannot be reached", async () => {
    const d = deps({ session: new Error("network") });

    expect((await resolveRobotLink(d)).kind).toBe("connect");
    expect(d.replace).not.toHaveBeenCalled();
  });
});
