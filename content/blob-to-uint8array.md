+++
title = "Blob to Uint8Array"
date = 2026-01-31
draft = true
+++


return this.httpClient.get(url, { responseType: 'blob' })
.pipe(
        take(1),
        switchMap((blob: Blob): Promise => new Response(blob).arrayBuffer()),
        map((array) => new Uint8Array(array)),
      )
      .subscribe(
        (response: Uint8Array) => {
        }
      );

