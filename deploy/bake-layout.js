// SPDX-FileCopyrightText: Copyright (C) 2023-2026 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

// Fill the default-layout placeholder the web build leaves in index.html.
// Runs at image build, as part of the build stage: the runtime image serves
// files as an unprivileged user and must not need to write any of them.
const fs = require("fs");

// The optional third argument is the layout URL Lichtblick loads on every open
// (Workspace's deploymentLayoutUrl) - ours is the fleet layout the cluster
// mounts from a ConfigMap - so links do not have to carry ?layoutUrl=.
const [html, layout, layoutUrl] = process.argv.slice(2);
const placeholder = "/*LICHTBLICK_SUITE_DEFAULT_LAYOUT_PLACEHOLDER*/";
const globalMarker = "global = globalThis;";
let page = fs.readFileSync(html, "utf8");
if (!page.includes(placeholder)) {
  throw new Error(`placeholder not found in ${html}`);
}
page = page.replace(placeholder, fs.readFileSync(layout, "utf8").trim());
if (layoutUrl) {
  if (!page.includes(globalMarker)) {
    throw new Error(`"${globalMarker}" not found in ${html}`);
  }
  page = page.replace(
    globalMarker,
    `${globalMarker}\n      globalThis.LICHTBLICK_SUITE_DEFAULT_LAYOUT_URL = ${JSON.stringify(layoutUrl)};`,
  );
}
fs.writeFileSync(html, page);
console.log("default layout baked into", html, layoutUrl ? `(layout URL ${layoutUrl})` : "");
