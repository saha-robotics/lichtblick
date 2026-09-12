#!/bin/sh
# Same mechanism the previous image used: the web build leaves a placeholder in
# index.html for a default layout, and this fills it in before nginx starts.
set -e
html=/usr/share/nginx/html/index.html
layout=/lichtblick/default-layout.json
[ -f "$layout" ] || exit 0
placeholder='/*LICHTBLICK_SUITE_DEFAULT_LAYOUT_PLACEHOLDER*/'
if grep -qF "$placeholder" "$html"; then
  # awk, not sed: the layout is JSON with every character sed would trip on.
  awk -v ph="$placeholder" -v f="$layout" 'BEGIN{while((getline l<f)>0) j=j l "\n"} {i=index($0,ph); if(i){print substr($0,1,i-1) j substr($0,i+length(ph))} else print}' "$html" > "$html.tmp" && mv "$html.tmp" "$html"
fi
