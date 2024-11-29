// SPDX-FileCopyrightText: Copyright (C) 2023-2024 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { SvgIcon, SvgIconProps } from "@mui/material";

export function LichtblickLogo (props: SvgIconProps): JSX.Element {
  return (
    <SvgIcon viewBox="0 0 512 512" {...props}>
      <path d="M56 504.425C56.2998 502.101 57.4242 499.776 59.7479 497.451L220.982 354.733L220.382 354.133L220.682 353.833L146.474 288.286L115.741 261.287L59.523 211.715C57.1993 209.09 56.075 206.465 56.075 204.14C56.075 199.79 58.9983 196.04 63.3459 196.04H149.772C156.743 196.04 160.491 199.265 164.839 203.015L169.786 207.665L309.507 332.384C311.531 334.409 313.555 336.134 315.279 337.859C316.703 339.283 317.902 341.083 318.727 342.508C320.751 345.958 321.95 349.483 321.95 353.833C321.95 362.832 317.602 368.907 308.907 376.482L164.839 505.025C160.491 508.775 156.743 512 149.772 512H63.2709C60.3475 512 57.799 509.975 56.5997 507.35C56.2998 506.45 56 505.625 56 504.425ZM447.429 315.885H363.926C355.531 314.985 347.96 310.935 342.189 305.46L202.467 180.741C196.096 174.966 191.748 170.317 190.024 164.467C189.425 162.442 189.125 160.417 189.125 158.392C189.125 149.693 193.772 143.318 202.467 136.043L346.836 6.97466C350.059 4.0498 352.908 1.72492 357.255 0.599971C358.379 0 359.579 0 361.003 0H447.429C448.329 0 448.853 0 449.453 0.299985C449.753 0.299985 450.053 0.599971 450.353 0.599971C453.276 2.0249 455 4.94976 455 8.1746C455 10.7995 453.876 13.1244 451.252 15.7492L290.318 158.167L290.917 158.467L396.158 251.838L451.252 300.585C453.876 302.91 455 305.535 455 308.16C455 312.51 451.777 315.96 447.429 315.96V315.885Z" fill="currentColor" />
    </SvgIcon>
  );
}
