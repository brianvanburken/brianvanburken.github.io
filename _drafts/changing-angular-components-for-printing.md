---
layout: post
title: Changing Angular Components for Printing
excerpt: "When the user is printing a page we want our components to behave
differently without using CSS"
tags:
    - Angular
    - Printing
---

To save the user, and the environment, ink for printing we can use
`@media print` in CSS to hide/show elements and change styling. But, sometimes
we want our components to behave totally different. An example of this is
client-side pagination. Say we have a table which is paginated, but if the user
wants to print the page we want to show all the results. This can be achieved by
pre-rendering the entire table and hiding it with CSS. It would work, but
drastically, and unnecessary so, decrease the performance of our webapplication.

For this case we want to keep track if the user wants to print and using a flag
make the component behave totally different. So how would we achieve this?

Let's make an example component that displays a message only when we are
printing. We start with a basic component that has a button which would trigger
the print dialog. In this blogpost we build it stepwise. But, if you want the
complete solution scroll to the end.

```typescript
import { Component, HostListener } from "@angular/core";

@Component({
  selector: "app-root",
  template: ` <button (click)="print($event)">Print</button> `,
})
export class AppComponent {
  public print(event: MouseEvent): void {
    event.preventDefault();
    window.print();
  }
}
```

When the user clicks the button we trigger the print dialog using
[`winow.print`][3]. Next, we will add a flag with which we keep track of our
printing state and the message we want to display for printing. We set this to
`true` when the user clicks the button and `false` after the printing.

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

  public print(event: MouseEvent): void {
    event.preventDefault();
    this.isPrinting = true;
    window.print();
    this.isPrinting = false;
  }
}
```

If you start the application and click the button you will see the message flash
for a few milliseconds and then disappears. This is because the `window.print`
is called and JavaScript does not wait for it to finish. Instead it just
continues.

JavaScript allows us to track printing events using
[`window.onbeforeprint`][1]/[`window.onafterprint`][2]. Using these methods we can
check if the user is printing the page. These events are triggered before and
after the print dialog.

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
this? When you add logs to both the before and after functions you will notice
that both get triggered at the same time!

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

[1]: https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeprint
[2]: https://developer.mozilla.org/en-US/docs/Web/API/Window/afterprint_event
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Window/print
