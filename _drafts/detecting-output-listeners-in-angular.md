---
layout: post
title: Detecting Output Listeners in Angular
excerpt: "We wanted to detect listeners on a EventEmitter in an Angular component"
tags:
  - Angular
  - EventEmitter
---

Sometimes you want to check if you have listeners attached to your `@Output` in
order for your component to behave different. But, how would you do that?

Well, let's start with a new Angular component. We will add a simple message
that shows if we are static, that means no listeners attached, or interactive.

```typescript
import { Component } from "@angular/core";

@Component({
  selector: "app-example",
  template: `<span>I'm a static message</span>`,
})
export class Example {}
```

Next, we will add an EventEmitter with the name `myEvent` to the component to
which other components can attach themselves to.

```typescript
import { Component, EventEmitter, Output } from "@angular/core";

@Component({
  selector: "app-example",
  template: `<span>I'm a static message</span>`,
})
export class Example {
  @Output() public myEvent = new EventEmitter<void>();
}
```

Now we can use this to check if we have attached listeners so we can let our
component react to it. We will add `ngOnInit` to our component in which we
check for listeners and set a flag on our component indicating that we have
listeners. When another component listens to our event like so
`<app-example (myEvent)="handle($event)"></app-example>` we check if there is an
observer attached and we set our flag if we have any listeners.

```typescript
import { Component, EventEmitter, OnInit, Output } from "@angular/core";

@Component({
  selector: "app-example",
  template: `<span>I'm a static message</span>`,
})
export class Example implements OnInit {
  @Output() public myEvent = new EventEmitter<void>();

  public isInteractive = false;

  public ngOnInit() {
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
  @Output() public myEvent = new EventEmitter<void>();

  public isInteractive = false;

  public ngOnInit(): void {
    this.isInteractive = this.myEvent.observers.length > 0;
  }
}
```

TODO: check if multiple instances make them all interactive?
