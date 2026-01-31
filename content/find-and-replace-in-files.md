+++
title = "Find and replace in files using terminal"
date = 2026-01-31
draft = true
+++


`rg -l VerkrijgerData src | xargs -I@ sed -i '' 's/VerkrijgerData/OvbFormVerkrijger/g' @``

Example 2:
`rg '.with\w+' -l | xargs -I@ sed -i '' 's/.with\([A-za-z]*\)(/.with("\1",/g' @``

.withId(1) -> .with('id', 1)
