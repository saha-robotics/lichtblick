// SPDX-FileCopyrightText: Copyright (C) 2023-2026 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { useEffect } from "react";
import { createRoot } from "react-dom/client";

import Logger from "@lichtblick/log";
import type { IDataSourceFactory } from "@lichtblick/suite-base";
import CssBaseline from "@lichtblick/suite-base/components/CssBaseline";

import { CompatibilityBanner } from "./CompatibilityBanner";
import { canRenderApp } from "./canRenderApp";
import { resolveRobotLink } from "./robotLink";

const log = Logger.getLogger(__filename);

function LogAfterRender(props: React.PropsWithChildren): React.JSX.Element {
  useEffect(() => {
    // Integration tests look for this console log to indicate the app has rendered once
    // We use console.debug to bypass our logging library which hides some log levels in prod builds
    console.debug("App rendered");
  }, []);
  return <>{props.children}</>;
}

export type MainParams = {
  dataSources?: IDataSourceFactory[];
  extraProviders?: React.JSX.Element[];
  rootElement?: React.JSX.Element;
};

export async function main(getParams: () => Promise<MainParams> = async () => ({})): Promise<void> {
  log.debug("initializing");

  window.onerror = (...args) => {
    console.error(...args);
  };

  const rootEl = document.getElementById("root");
  if (!rootEl) {
    throw new Error("missing #root element");
  }

  const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+)\./);
  const chromeVersion = chromeMatch ? parseInt(chromeMatch[1] ?? "", 10) : 0;
  const isChrome = chromeVersion !== 0;

  const canRender = canRenderApp();
  const banner = (
    <CompatibilityBanner
      isChrome={isChrome}
      currentVersion={chromeVersion}
      isDismissable={canRender}
    />
  );

  if (!canRender) {
    const root = createRoot(rootEl);
    root.render(
      <LogAfterRender>
        <CssBaseline>{banner}</CssBaseline>
      </LogAfterRender>,
    );
    return;
  }

  // A short robot link (`/<robot>`) is resolved before anything renders: it may
  // have to go round sign-in first, and the app must start with the connection
  // already in its deep link. Uses the browser's own fetch - suite-base's
  // overwriteFetch has not run yet. See robotLink.ts.
  const robotLink = await resolveRobotLink({
    href: globalThis.location.href,
    fetch: async (input, init) => await globalThis.fetch(input, init),
    storage: globalThis.sessionStorage,
    replace: (url) => {
      globalThis.location.replace(url);
    },
    now: Date.now,
  });
  if (robotLink.kind === "redirected") {
    return;
  }
  if (robotLink.kind === "connect") {
    (globalThis as { LICHTBLICK_ROBOT_LINK?: unknown }).LICHTBLICK_ROBOT_LINK = {
      path: `/${robotLink.robot}`,
      socketUrl: robotLink.socketUrl,
    };
  }

  // Use an async import to delay loading the majority of suite-base code until the CompatibilityBanner
  // can be displayed.
  const { installDevtoolsFormatters, overwriteFetch, waitForFonts, initI18n, StudioApp } =
    await import("@lichtblick/suite-base");
  installDevtoolsFormatters();
  overwriteFetch();
  // consider moving waitForFonts into App to display an app loading screen
  await waitForFonts();
  await initI18n();

  const { WebRoot } = await import("./WebRoot");
  const params = await getParams();
  const rootElement = params.rootElement ?? (
    <WebRoot
      extraProviders={params.extraProviders}
      dataSources={params.dataSources}
      deepLink={robotLink.kind === "connect" ? robotLink.deepLink : undefined}
    >
      <StudioApp />
    </WebRoot>
  );

  const root = createRoot(rootEl);
  root.render(
    <LogAfterRender>
      {banner}
      {rootElement}
    </LogAfterRender>,
  );
}
