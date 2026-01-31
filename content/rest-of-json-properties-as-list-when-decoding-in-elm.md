+++
title = "JSON Properties as a List when Decoding in Elm"
date = 2021-11-20


[extra]
tags = ["Elm", "JSON", "Decoding"]
excerpt = "Storing JSON properties as a List when decoding in Elm"
+++

While working on an Elm application, I stumbled across a situation where I needed to decode a result from an API and store the rest of the properties that aren't part of the model as a list.

## Setting the domain

The API returns a list of videos, and each video has an `id` and `title`.
Each video also has any number of properties that are "metadata."
These properties are what we want to store in a list of key-value pairs.
An example video would look like this in JSON.

```json
{
  "id": "1",
  "duration": 126,
  "language": "EN",
  "title": "Example title"
}
```

We then define the model where we store the metadata in a list of tuples.
Each tuple contains the key and the value.

```elm
type alias Video =
    { id : String
    , title : String
    , metadata : List ( String, String )
    }
```

Using standard decoding in Elm, we first pass the JSON fields `id` and `title` to the model.
And as of last, we pass a custom decoder.

```elm
import Json.Decode as JD

decoder : JD.Decoder Video
decoder =
    JD.map3 Video
        (JD.field "id" JD.string)
        (JD.field "title" JD.string)
        metadataDecoder
```

## Extracting the rest of JSON properties

Our custom decoder gets the whole JSON object and decodes it as a list of key-value pairs.
We convert all the values to a `String` with the `valueToString` function, so all are the same type.
However, this does mean that we lose the information.
You could fix this by writing a [Custom Type][1] for each value type; not needed for this case.

```elm
metadataDecoder : JD.Decoder (List ( String, String ))
metadataDecoder =
    JD.keyValuePairs valueToString

valueToString : JD.Decoder String
valueToString =
    JD.oneOf
        [ JD.string
        , JD.float |> JD.map String.fromFloat
        , JD.bool
            |> JD.map
                (\boolean ->
                    case boolean of
                        True ->
                            "true"

                        False ->
                            "false"
                )
        , JD.null ""
        ]
```

So where done right?
Well, we have everything as key-value pair.
And I mean everything.
We also added our `id` and `title` to `metadata`.
Not ideal.

## Block unwanted properties

To fix this, we need to filter out properties using a blocklist.
We map our key-value pairs to a `filterMetadata` method.
This method checks for each key against the blocklist. 
Instead of a blocklist, we could also use an allowlist to only add specific keys to the metadata.

```elm
metadataDecoder : JD.Decoder (List ( String, String ))
metadataDecoder =
    JD.keyValuePairs valueToString
        |> JD.map filterMetadata

filterMetadata : List ( String, String ) -> List ( String, String )
filterMetadata =
    let
        blocklist =
            [ "id", "title" ]

        isBlocked =
            Tuple.first
                >> (\k -> List.member k blocklist)
                >> not
    in
    List.filter isBlocked

```

In the end, we have a correct model with all the rest of the properties from the JSON object.

You can check out the final SSCCE here: <https://ellie-app.com/9Qxk3RDydTka1>

[1]: https://guide.elm-lang.org/types/custom_types.html

*[SSCCE]: Short, Self Contained, Correct (Compilable), Example
