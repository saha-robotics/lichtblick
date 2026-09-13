// SPDX-FileCopyrightText: Copyright (C) 2023-2026 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

/**
 * Short robot links: `https://diag.<domain>/<robot>` opens a live connection to
 * that robot, without the page having to carry `?ds=...&ds.url=...`.
 *
 * Off unless the deployment serves `/runtime/robot-link.json` (ours mounts it
 * from the lb chart, per environment):
 *
 *   socketUrl   the robot's Foxglove socket, `{robot}` replaced
 *   sessionUrl  optional; answers 204 while the browser's gateway cookie holds
 *   signInUrl   optional; where to refresh that cookie, `{robot}` replaced
 *
 * The cookie carries a short-lived token and a refused socket fails in the
 * browser with nothing to read, so the session is checked before connecting
 * and a refused one goes round sign-in first - once: coming back still refused
 * opens anyway rather than looping.
 *
 * Nothing else changes: a link that already names a data source (a recording
 * opened from Remote, a hand-typed socket) and the connection dialog behave as
 * they always did.
 */

export type RobotLinkConfig = {
  socketUrl: string;
  sessionUrl?: string;
  signInUrl?: string;
};

export type RobotLinkResult =
  | { kind: "none" }
  | { kind: "redirected" }
  | { kind: "connect"; robot: string; socketUrl: string; deepLink: string };

export type RobotLinkDeps = {
  href: string;
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  replace: (url: string) => void;
  now: () => number;
};

const CONFIG_PATH = "/runtime/robot-link.json";
const SIGN_IN_GUARD_MS = 60_000;
const ROBOT_PATH = /^\/([A-Za-z0-9][A-Za-z0-9_-]{1,63})\/?$/;

export function robotFromPath(pathname: string): string | undefined {
  return ROBOT_PATH.exec(pathname)?.[1];
}

const fill = (template: string, robot: string) =>
  template.replaceAll("{robot}", encodeURIComponent(robot));

export async function resolveRobotLink(deps: RobotLinkDeps): Promise<RobotLinkResult> {
  const url = new URL(deps.href);
  const robot = robotFromPath(url.pathname);
  if (robot == undefined || url.searchParams.has("ds")) {
    return { kind: "none" };
  }

  let config: RobotLinkConfig;
  try {
    const response = await deps.fetch(CONFIG_PATH, { cache: "no-store" });
    if (!response.ok) {
      return { kind: "none" };
    }
    config = (await response.json()) as RobotLinkConfig;
  } catch {
    return { kind: "none" };
  }
  if (typeof config.socketUrl !== "string" || config.socketUrl === "") {
    return { kind: "none" };
  }

  if (config.sessionUrl) {
    const guardKey = `robot-link:sign-in:${robot}`;
    try {
      const session = await deps.fetch(config.sessionUrl, {
        credentials: "include",
        cache: "no-store",
      });
      if (session.status === 401 || session.status === 403) {
        const last = Number(deps.storage.getItem(guardKey) ?? "0");
        if (config.signInUrl && deps.now() - last > SIGN_IN_GUARD_MS) {
          deps.storage.setItem(guardKey, String(deps.now()));
          deps.replace(fill(config.signInUrl, robot));
          return { kind: "redirected" };
        }
      } else if (session.ok) {
        deps.storage.removeItem(guardKey);
      }
    } catch {
      // Unreachable check: connect and let the socket say what it will.
    }
  }

  const socketUrl = fill(config.socketUrl, robot);
  const deepLink = new URL(url.href);
  deepLink.searchParams.set("ds", "foxglove-websocket");
  deepLink.searchParams.set("ds.url", socketUrl);
  return { kind: "connect", robot, socketUrl, deepLink: deepLink.href };
}
