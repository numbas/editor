module FilterList exposing 
    ( State
    , init
    , get_query
    , filter
    , update
    )

type alias State = String -- The search string

init : State
init = ""

get_query : State -> String
get_query = identity

update : State -> String -> State
update _ = identity

filter : (a -> List String) -> List a -> State -> List a
filter strings_of items query =
    let
        clean = String.toLower

        query_bits = clean query |> String.split " "

        matches : a -> Bool
        matches a =
            let
                strings =
                    strings_of a
                    |> List.map clean
            in
                List.all (\qq -> List.any (String.contains qq) strings) query_bits

    in
        List.filter matches items
