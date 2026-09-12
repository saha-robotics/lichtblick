// SPDX-FileCopyrightText: Copyright (C) 2023-2026 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

// Fill the default-layout placeholder the web build leaves in index.html.
// Runs at image build, as part of the build stage: the runtime image serves
// files as an unprivileged user and must not need to write any of them.
const fs = require("fs");

const [html, layout] = process.argv.slice(2);
const placeholder = "/*LICHTBLICK_SUITE_DEFAULT_LAYOUT_PLACEHOLDER*/";
const page = fs.readFileSync(html, "utf8");
if (!page.includes(placeholder)) {
  throw new Error(`placeholder not found in ${html}`);
}
fs.writeFileSync(html, page.replace(placeholder, fs.readFileSync(layout, "utf8").trim()));
console.log("default layout baked into", html);
