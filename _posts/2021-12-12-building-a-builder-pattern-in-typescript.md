---
layout: post
title: Building A Builder Pattern in TypeScript
tags: ["TypeScript", "Pattern", "Generics"]
---

I've come across a few snippets of TypeScript where the type was forced on an object using `as`.
Maybe you've seen those before too.
I think using `as` is a bad thing and should be used as a last resort as you will lose type-safety, thus no help when the interface changes.
I had doubts about its usage when the code needed a partial object before completion. So I went to search for other solutions and opinions. 

Before discussing this further, let's create a scenario to be on the same page.
Say we have the following interface:

```typescript
interface Foo {
  bar: string;
  baz: string;
}
```

Here both `bar` and `baz` are required properties of `Foo`.
Both must be present for the object to be complete.
What if we wanted to first input `bar` and later input `baz`?
There are few options to achieve this.

## Type assertions

The first one is to enforce an object using `as`; this is called a ["Type assertion"][6].
Below is an example of this.

```typescript
const foo = {
  bar: 'bar'
} as Foo; // Here we enforce the type

console.log(foo.baz); // undefined

// Since `baz` isn't set, the following line could potentially crash if it does
// something with property `baz`
doSomethingWithFoo(foo);
```

The problem is the loss of type-safety.
If you enforce a type, the compiler will think it's a complete object, and this will cause bugs later in your program.

## Partial Utility Type

The other is to use [`Partial<Type>`][5]; this is a Utility Type provided by TypeScript.
Using the partial type, we can create a partial object to fill in the rest later.
Usage would look as follows.

```typescript
const foo: Partial<Foo> = {
  bar: 'bar';
};

console.log(foo.baz); // undefined

// If our object is not complete and `doSomethingWithFoo` accepts only complete
// objects of `Foo` the compiler will throw an error
doSomethingWithFoo(foo);
```

It is the best of both approaches.
The compiler guarantees safety and throws the error below if we pass the partial object along where the code expected a complete object.


```text
Argument of type 'Partial<Foo>' is not assignable to parameter of type 'Foo'.
  Types of property 'bar' are incompatible.
    Type 'string | undefined' is not assignable to type 'string'.
      Type 'undefined' is not assignable to type 'string'.(2345)
```

The only problem with `Partial` is that it still allows us to work with properties of `Foo` even if they aren't set.

## Builder Pattern

What if we only want to work with a complete object and only access its properties?
We needed some way to encapsulate the object until completed.
There is a known design pattern that solves this.
It is called the "Builder Pattern".

I've used this pattern in Java, and there I needed to write boilerplate such as setters for each property.
Since JavaScript, and thus TypeScript, is dynamic, I went to look for a solution that also takes away this boilerplate code.

First, a quick recap of what a builder is and its usage.
A builder is an encapsulation of a class or an interface.
You can add a property with setters that start with `with`.
In the case of Java, properties still can be optional; properties are by default `null`.
Below is an example usage as you would use it in Java:

```java
new FooBuilder()
  .withBar("bar")
  .withBaz("baz")
  .build();
```

I wanted to achieve something similar with less boilerplate and more type inference.
Also, I want to be as close to the conventions of Java.

### Defining the type

First off, I thought of the type of the pattern.
Using [`keyof`][4], I could infer all the properties and types of an interface.
With this, I could create a type that has all the properties.
After some searching on the web, I also found the feature of TypeScript called ["Template Literal Types"][7] that would help me create methods that start with `with`.
Combining everything, I got the following type.

```typescript
type AbstractBuilder<T, B = Record<string, unknown>> = {
  [K in keyof T & string as `with${Capitalize<K>}`]: (arg: T[K]) => AbstractBuilder<T, B & Record<K, T[K]>>;
};
```

A lot happens in a few lines.
I'll explain each line in more detail.

Starting with our type `AbstractBuilder<T, B = Record<string, unknown>>`.
Here we define `AbstractBuilder` that consists of two objects.
First is the generic `T` that refers to the interface we want the builder to manage.
The second, `B`, is the internal state of the builder.
In my prototype, this was the `Partial` of `T`.
But, changed it to a `Record` to solve a check I wanted to implement (more on that later).

