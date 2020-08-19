---
title: Become a Fire Keramik with Kotlin
tags:
    - kotlin
    - fp
---

I have noticed an interesting trend here at Avisi: an increasing number of teams are choosing Kotlin for their projects! Kotlin allows programmers to utilize more aspects of functional programming. This made me wonder, how far can you go with functional programming in Kotlin?

While searching for a definition of the basics of functional programming, I found an interesting PDF-file that was created by smart people from the functional programming community. The document is called "LambdaConf Standardised Ladder of Functional Programming" and you can download it here (sadly the original host of the file has disappeared). It breaks down various concepts and skills into levels. The first level is called "Fire Keramik", which inspired the title of this blog. There has been some [criticism] about this list, but in my opinion, it's a good starting point and uses some of the fun of "skill trees" found in games. To become a "Fire Keramik", you need to learn the following concepts and skills:

*Concepts*

- Immutable data
- Second-Order Functions
- Constructing & Destructuring
- Function Composition
- Higher-Order Functions & Lambdas

*Skills*

- Use second-order functions
- Destructuring values to access their components
- Use data-types to represent optionality
- Read basic type signatures
- Pass lambdas to second-order functions

In this blog post, I will explore the possibilities of using all these concepts and skills in Kotlin. For the sake of brevity, I won't go into the details as to why you should apply it.
Without further ado, let's get into the first concept!

## Immutable data

Immutable data is data that cannot be changed after it has been initialized. To "change" immutable data, you have to create a copy of the data and apply your change in the process. Kotlin has a similar concept using `val` and `var`. `val` allows the programmer to mark a value as `read-only` after its initialization. You won't be able to override this in the code later and if you try to change its value, the compiler will throw an error at you. Kotlin won't enforce immutability, so the choice between `val` and `var` is up to the programmer.

```kotlin
class Birthday(val day: Int, val month: Int, val year: Int)

class Person(val name: String, val age: Birthday)


val age = Birthday(1, 1, 1970)
val person = Person("Nick", age)
age.year = age.2020 // Throws an compiler error
person.age.year = 2020 // Throws an compiler error
```

## Use data types to represent optionality

In Java, optionality is represented by using `Optional`. This is similar to Haskell's `Maybe` type. You won't find these representations in Kotlin. Kotlin tries to solve the ["The Billion Dollar Mistake"] in another way by setting all values as non-nullable by default! You can explicitly mark values as optional by using the `?` operator which makes it `nullable`. The example code below shows that the value 'email' is optional.

```kotlin
class User(val username: String, val password: String, val email: String?)

// Returns the user if found, else null
val user: User? = getUserByUsername(username)
val email: String? = user?.email

// Here we can create a new user and use the email from the previous user.
// If there isn't an user, we set a default email
val newUser = User(username, password, email ?: "default@email.xyz")
```

## Read basic type signatures

This is probably the easiest achievable skill to attain in Kotlin. Everything in Kotlin is strongly typed, which forces you to define the types. Below is an example containing a simple data-class in which the `Person` class has typed parameters. You can see that `name` is of type `String` and `age` is of type `Int`.


```kotlin
class Person(val name: String, val age: Int)
```

## Constructing & Destructuring

Constructing is the process of putting values together and destructuring is a way to get the values back. A simple example is the `Pair` class in Kotlin.

```kotlin
val name = "Kotlin"
val age = 9
val person = Pair(name, age)
```

If you want to extract the values from the pair, you can destructure it on the left-hand side of the equation. The destructuring is done in the same order as the structuring. To make sure you only get certain specific values, you can use an underscore as a placeholder indicating that the value should be ignored.

```
val (_, age) = Pair("Kotlin", 9)
println(age)
```

This also works for data classes in Kotlin.

## Higher-Order Functions & Lambdas

This is nothing more than a fancy name for a function that either takes a function as an argument, or has a function as its return value, or both! Still confused? The most used and well-known example of a higher-order function is `map`. A `map` function is a function that takes a lambda (a function), calls it, and returns a list with the results of the map function, applied to each element of the original list. Here is an example of the usage of `map`:

```kotlin
val squaredValues = listOf(1, 2, 3, 4).map { it * it }
```

## Second-Order Functions

These functions come right after the "Higher-Order Functions" and it takes a function that takes a function. Pretty abstract, right? You can find examples of this in mathematics where you create the formula for a parabola in code. A more widely used example is the concept of currying. Currying (sadly, it has nothing to do with the delicious dish) is the concept of breaking a function, which takes multiple arguments, into smaller functions which each take a single argument and return a new function. Currying is not supported out of the box, but it can be achieved by using helper functions.

```kotlin
fun add(a: Int, b:Int): Int {
    return a + b
}

fun <A, B, C> partial2(f: (A, B) -> C, a: A): (B) -> C {
    return { b: B -> f(a, b)}
}

// Break up add and set its first input to 1. This will return a new function
// that always adds 1 to the next argument.
val add1 = partial2(::add, 1)

val result = add1(2) // result = 3
```

`Partial2` takes a function and the first argument of that function. This will return a new function that waits for the second argument to finish up the calculation. The new function can be passed around and applied to other values. Alternatively, you can do it with an extension method:

```kotlin
fun <A,B,C> Function2<A,B,C>.partial(a: A): (B) -> C {
    return {b -> invoke(a, b)}
}

val add1: (Int) -> Int = (::add).partial(1)
```

## Functional Composition

Composition is, in abstraction, creating something new by putting things together. In the example below, we will combine two functions into new functions. The new function can be composed with another function which allows you to build up a more powerful function from smaller functions. This isn't something that comes out of the box in Kotlin, yet is still achievable! We can achieve it by using callable references and pass them to a compose helper function. This combines (composes) two functions together to get a new function.

```kotlin
fun isOdd(x: Int) = x % 2 != 0
fun length(s: String) = s.length

// Define a function that takes two functions and return a new one.
fun <A, B, C> compose(f: (B) -> C, g: (A) -> B): (A) -> C {
    return { x -> f(g(x)) }
}

// Combine isOdd and length methods and store the combined function
// as variable.
val oddLength = compose(::isOdd, ::length)

val strings = listOf("a", "ab", "abc")

strings.filter(oddLength) == listOf("a", "abc")
```

## Closing words

Now you know all "beginner" concepts and skills to start writing functional code in Kotlin. All of this can be applied to existing code bases without much change. We looked at the basics and as you can read it is possible to code functionally in this language. We didn't go deep, but this is at least a promising start. If you're interested, The Standardized Ladder of Functional Programming discusses many other topics that can be applied to Kotlin with which you can dive deeper!
