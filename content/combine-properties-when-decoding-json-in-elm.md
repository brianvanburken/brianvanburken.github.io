+++
title = "Combine Properties when Decoding JSON in Elm"
date = 2021-11-15


[extra]
tags = ["Elm", "JSON", "Decoding"]
excerpt = "Combining two properties extracted from a JSON-object when decoding JSON in Elm."
+++

Sometimes an API returns a JSON object that contains properties you want to combine, for example, pieces of information belonging together.

## The domain

Before we look at how to solve this, let's establish a shared domain.
So let's say we have an API that returns a list of videos when called.
Each video coming from that API has the following structure:

```json
{
  "id": "1",
  "extension": "mp4",
  "name": "example"
}
```

Here we see that the `extension` and the `name` are separate properties of the video object.
It would be nice to combine them to get the full filename and download the video.
Based on the JSON object and our wish to combine properties, we can create our model in Elm.

```elm
type alias Video =
    { id: String
    , filename: String
    }
```

## Decoding

Now that we know our goal, we can create the decoder for our model.
In this first attempt, we decode all the properties and pass them to a function.
In the function, we combine the name and extension and pass it to our model.

```elm
import Json.Decode as JD exposing (Decoder)

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

This code works and does what we want.
But, the code isn't straightforward and less extensible.
What if the API returns more properties that we want to use?
The `toVideo` function becomes longer and less readable.
It is also more error-prone, e.g., accidentally swapping arguments.

## Improving the decoder

We can improve this by extracting the logic of combining the name and extension into a separate custom decoder.
In the decoder, we get the whole JSON object, extract only the name, and combine those.
The result is passed back into our decoder for `Video`.

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

The code, in the end, is more readable and easier to extend.
The decoder is also reusable for other JSON objects that have the same properties.
If we want to add a new property to `Video`, we need to change `JD.map2` to `JD.map3` and add our new field.
