---
layout: post
title: Rest of JSON Properties as List when Decoding in Elm
excerpt: "Storing rest of JSON properties as a List when decoding in Elm"
tags:
  - Elm
  - JSON
  - Decoding
---

While working on an Elm application I stumbled across a situation where I needed
to decoding a result from an API and had to store the rest of the properties that
aren't part of the model as a list. This list would then be to display to the user.

For example, we have an API that returns a list of videos. Each video has an `id`
and `title`. Each video also has any number of properties that are "metadata".
These properties are what we want to store a list of key-value pairs.
This list is then used to display the information to the user. An example video
would look like this in JSON.

```json
{
  "id": "1",
  "duration": 126,
  "language": "EN",
  "title": "Example title"
}
```

We then define the model as follows.

```elm
type alias Video =
    { id : String
    , title : String
    , metadata : List ( String, String )
    }
```

Using standard decoding in Elm we first pass the JSON fields `id` and `title` to
the model. As of last we pass a custom decoder.

```elm
decoder : JD.Decoder Video
decoder =
    JD.map3 Video
        (JD.field "id" JD.string)
        (JD.field "title" JD.string)
        metadataDecoder
```

Our custom decoder gets the whole JSON object and decodes it as a list of
key-value pairs. We convert all the values to a `String` with the function called
`valueToString` so all are the same type. Though this does mean that we lose the
information. You could fix this by writing a [Custom Type][1] for each value type.

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

So where done right? Well, we have everything as key-value pair. And I mean
everything. We also added our `id` and `title` to `metadata`. Not ideal. To fix
this we need to filter out properties using a blocklist. We map our key-value
pairs to a `filterMetadata` method. This method checks for each entry if the key
is a member of the blocklist. You can change this to work the other way around
and only allow some properties in `metadata`.

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

In the end, we have a correct model with all the rest of the properties from the
JSON object. To display this list all we need to do is map the list to HTML to
display the information to the user.

You can check out the final SSCCE here: <https://ellie-app.com/9Qxk3RDydTka1>

[1]: https://guide.elm-lang.org/types/custom_types.html

\*[SSCCE]: Short, Self Contained, Correct (Compilable), Example
