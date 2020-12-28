---
layout: post
title: Combine Properties when Decoding JSON in Elm
excerpt: "Sometimes you want to combine two properties when decoding in Elm. In
this post I walk through an example of how to do this."
tags:
    - Elm
    - JSON
    - Decoding
---

Sometimes an API returns a JSON that contains properties you want to combine for
a nicer representation to the user or because the pieces of information belong
together.

So how would you do this? Before we continue, let's establish a shared domain.
So let's say we have an API that returns a list of videos when called. Each
video has the following structure:

```json
{
  "id": "1",
  "extension": "mp4",
  "name": "example"
}
```

Here we see that the `extension` and the `name` are separate properties of the
object. It would be nice to combine them to get the full filename of the video.
So we create our desired model in Elm.

```elm
type alias Video =
    { id: String
    , filename: String
    }
```

Now that we know our goal we can create the decoder for our model. In this first
attempt we decode all the properties in the object and pass this to a function
that transforms it into our model and, in the process, combines the extension
and the name.

```elm
import Json.Decode as JD exposing (Decoder, string)

decode : Decoder Video
decode =
    let
        toVideo : String -> String -> String -> Decoder Video
        toVideo id extension name =
            JD.succeed (Video id (name ++ "." ++ extension))
    in
    JD.map3 toVideo
        (JD.field "id" JD.string)
        (JD.field "extension" JD.string)
        (JD.field "name" JD.string)
```

We're done, right? Well yes, the code works and does what we want. But,
the code isn't clear. What if the API returns more properties that we want to
use? The `toVideo` function becomes longer and less readable. This makes it
error-prone, e.g. easier to swap the parameters.

We can improve this by extracting the logic of combining the name and extension
into a separate custom decoder. In the decoder, we get the whole JSON object and
extract only the name and combine those. The result is then passed into our main
decoder for `Video`.

```elm
decode : Decoder Video
decode =
    JD.map2 Video
        (JD.field "id" JD.string)
        decodeFilename


decodeFilename : Decoder String
decodeFilename =
    JD.map2 (\extension name -> name ++ "." ++ extension)
        (JD.field "extension" JD.string)
        (JD.field "name" JD.string)
```

The code in the end is more readable and easier to extend. If we want to add
more properties to `Video` all we need to do is to change `JD.map2` to `JD.map3`
and add our new field at the end or use something like [`Json.Decode.Pipeline`][1].

[1]: https://package.elm-lang.org/packages/NoRedInk/elm-json-decode-pipeline/latest/Json.Decode.Pipeline
