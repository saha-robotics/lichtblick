// SPDX-FileCopyrightText: Copyright (C) 2023-2026 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

/**
 * The page was opened as a short robot link (suite-web's robotLink.ts): its
 * path and the socket it stands for. Set before the app renders.
 */
export type RobotLink = { path: string; socketUrl: string };

export function currentRobotLink(): RobotLink | undefined {
  return (globalThis as { LICHTBLICK_ROBOT_LINK?: RobotLink }).LICHTBLICK_ROBOT_LINK;
}

/**
 * What the address bar should show for a URL carrying the player's state.
 *
 * While the source is the robot the short link stands for, the short link -
 * `/<robot>`, without ds and ds.* - so it stays copyable and reopens the same
 * thing. Once the user opens anything else from the connection dialog, that
 * source's ordinary address at the root, so a reload does not send them back
 * to the robot.
 */
export function robotLinkAddress(url: URL, link: RobotLink | undefined): URL {
  if (!link) {
    return url;
  }
  const address = new URL(url.href);
  const ds = address.searchParams.get("ds");
  if (ds === "foxglove-websocket" && address.searchParams.get("ds.url") === link.socketUrl) {
    for (const key of [...address.searchParams.keys()]) {
      if (key === "ds" || key.startsWith("ds.")) {
        address.searchParams.delete(key);
      }
    }
    address.pathname = link.path;
    return address;
  }
  if (ds != undefined && address.pathname === link.path) {
    address.pathname = "/";
  }
  return address;
}
