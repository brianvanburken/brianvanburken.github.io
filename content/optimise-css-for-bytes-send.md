+++
title = "Optimise CSS for bytes send"
date = 2026-01-31
draft = true
+++


In my blog I have a few shared properties between multiple selectors. While I shorten my CSS classes to mostly single characters it would be more efficient to combine selectors with the same properties. 
Example:

pre {
  margin-bottom:1.5rem;
}

nav, p {
  margin-bottom:1.5rem;
}

vs

pre, nav, p {
  margin-bottom:1.5rem;
}

Downside is if multiple repeated selectors become bigger than properties removed. This can be calculated.

**Note:**

Gulp plugin maken die dit berekend. In mijn website kan dus margin-top en margin-bottom op meerdere plekken worden gecombineerd. Mogelijk ontstaan er dan empty selectors. Also check gzip resultaat. Herhalende CSS kan kleiner zijn dan minder.
