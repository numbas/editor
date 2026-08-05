port module Tabber exposing 
    ( Tabber
    , TabView
    , Msg(..)
    , State
    , TabLabel(..)
    , Tab
    , decode_state
    , update
    , set_tab
    , tab_link
    , view_tablist
    , tab_button
    , view_tabpanel
    , initial_state
    )

import Aria
import Browser.Dom
import Dict exposing (Dict)
import Html as H exposing (Html)
import Html.Attributes as HA
import Html.Events as HE
import Json.Decode as JD
import Json.Encode as JE
import List.Extra as LE
import Task exposing (Task)
import Ui exposing (Ui)

port save_tab_state : JE.Value -> Cmd msg

type alias Tabber msg = 
    { name : String
    , allow_empty : Bool
    , tabs : List (Tab msg)
    }

type alias TabView msg =
    { attributes : List (H.Attribute msg)
    , contents : List (Html msg)
    }

type Msg
    = SetTab String String
    | NoOp

type TabLabel msg
    = SimpleLabel String
    | HtmlLabel 
        { button_contents : List (Html msg)
        , button_attributes : List (H.Attribute msg)
        , extra_contents : List (Html msg) -- extra contents to show after the button when this tab is selected
        }

type alias Tab msg =
    { id : String
    , label : TabLabel msg
    , icon : Maybe String
    , view : TabView msg
    }

type alias State = Dict String String

tab_id : Tabber msg -> Tab msg -> String
tab_id tabber tab = tabber.name++"-tab-"++tab.id

tabpanel_id : Tabber msg -> Tab msg -> String
tabpanel_id tabber tab = tabber.name++"-tabpanel-"++tab.id

initial_state = Dict.empty

decode_state : JD.Decoder State
decode_state = JD.oneOf
    [ JD.dict JD.string
    , JD.succeed initial_state
    ]

update : Msg -> State -> (State, Cmd Msg)
update msg state = case msg of
    SetTab key id -> 
        let
            nstate = Dict.insert key id state
        in
            (nstate
            , Cmd.batch
                [ nstate |> JE.dict identity JE.string |> save_tab_state
                , Task.attempt (\_ -> NoOp) <| Browser.Dom.focus <| key++"-tab-"++id
                ]
            )

    NoOp -> (state, Cmd.none)

set_tab : String -> String -> Task Never Msg
set_tab tabber tab = SetTab tabber tab |> Task.succeed

tab_link : String -> String -> String -> Html Msg
tab_link tabber tab text =
    H.a
        [ HA.href "#"
        , HE.onClick (SetTab tabber tab)
        ]
        [ H.text text
        ]

current_tab : State -> Tabber msg -> Maybe (Tab msg)
current_tab state tabber = 
    Dict.get tabber.name state
    |> Maybe.andThen (\id -> List.filter (.id >> (==) id) tabber.tabs |> List.head)
    |> if tabber.allow_empty then 
        identity
       else
        (\mc -> case mc of
            Just c -> Just c
            Nothing -> tabber.tabs |> List.head
        )

view_tablist : Ui msg -> (Msg -> msg) -> State -> Tabber msg -> List (H.Attribute msg) -> Html msg
view_tablist ui wrap_msg state tabber tabber_attrs =
    H.menu
        ([ Aria.role "tablist" ] ++ tabber_attrs)
        (tabber.tabs |> List.indexedMap (\index tab ->
            let
                selected = (==) (Just tab.id) <| Maybe.map .id <| current_tab state tabber

                extra_contents = case (selected, tab.label) of
                    (True, HtmlLabel o) -> o.extra_contents
                    _ -> []

                extra_attributes = case tab.label of
                    HtmlLabel o -> o.button_attributes
                    _ -> []

                tb = tab_button ui wrap_msg state tabber tab
            in
                H.li
                    extra_attributes
                    ((tb index) :: extra_contents)
            )
        )

tab_button : Ui msg -> (Msg -> msg) -> State -> Tabber msg -> Tab msg -> Int -> Html msg
tab_button ui wrap_msg state tabber tab index =
    let
        selected = (==) (Just tab.id) <| Maybe.map .id <| current_tab state tabber

        nth_tab i = LE.getAt i tabber.tabs

        move_to_tab i =
            nth_tab i
            |> Maybe.map (\ntab -> SetTab tabber.name ntab.id)
            |> Maybe.map JD.succeed
            |> Maybe.withDefault (JD.fail "that tab doesn't exist")

        handle_keypress =
            JD.field "key" JD.string
            |> JD.andThen (\key -> case key of
                "ArrowUp" -> move_to_tab (index - 1)
                "ArrowLeft" -> move_to_tab (index - 1)
                "ArrowRight" -> move_to_tab (index + 1)
                "ArrowDown" -> move_to_tab (index + 1)
                "Home" -> move_to_tab 0
                "End" -> move_to_tab <| (List.length tabber.tabs) - 1
                _ -> JD.fail "unhandled key"
               )

    in
        H.button
            [ HA.type_ "button"
            , HA.class "btn"
            , Aria.role "tab"
            , HA.id <| tab_id tabber tab
            , HA.tabindex <| if selected then 0 else -1
            , Aria.selected <| selected
            , Aria.controls <| tabpanel_id tabber tab
            , HE.onClick <| wrap_msg <| SetTab tabber.name tab.id
            , HE.preventDefaultOn "keydown" (handle_keypress |> JD.map (\m -> (wrap_msg m, True)))
            ]
            (case tab.label of
                SimpleLabel label -> 
                    [ tab.icon |> Maybe.map (ui.icon) |> Maybe.withDefault (H.text "")
                    , H.text label
                    ]

                HtmlLabel o -> o.button_contents
            )

view_tabpanel : Ui msg -> State -> Tabber msg -> Html msg
view_tabpanel ui state tabber = case current_tab state tabber of
    Nothing -> H.text ""
    Just tab -> 
        let
            v = tab.view
        in
            H.section
                ([ Aria.role "tabpanel"
                , HA.id <| tabpanel_id tabber tab
                , Aria.labelledBy <| tab_id tabber tab
                ]++v.attributes
                )
                v.contents
