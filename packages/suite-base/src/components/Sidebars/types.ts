// SPDX-FileCopyrightText: Copyright (C) 2023-2024 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

import { BadgeProps } from "@mui/material";

export type NewSidebarItem = {
  title: string;
  component: React.ComponentType;
  badge?: {
    color: BadgeProps["color"];
    count: number;
  };
};
