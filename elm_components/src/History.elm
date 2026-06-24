module History exposing
    ( History
    , init
    , can_undo
    , can_redo
    , undo
    , redo
    , no_change
    , small_change
    , big_change
    )

type alias History state =
    { past : List state
    , current : state
    , small_change : Bool
    , future : List state
    }

init : state -> History state
init state =
    { past = []
    , current = state
    , small_change = False
    , future = []
    }

can_undo : History state -> Bool
can_undo history = history.past /= []

can_redo : History state -> Bool
can_redo history = history.future /= []

undo : History state -> History state
undo history = case history.past of
    [] -> history
    a::rest -> { history | past = rest, current = a, small_change = False, future = history.current::history.future }

redo : History state -> History state
redo history = case history.future of
    [] -> history
    a::rest -> { history | past = history.current::history.past, current = a, small_change = False, future = rest }

no_change : state -> History state -> History state
no_change state history = { history  | current = state }

small_change : state -> History state -> History state
small_change state history =
    if history.small_change then
        { history | current = state }
    else
        { history | past = history.current::history.past, current = state, small_change = True, future = [] }

big_change : state -> History state -> History state
big_change state history =
    { history | past = history.current::history.past, current = state, small_change = False, future = [] }
