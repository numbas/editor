module Tree exposing
    ( Tree(..)
    , Path(..)
    , empty_branch
    , add_branch
    , leaf
    , updateAt
    , path_toString
    )

import Dict exposing (Dict)
import List.Extra as LE

{- 
A tree is rooted at a `Branch`, with labelled branches leading to lists of subtrees.
A `Leaf` holds a final value.
-}
type Tree comparable a
    = Branch (Dict comparable (List (Tree comparable a)))
    | Leaf a

type Path comparable
    = Stop
    | Nth comparable Int (Path comparable)

empty_branch : Tree comparable a
empty_branch = Branch Dict.empty

add_branch : comparable -> List (Tree comparable a) -> Tree comparable a -> Tree comparable a
add_branch key branch tree = case tree of
    Branch children -> children |> Dict.insert key branch |> Branch
    _ -> tree

leaf : a -> Tree comparable a
leaf = Leaf

updateAt : Path comparable -> (Tree comparable a -> Path comparable -> Tree comparable a) -> Tree comparable a -> Tree comparable a
updateAt path fn = 
    let
        u p tree = case (p, tree) of
            (Stop, _) -> fn tree path

            (Nth key i rest, Branch children) -> children |> Dict.update key (Maybe.map (LE.updateAt i (u rest))) |> Branch

            _ -> tree
    in
        u path

addAt : Path comparable -> comparable -> a -> Tree comparable a -> Tree comparable a
addAt path key v = 
    updateAt
    path 
    (\t _ -> case t of
        Branch children -> children |> Dict.update key (Maybe.map (\l -> l++[Leaf v])) |> Branch
        _ -> t
    )

leaves : List (Tree comparable a) -> List a
leaves = List.filterMap (\t -> case t of
    Branch _ -> Nothing
    Leaf a -> Just a
    )

get : Path comparable -> comparable -> Tree comparable a -> Maybe (List a)
get path key tree = case (path, tree) of
    (_, Leaf _) -> Nothing
    (Stop, Branch children) -> Dict.get key children |> Maybe.map leaves
    (Nth pkey i rest, Branch children) -> Dict.get pkey children |> Maybe.andThen (LE.getAt i) |> Maybe.andThen (get rest key)

path_toString : Path String -> String
path_toString path =
    case path of
        Stop -> ""
        Nth key i rest -> key++(String.fromInt i)++(path_toString rest)



