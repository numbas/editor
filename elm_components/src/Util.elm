module Util exposing
    ( fi
    , ff
    , letter_ordinal
    , delay
    , first_two
    )

import Process
import Task exposing (Task)

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
