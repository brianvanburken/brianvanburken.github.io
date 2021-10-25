---
layout: post
title: Detecting Output Listeners in Angular
excerpt: "Detecting listeners on an EventEmitter in an Angular component."
tags:
  - Angular
  - EventEmitter
---

Sometimes you want to check if you have listeners attached to your `@Output` for your component to behave differently.
It is possible to take the current `EventEmitter` and get the number of listeners back.
In this blog post, I will exploit that to change the behavior of a component.

Well, let's start with a new Angular project and generate a new component called `ExampleComponent`.
We will add a simple message that shows that we are static, which means no listeners are attached or interactive.

```typescript
import { Component } from "@angular/core";

@Component({
  selector: "app-example",
  template: `<span>I'm a static message</span>`,
})
export class ExampleComponent {}
```

Next, we will add an EventEmitter with the name `myEvent` to the component to which other components can attach themselves.

```typescript
import { Component, EventEmitter, Output } from "@angular/core";

@Component({
  selector: "app-example",
  template: `<span>I'm a static message</span>`,
})
export class ExampleComponent {
  @Output() public myEvent = new EventEmitter<void>();
}
```

Now we can use this to check if we have attached listeners to let our component react to it.
We will add `ngOnInit` to our component in which we check for listeners and set a flag on our component indicating that we have listeners.
When another component listens to our event like so `<app-example (myEvent)="handle($event)"></app-example>`, we check if an observer is attached and set our flag if we have any listeners.

```typescript
import { Component, EventEmitter, OnInit, Output } from "@angular/core";

@Component({
  selector: "app-example",
  template: `<span>I'm a static message</span>`,
})
export class ExampleComponent implements OnInit {
  @Output() public myEvent = new EventEmitter<void>();

  public isInteractive = false;

  public ngOnInit() {
    this.isInteractive = this.myEvent.observers.length > 0;
  }
}
```

Now that we have our flag, we can finish up our component and swap our static message with the interactive one.
Below we have a fully functional component that changes text based on listeners.

```typescript
import { Component, EventEmitter, OnInit, Output } from "@angular/core";

@Component({
  selector: "app-example",
  template: `
    <span *ngIf="!isInteractive">I'm a static message.</span>
    <span *ngIf="isInteractive">I'm an interactive message.</span>
  `,
})
export class ExampleComponent implements OnInit {
  @Output() public myEvent = new EventEmitter<void>();

  public isInteractive = false;

  public ngOnInit(): void {
    this.isInteractive = this.myEvent.observers.length > 0;
  }
}
```
