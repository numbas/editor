port module Tabber exposing 
    ( Tabber(..)
    , TabView
    , Msg(..)
    , State
    , TabLabel(..)
    , Tab
    , FieldReference
    , MoveDirection(..)
    , unwrap_tabber
    , tabber_name
    , tabber_tabs
    , tabber_allow_empty
    , decode_state
    , update
    , set_tab
    , tab_link
    , view_tablist
    , tab_button
    , view_tabpanel
    , initial_state
    , all_fields_in_tabber
    , fields_dict
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
import Property exposing (Field, path_to_field)
import Settings as S
import Task exposing (Task)
import Tuple exposing (pair)
import Ui exposing (Ui)

port save_tab_state : JE.Value -> Cmd msg

type alias TabberDef msg =
    { name : String
    , allow_empty : Bool
    , reorderable: Bool
    , tabs : List (Tab msg)
    }

type Tabber msg = 
    Tabber (TabberDef msg)


type MoveDirection
    = Previous
    | Next
    | First
    | Last
        

unwrap_tabber : Tabber msg -> TabberDef msg
unwrap_tabber t = case t of
    Tabber def -> def

tabber_name : Tabber msg -> String
tabber_name = unwrap_tabber >> .name

tabber_tabs : Tabber msg -> List (Tab msg)
tabber_tabs = unwrap_tabber >> .tabs

tabber_allow_empty : Tabber msg -> Bool
tabber_allow_empty = unwrap_tabber >> .allow_empty

type alias TabView msg =
    { attributes : List (H.Attribute msg)
    , contents : () -> List (Html msg)
    , fields : List (Field msg)
    }

type alias FieldReference msg = (List (Tabber msg, Tab msg), Field msg)

type Msg
    = SetTab String String
    | MoveTab String Int MoveDirection
    | NoOp

type TabLabel msg
    = SimpleLabel String
    | HtmlLabel 
        { button_contents : List (Html msg)
        , button_attributes : List (H.Attribute msg)
        , extra_contents : List (Html msg) -- extra contents to show after the button when this tab is selected
        , plain_text : String
        }

type alias Tab msg =
    { id : String
    , label : TabLabel msg
    , icon : Maybe String
    , view : TabView msg
    , tabbers : List (Tabber msg)
    }

type alias State = Dict String String

tab_id : Tabber msg -> Tab msg -> String
tab_id tabber tab = (tabber_name tabber)++"-tab-"++tab.id

tabpanel_id : Tabber msg -> Tab msg -> String
tabpanel_id tabber tab = (tabber_name tabber)++"-tabpanel-"++tab.id

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

    MoveTab _ _ _ -> (state, Cmd.none) -- handled higher up

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
    Dict.get (tabber_name tabber) state
    |> Maybe.andThen (\id -> List.filter (.id >> (==) id) (tabber_tabs tabber) |> List.head)
    |> if tabber_allow_empty tabber then 
        identity
       else
        (\mc -> case mc of
            Just c -> Just c
            Nothing -> (tabber_tabs tabber) |> List.head
        )

view_tablist : Ui msg -> (Msg -> msg) -> State -> Tabber msg -> List (H.Attribute msg) -> Html msg
view_tablist ui wrap_msg state tabber tabber_attrs =
    H.menu
        ([ Aria.role "tablist" ] ++ tabber_attrs)
        (tabber_tabs tabber |> List.indexedMap (\index tab ->
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
        selected_id : Maybe String
        selected_id = Maybe.map .id <| current_tab state tabber

        is_selected = (==) (Just tab.id) <| selected_id

        nth_tab i = LE.getAt i (tabber_tabs tabber)

        switch_to_tab : MoveDirection -> JD.Decoder Msg
        switch_to_tab direction =
            let
                i = case direction of
                    Previous -> index - 1
                    Next -> index + 1
                    First -> 0
                    Last -> (List.length (tabber_tabs tabber)) - 1
            in
                nth_tab i
                |> Maybe.map (\ntab -> SetTab (tabber_name tabber) ntab.id)
                |> Maybe.map JD.succeed
                |> Maybe.withDefault (JD.fail "that tab doesn't exist")

        move_tab direction = JD.succeed (MoveTab (tabber_name tabber) index direction)

        handle_keypress : JD.Decoder Msg
        handle_keypress =
            Ui.decode_keypress
            |> JD.andThen (\press -> 
                let
                    fn = if press.shift then move_tab else switch_to_tab

                    direction_map = Dict.fromList
                        [ ("ArrowUp",  Previous)
                        , ("ArrowLeft",  Previous)
                        , ("ArrowRight",  Next)
                        , ("ArrowDown",  Next)
                        , ("Home",  First)
                        , ("End",  Last)
                        ]

                    direction = 
                        Dict.get press.key direction_map 
                        |> Maybe.map JD.succeed
                        |> Maybe.withDefault (JD.fail "unhandled key")

                in
                    direction |> JD.andThen fn
               )

    in
        H.button
            [ HA.type_ "button"
            , HA.class "btn"
            , Aria.role "tab"
            , HA.id <| tab_id tabber tab
            , HA.tabindex <| if is_selected then 0 else -1
            , Aria.selected <| is_selected
            , Aria.controls <| tabpanel_id tabber tab
            , HE.onClick <| wrap_msg <| SetTab (tabber_name tabber) tab.id
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
                (v.contents ())

all_fields_in_tabber : Tabber msg -> List (FieldReference msg)
all_fields_in_tabber tabber =
    let
        name = tabber_name tabber
        tabs = tabber_tabs tabber

        visit_tab tab =
            let
                subtabbers = 
                    List.concatMap all_fields_in_tabber tab.tabbers
                    |> List.map (\(path, field) -> ((tabber, tab)::path, field))

                fields = tab.view.fields |> List.map (pair [(tabber, tab)])
            in
                subtabbers ++ fields
    in
        tabs |> List.concatMap visit_tab

fields_dict : Tabber msg -> Dict String (FieldReference msg)
fields_dict =
    all_fields_in_tabber
    >> List.map (\(tabs, field) -> (path_to_field field, (tabs, field)))
    >> Dict.fromList
