+++
title = "Combining GraphQL queries in Elm"
date = 2024-04-01
draft = true

[taxonomies]
tags = ["elm", "graphql"]
+++

- reduce overhead of HTTP requests
- have data at once
- less handling of failures

## The queries
For this post I used the [Star Wars GraphQL API][1]. You can check out the entire [schema and playground here][2].

We want to achieve the following query
```graphql
query Query {
  allVehicles {
    vehicles {
      model
    }
  }
  allStarships {
    starships {
      model
    }
  }
}
```

To make requests we use the [dillonkearns/elm-graphql][3] package. Each query is setup using SelectionSet as follows:
```elm
TODO: example queries
```

### Combining the queries
To use the data we want to put both of them in a record where I can show all the transports in the movies.
 
I use `SS.map2` to combine them.

[0]: https://github.com/dillonkearns/elm-graphql
[0]: https://github.com/graphql/swapi-graphql
[0]: https://studio.apollographql.com/public/star-wars-swapi/variant/current/explorer