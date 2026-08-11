module Util exposing
    ( fi
    , ff
    , letter_ordinal
    , delay
    , first_two
    , dropRight
    , third
    , nested_count
    )

import Process
import Task exposing (Task)
import Tuple exposing (second)

fi = String.fromInt

ff = String.fromFloat

alphabet = "abcdefghijklmnopqrstuvwxyz"

{- translate an ordinal number to alphabet indexing: a ... z aa .. az ba .. zz .. aaa ... -}
letter_ordinal : Int -> String
letter_ordinal n =
    let
        b = String.length alphabet
        m = modBy b n
        c = String.slice m (m+1) alphabet
    in
        if n == 0 then 
            String.left 1 alphabet
        else
            (if n >= b then letter_ordinal (n//b - 1) else "") ++ c

{- Send the given message after the given number of milliseconds -}
delay : Float -> msg -> Cmd msg
delay t msg = Process.sleep t |> Task.perform (always msg)

{- The first two elements of a list as a pair, maybe -}
first_two : List a -> Maybe (a, a)
first_two l = case l of
    a::b::_ -> Just (a,b)
    _ -> Nothing

{- Drop the last n items of the list -}
dropRight : Int -> List a -> List a
dropRight n = List.reverse >> List.drop n >> List.reverse

{- The third thing in a triple -}
third: (a,b,c) -> c
third (a,b,c) = c

{- Given a list of lists, assign a number to each of the second-level things. -}
nested_count : List (a, List b) -> List (a, List (Int, b))
nested_count list =
    list
    |> List.foldl (\(a, bs) (n, oas) ->
        let
            (nn, nbs) =
                bs
                |> List.foldl (\b (nb, obs) -> (nb+1, obs++[(nb,b)])) (n, [])
        in
            (nn, oas++[(a, nbs)])
       )
       (0, [])
    |> second

