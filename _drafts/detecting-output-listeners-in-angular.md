---
layout: post
title: Detecting Output Listeners in Angular
excerpt: "If you want to detect event if a listener is attached to Output in
your component"
tags:
    - Angular
    - EventEmitter
---

Sometimes you want to check if listeners are attached to your `@Output` in your
component. But, how would you do that?

Well, let's start with a basic blank component that shows a simple message.

```typescript
import { Component } from "@angular/core";

@Component({
  selector: "app-example",
  template: `<span>I'm a static message</span>`,
})
export class Example {}
```

Next, we will add an EventEmitter with the name `myEvent` to the component to
which other components can attach themselves to;

```typescript
export class Example {
  @Output myEvent = new EventEmitter<void>();
}
```

Now we can use this to check if we have attached listeners so we can let our
component react to it. We will add `ngOnInit` to our component in which we
check for listeners and set a flag on our component indicating that we have
listeners. When another component listens to our event like so
`<app-example (myEvent)="handle($event)"></app-example>` we check if there is an
observer attached and we set our flag if at least one is attached.

```typescript
export class Example implements OnInit {
  @Output myEvent = new EventEmitter<void>();
  isInteractive = false;

  ngOnInit() {
    this.isInteractive = this.myEvent.observers.length > 0;
  }
}
```

Now that we have our flag, we can finish up our component and swap our static
message with another one to show that we are interactive.

```typescript
import { Component, EventEmitter, OnInit, Output } from "@angular/core";

@Component({
  selector: "app-example",
  template: `
    <span *ngIf="!isInteractive">I'm a static message.</span>
    <span *ngIf="isInteractive">I'm an interactive message.</span>
  `,
})
export class Example implements OnInit {
  @Output myEvent = new EventEmitter<void>();
  isInteractive = false;

  ngOnInit() {
    this.isInteractive = this.myEvent.observers.length > 0;
  }
}
```

TODO: check if multiple instances make them all interactive?
