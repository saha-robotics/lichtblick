// SPDX-FileCopyrightText: Copyright (C) 2023-2026 Bayerische Motoren Werke Aktiengesellschaft (BMW AG)<lichtblick@bmwgroup.com>
// SPDX-License-Identifier: MPL-2.0

// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as _ from "lodash-es";
import { useEffect } from "react";
import { useDebounce } from "use-debounce";

import { useDeepMemo } from "@lichtblick/hooks";
import {
  MessagePipelineContext,
  useMessagePipeline,
} from "@lichtblick/suite-base/components/MessagePipeline";
import { EventsStore, useEvents } from "@lichtblick/suite-base/context/EventsContext";
import { PLAYER_CAPABILITIES } from "@lichtblick/suite-base/players/constants";
import { AppURLState, updateAppURLState } from "@lichtblick/suite-base/util/appURLState";
import { currentRobotLink, robotLinkAddress } from "@lichtblick/suite-base/util/robotLinkAddress";

const selectCanSeek = (ctx: MessagePipelineContext) =>
  ctx.playerState.capabilities.includes(PLAYER_CAPABILITIES.playbackControl);
const selectCurrentTime = (ctx: MessagePipelineContext) => ctx.playerState.activeData?.currentTime;
const selectUrlState = (ctx: MessagePipelineContext) => ctx.playerState.urlState;
const selectSelectedEventId = (store: EventsStore) => store.selectedEventId;

/**
 * The URL decoded for readability, but only when decoding does not change what
 * it says. A data source URL that carries its own query string - a presigned S3
 * link - has `%26` in it; decoded, that becomes `&` and the signature's
 * parameters spill out of ds.url into the page's query, so the address no
 * longer opens the file. Such a URL is left encoded.
 */
function addressBarHref(url: URL): string {
  const decoded = decodeURIComponent(url.href);
  try {
    const reparsed = new URL(decoded);
    if (
      JSON.stringify([...reparsed.searchParams.entries()]) ===
      JSON.stringify([...url.searchParams.entries()])
    ) {
      return decoded;
    }
  } catch {
    // Not a URL once decoded; keep the encoded one.
  }
  return url.href;
}

function updateUrl(newState: AppURLState) {
  const newStateUrl = updateAppURLState(new URL(window.location.href), newState);
  const address = robotLinkAddress(newStateUrl, currentRobotLink());
  window.history.replaceState(undefined, "", addressBarHref(address));
}

/**
 * Syncs our current player state and time with the URL in the address bar.
 */
export function useStateToURLSynchronization(): void {
  const playerUrlState = useMessagePipeline(selectUrlState);
  const stablePlayerUrlState = useDeepMemo(playerUrlState);
  const canSeek = useMessagePipeline(selectCanSeek);
  const currentTime = useMessagePipeline(selectCurrentTime);
  const [debouncedCurrentTime] = useDebounce(currentTime, 500, { maxWait: 500 });
  const selectedEventId = useEvents(selectSelectedEventId);

  // Sync current time with the url.
  useEffect(() => {
    updateUrl({
      time: canSeek ? debouncedCurrentTime : undefined,
    });
  }, [canSeek, debouncedCurrentTime]);

  // Sync player state with the url.
  // When an mcap-bundle lookup key is present, skip writing ds/dsParams to avoid URL length issues.
  useEffect(() => {
    if (stablePlayerUrlState == undefined) {
      return;
    }

    const currentUrl = new URL(globalThis.location.href);
    if (currentUrl.searchParams.get("mcap-bundle")) {
      return;
    }

    updateUrl({
      ds: stablePlayerUrlState.sourceId,
      dsParams: _.pickBy(
        {
          ...stablePlayerUrlState.parameters,
          eventId: selectedEventId,
        },
        _.isString,
      ),
      dsParamsArray: _.pickBy(
        stablePlayerUrlState.parameters,

        _.isArray,
      ),
    });
  }, [selectedEventId, stablePlayerUrlState]);
}
