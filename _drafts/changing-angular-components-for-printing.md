---
layout: post
title: Changing Angular Components for Printing
excerpt: "When the user is printing a page we wanted our components to behave
different without using CSS."
tags:
    - Angular
    - EventListener
    - TypeScript
---

To save the user, and the environment, ink when printing we can use the handy
`@media print` in CSS to hide/show elements and change styling of the page.
But, sometimes we want our components to behave different; not the styling.
An example of this is client-side pagination. Say we have a table which
is paginated and the user wants to print the page. In this case we want to show
all the results not those on the first page; given that there aren't too
much results. Pre-rendering the entire table and hiding it with CSS is an option.
It would work, but decreases the performance of our web application.

In this case, we want to keep track if the user wants to print and then show all
the results. So how would we achieve this?

We can use global event listener to check if printing is trigger. In this
blogpost we will build an example Angular component that displays a message
only when we are printing. We will use flags to state we are printing.
Afterwards you can adapt this to you liking and write your own logic around this.
For the complete solution you can scroll to the end of this post.

We'll start with a new Angular application and use the main `AppComponent`. This
component will have a button. When the user clicks on that button we trigger the
browser's native print dialog using [`window.print`][1].

```typescript
import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  template: `<button (click)="print($event)">Print</button>`,
})
export class AppComponent {
  public print(event: MouseEvent): void {
    event.preventDefault();
    window.print();
  }
}
```

Next, we will add a boolean flag with which we keep track of our printing state.
We are either in printing state or we aren't. We also add the message we want to
display for printing. We set the flag to `true` when the user clicks the button
and `false` after the printing.

```typescript
import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  template: `
    <button (click)="print($event)">Print</button>
    <span *ngIf="isPrinting">I'm only visible when printing.</span>
  `,
})
export class AppComponent {
  public isPrinting = false;

  public print(event: MouseEvent): void {
    event.preventDefault();
    this.isPrinting = true;
    window.print();
    this.isPrinting = false;
  }
}
```

If we start the application and click the button you will see the message flash
for a few milliseconds and then disappears; for some browsers this is so fast you
won't even notice. JavaScript calls `window.print();`, but does not wait for it
to finish (finishing means closing the dialog). Instead it continues and sets our
flag back to `false`.

JavaScript does allows us to track printing events using [`window.onbeforeprint`][2]
and [`window.onafterprint`][3]. These events occur before and after the print
dialog. Let's change our component to add these global event listeners
using [`HostListener`][4].

```typescript
import { Component, HostListener } from "@angular/core";

@Component({
  selector: "app-root",
  template: `
    <button (click)="print($event)">Print</button>
    <span *ngIf="isPrinting">I'm only visible when printing</span>
  `,
})
export class AppComponent {
  public isPrinting = false;

  @HostListener("window:beforeprint")
  public onBeforePrint(): void {
    this.isPrinting = true;
  }

  @HostListener("window:afterprint")
  public onAfterPrint(): void {
    this.isPrinting = false;
  }

  public print(event: MouseEvent): void {
    event.preventDefault();
    window.print();
  }
}
```

When we click the button we still see it flash before our eyes. But, why is
this? This is the same issue we experienced with the first example! When we add
`console.log` to both the before and after functions, to debug, you will notice
that both get triggered at the same time! Most browsers trigger the listeners
for the preview window. That means that when the dialog with printing preview is
shown it calls both events. You would think that this means that is works. But,
the preview in the dialog and actual printed page are still different. We
should keep the `isPrinting` state as long the dialog isn't closed.

Somehow we need to tell the JavaScript runtime to execute the listeners
in our desired order. After some research I found out that using [`setTimeout`][5]
we can change the executing order in our call stack. So by if we wrap the
`window.print();` in a timeout and setting our flag back to `false` we defer the
execution of these functions. We set the printing dialog trigger to `0` and
resetting the flag to `1`; these numbers are the milliseconds we delay the calls.

```typescript
import { Component, HostListener } from "@angular/core";

@Component({
  selector: "app-root",
  template: `
    <button (click)="print($event)">Print</button>
    <span *ngIf="isPrinting">I'm only visible when printing</span>
  `,
})
export class AppComponent {
  public isPrinting = false;

  @HostListener("window:beforeprint")
  public onBeforePrint(): void {
    this.isPrinting = true;
  }

  @HostListener("window:afterprint")
  public onAfterPrint(): void {
    setTimeout(() => {
      this.isPrinting = false;
    }, 1);
  }

  public print(event: MouseEvent): void {
    event.preventDefault();
    this.isPrinting = true;
    setTimeout(() => {
      window.print();
    }, 0);
  }
}
```

JavaScript calls `print` and sets a timeout that waits for the callback to be
finished; by closing the dialog. In the background it calls
`onBeforePrint` function, and adds `onAfterPrint` to our call stack. Since our
call stack is still waiting for `print` to finish, `onAfterPrint` timeout
callback isn't called only after the callback for `window.print();` finishes.
After the dialog closes it continues in the call stack queue and sets our flag
to `false`.

Now that the JavaScript runtime waits for the print dialog to close we can see
what changes. Below is the final result when a user triggers the "print"
button. You'll get to see the message.

TODO: screenshot

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Window/print
[2]: https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeprint
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Window/afterprint_event
[4]: https://angular.io/api/core/HostListener
[5]: https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout
