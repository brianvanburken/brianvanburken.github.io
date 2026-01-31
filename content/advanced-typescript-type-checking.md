+++
title = "Compile time typescript type checking of properties"
date = 2026-01-31
draft = true
+++


The combination used to limit some sizes with its usage of variant. As seen here below

```ts
type Size
	= 'huge'
	| 'large'
	| 'medium'
	| 'small'

type Variant
	= 'primary'
	| 'secondary'
	| 'tertiary'
	| 'brand'
	| 'ghost'

type SizeCheck<S, V> =
	S extends 'huge'
	? V extends 'primary'
		? S
		: ['size `huge` can only be used with `primary` variant']
	: S
```
Source:
- https://github.com/primait/pyxis/blob/master/packages/pyxis-react/src/components/Button/types.ts
- https://scribe.rip/m/global-identity?redirectUrl=https%3A%2F%2Fengineering.tableau.com%2Freally-advanced-typescript-types-c590eee59a12