The following line has the bulk of the type inference.
It can be broken down into two parts, definition and assignment.

In the definition part, before the semicolon, we take each property from our generic `T` (the interface).
Using `keyof`, we assign each property to type variable `K` and define it as a `string`.
Then using `as`, here we only rename so we are save to use it, we redefine its to the template literal starting with `with` and follow by the property name capitalized.
Our example with `Foo` gives us a property name `withBar` and `withBaz`.

In the assignment part, we assign a function to the property.
The function takes one argument that must be of the same type as the property of the interface defined in `K`.
This function then returns our `AbstractBuilder`, where our property and value type expand the state of `B`.

That last part will look as follows after you complete building `Foo`:

```typescript
AbstractBuilder<
  Foo,
  Record<string, unknown> & Record<'bar', string> & Record<'baz', string>
>
```

Now that we have a type that expands a state until completed, we still need a way to get it.
We extend our type with a new type that defines the final `build` method.

```typescript
type AbstractBuilder<T, B = Record<string, unknown>> =
  {...} 
  &
  { build: B extends T ? () => T : never; }
```

Here `build` returns our completed object of generic `T` if our internal state `B` is the same as `T`.
If it is not the case, we return `never`.
This trick enforces that we can only build a complete object and allows the compiler to tell us which properties are missing!
Optional fields marked with `?` do not count towards a complete object.

### The implementation

Now that we have a straightforward type, we can implement our Builder.
One of my requirements was to prevent boilerplate code, writing our getters.
So one of the things I started looking for was a "method missing" implementation like those in [Ruby][1] and [Python][2].
After some searching, I came across ES6 [Proxy][3] object.

A `Proxy` is, as [MDN][3] describes it:

> The Proxy object enables you to create a proxy for another object, which can intercept and redefine fundamental operations for that object.

The part "intercept and redefine fundamental operations" is what we are interested in.
After working with Proxy objects, I came up with the following implementation.

```typescript
function Builder<T>() {
  const Builder = new Proxy(
    {},
    {
      get(state: Record<string, unknown>, property: string) {
        if (property === "build") {
          return () => state;
        }

        const prop = property.charAt(4).toLowerCase() + property.slice(5);
        return (x: unknown) => {
          state[prop.toString()] = x;
          return Builder;
        };
      },
    }
  ) as AbstractBuilder<T>;

  return Builder;
}
```

Let me walk you through the code.
First, we define the function `Builder`, which takes a generic `T` that is passed along to the `AbstractBuilder` type.
The `T` references the interface we want the `Builder` to implement.
The usage is then `Builder<Foo>()`.

We then define the Proxy and pass in our empty state and define the `get` method on the `Proxy`.
This method receives our state and the property name we want to access, e.g. `"withBar"` or `"build"`.
If we have `"build"`, we return our inner state and "finish" the Builder.
Otherwise, take the property string, remove the with-prefix, and make the first character lowercase. 
This Builder assumes that you use property names that start with a lowercase character; if you diverge from this convention, you can change the code here to fit yours.
We return a function that takes an argument of any type, updates the state with the property name, and returns the builder to continue chaining.

We still have to force the Proxy to follow our `AbstractBuilder` type.
This is needed because the Proxy object is generic in itself.
We can guarantee full type-safety in a complete object and set the right type for the right property using our type.

Here is an example showing the pattern in action using the `Foo` interface.

```typescript
Builder<Foo>()
  .withBar("bar")
  .withBaz("baz")
  .build();
```

## Should you use it?

Good question.
It was an experiment to see what I wanted to implement was possible.
I've successfully used this in a large application and without problems.
Some colleagues were very enthusiastic about it, and others disliked it.
I liked this pattern to build "Test Builders", where we would create a fully complete builder with test data and easily use it in our unit tests.
So, it is up to you if you want to use it, easy to say, isn't it, and I recommend trying it yourself.

[1]: https://ruby-doc.org/core-2.7.3/BasicObject.html#method-i-method_missing
[2]: https://python-reference.readthedocs.io/en/latest/docs/dunderattr/getattr.html
[3]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
[4]: https://www.typescriptlang.org/docs/handbook/2/keyof-types.html
[5]: https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype
[6]: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
[7]: https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html
