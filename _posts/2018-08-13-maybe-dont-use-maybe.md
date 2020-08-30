---
layout: post
title: Maybe Don't Use Maybe?
excerpt: "At my work I've come across a code that had more branches than were
possible in the logic of the domain."
tags:
    - Elm
    - Custom Types
    - Maybe
    - Monads
---

Your code could be littered with branches that result in invalid data and should
never happen, but are allowed. We found such a case, at my work, where we allowed
multiple variants of data, and it broke our code logic. We use [Elm][1] and fixed
it using its type system. Although we describe the solution for Elm in this blog,
the cases and fixes also apply to other similar languages like [Haskell][2] and
[PureScript][3]. In this blog post we find the seemly impossible bug using
examples written in Elm and go through a step by step progress to fix it. At the
end, you could find similar cases in your application and know a way to fix
them. Before we go fix our bug let’s get clear on the domain model.

## How did we get here?

Our domain contains the model "Question" which can have exactly one "Answer" or
is not answered yet. If the question has been answered then we receive the
timestamp and content of the answer. This all will be sent by an API using JSON.
Note: for this post, I've simplified our domain to this specific case.

Our back-end was built separate from the front-end and one of the decisions of
the back-end team was to send out both fields on the root level of the JSON
document. These fields will always be present and, when there is no answer yet,
default to `null`.

Our domain code started out like this:

{% prism elm %}
type alias Question =
    { id: String
    , date : Date
    , content: String
    , answer: Answer
    }

type Answer = Answer (Maybe String) (Maybe Date)
{% endprism %}

Here we store both fields on the question at the same level as we received from
the back-end. And our decoder looked like this:

{% prism elm %}
import Json.Decode as JD
import DateTime  -- Note: DateTime contains our internal decoder for dates

decoder : JD.Decoder Question
decoder =
    JD.map4 Question
        (JD.field "id" JD.string)
        (JD.field "date" DateTime.decoder)
        (JD.field "content" JD.string)
        (JD.map2 Answer
            (JD.field "answer" (JD.maybe JD.string))
            (JD.field "answeredOn" (JD.maybe DateTime.decoder))
		)
{% endprism %}

## Maybe we have a bug?

If we look closer at our `Answer` type we see that it takes two `Maybe`'s. If we
think about it in terms of [algebraic data types][4] we can reason that this
solution has four possible cases for our answer:

- `Answer (Just _) (Just _)`
- `Answer (Just _) Nothing`
- `Answer Nothing (Just _)`
- `Answer Nothing Nothing`

Are all these cases valid? If we revisit the domain logic then it becomes more
clear: if there is an answer we receive both `answer` and `answeredOn` filled
in, else we receive both fields with a null value. This means we have only two
possible cases:

- we have an answer and both fields are filled in
- we have no answer and both fields are empty

This is not what we represent in our code. There are four possible cases right
now! We only want the two cases that are valid and we can’t express that right
now. This allowed for a bug to slip in where one of the fields for an answer
was set to `null` and made our application show contradicting
information to our users. Luckily for us, we can leverage Elm’s awesome type
system to make the other cases impossible! Let’s improve our code.

## Maybe this will fix it?

We could wrap our `Answer` type in a `Maybe` and remove the `Maybe` for both the
values or another approach is to expand our `Answer` type to a [Custom Type][5]
(also called Union Type). Before we refactor our code let's think about how our
code looks in each approach. Compare both examples below one of each possible
fix and look at how we would use it rendering our answer. First look at the
approach using `Maybe`:

{% prism elm %}
import Html exposing (Html)

type Answer = Answer String Date

type alias Question =
    { id: String
    , date : Date
    , content: String
    , answer: Maybe Answer
    }

viewAnswer : Maybe Answer -> Html Never
viewAnswer possibleAnswer =
    case possibleAnswer of
        Just (Answer content _) ->
            Html.text content

        Nothing ->
            Html.text "No answer yet"
{% endprism %}

And our Union type approach:

{% prism elm %}
import Html exposing (Html)

type Answer
    = Answered String Date
    | NoAnswerYet


type alias Question =
    { id: String
    , date : Date
    , content: String
    , answer: Answer
    }

viewAnswer : Answer -> Html Never
viewAnswer answer =
    case answer of
        Answered content _ ->
            Html.text content

        NoAnswerYet ->
            Html.text "No answer yet"
{% endprism %}

As you can see our Union type approach is less code (you don't have to write
`Maybe` and `Just` for the value) and has more clarity. Using Maybe does fix it
quickly. But, it adds an extra level of abstraction around our Answer type.
Having to unwrap the Maybe first to get to our Answer type. With the Custom Type
approach, it is clear that we have an answer or no answer, this shows more
intent than a Maybe. Also, our code emits an uncertainty when using Maybe. A
great talk about uncertainties in your Elm code can be watched here:
[Working with Maybe][6] by Joël Quenneville. We don't want any uncertainties in
our code. We are certain that when decoded we either have an answer or have no
answer.

On the downside, when going for the Custom Type approach, we do lose the
possibility for using `Maybe.map` and have to use case for everything. This boils
down to having the power of mapping or clarity of intent in our code. Since we,
developers, read code more than we write (said by Robert C. Martin in his book
[Clean Code][7] and by many others) it means that clarity of intent trumps power
we decided to go with the Custom Type approach.

## Making the seemly impossible impossible

First, we change our Answer type that represents our only two possible cases.


{% prism elm %}
type Answer
    = Answered String Date
    | NoAnswerYet
{% endprism %}

Then we change our decoder to set return the Answered type if all is well and
`NoAnswerYet` for the other cases where one or more of the fields are `null`.
To make our code more concise we use [`Json.Decode.Extra.withDefault`][8] to set
a fallback if one of our fields are `null`.

{% prism elm %}
import Json.Decode.Extra as JDE

decoder : JD.Decoder Question
decoder =
    JD.map4 Question
        (JD.field "id" JD.string)
        (JD.field "date" DateTime.decoder)
        (JD.field "content" JD.string)
        (JD.map2 Answered
            (JD.field "answer" JD.string)
            (JD.field "answeredOn" DateTime.decoder)
            |> JDE.withDefault NoAnswerYet
        )
{% endprism %}

Now our code is safe from weird cases and is more expressive! Having fewer
possible cases means fewer possible bugs, makes it easier to test, and easier
to reason about what the code can do. Another small advantage is that you won't
have to write tests for the other weird cases. If you try to write such a test
the compiler just won't allow you. Thus, we don't need to write any tests and
save time. With this, we fixed our bug using the powerful Elm type system.

You can check out the final SSCCE here:
[https://ellie-app.com/embed/PnhF7yzQtra1][9]

If you are interested in learning more about fixing similar problems in your Elm
application I highly recommend to watch [Making Impossible States Impossible][10]
by Richard Feldman.

*[SSCCE]: Short, Self Contained, Correct (Compilable), Example

[1]: http://elm-lang.org/
[2]: https://www.haskell.org/
[3]: http://www.purescript.org/
[4]: https://codewords.recurse.com/issues/three/algebra-and-calculus-of-algebraic-data-types
[5]: https://guide.elm-lang.org/types/custom_types.html
[6]: https://www.youtube.com/watch?v=43eM4kNbb6c
[7]: https://www.goodreads.com/book/show/3735293-clean-code
[8]: http://package.elm-lang.org/packages/elm-community/json-extra/2.7.0/Json-Decode-Extra#withDefault
[9]: https://ellie-app.com/embed/PnhF7yzQtra1
[10]: https://www.youtube.com/watch?v=IcgmSRJHu_8
