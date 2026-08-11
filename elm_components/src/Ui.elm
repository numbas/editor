module Ui exposing
    ( Ui
    , UiConfig
    , ui
    , visibleIf
    , raw_html
    , raw_html_string
    , jme_preview
    , jme_value
    , sr_only
    , toggle_list
    )

import Aria
import Dict exposing (Dict)
import Html as H exposing (Html)
import Html.Attributes as HA
import Html.Events as HE
import Json.Encode as JE

type alias BooleanInputOptions msg =
    { checked : Bool
    , onCheck : Bool -> msg
    , id : String
    }

type alias ToggleListOptions a msg =
    { label_for : a -> String
    , id_for : a -> String
    , is_checked : a -> Bool
    , toggle : a -> Bool -> msg
    , view_item : a -> List (Html msg)
    }

type alias Ui msg =
    { icon : String -> Html msg
    , helplink : String -> String -> Html msg
    , labelled_helplink : String -> String -> Html msg
    , button : String -> List (H.Attribute msg) -> List (Html msg) -> Html msg
    , dropdown : String -> List (Html msg) -> List (Html msg) -> List (Html msg)
    , help_block : List (Html msg) -> Html msg
    , inline_help_block : List (Html msg) -> Html msg
    , alert : String -> List (Html msg) -> Html msg
    , styled_text : String -> List (Html msg) -> Html msg
    , boolean_input : BooleanInputOptions msg -> List (Html msg)
    , config : UiConfig
    }

type alias UiConfig =
    { icon_map : Dict String String
    , csrf_token : String
    , help_root : String
    , docs_mapping : Dict String String
    }

ui : UiConfig -> Ui msg
ui config =
    let
        {-
            An icon
        -}
        icon name =
            let
                mpic = Dict.get name config.icon_map
            in
                case mpic of
                    Just pic -> H.span [ HA.class "icon" ] [H.text pic, H.text " "]
                    Nothing -> H.span [ HA.class "icon missing" ] [H.text name, H.text " "]

        {-
            An icon link to the documentation.
        -}
        helplink labelled term subject =
            let
                hint = if labelled then subject else "Help with " ++ subject
            in
                case Dict.get (String.toLower term) config.docs_mapping of
                    Just term_url -> 
                        H.a
                            [ HA.href <| config.help_root++term_url
                            , HA.class "helplink"
                            , HA.target "numbasquickhelp"
                            , Aria.label <| hint
                            , HA.title hint
                            ]
                            ( if labelled then
                                [ H.text hint 
                                , H.text " "
                                , icon "help"
                                ]
                              else
                                [ icon "help"
                                ]
                            )
                    Nothing ->
                        H.span [ HA.class "warning" ] [H.text <| "Unknown docs term: "++term]

        button kind attributes contents =
            H.button
                ( [ HA.class <| "btn "++kind
                  , HA.type_ "button"
                  ]
                ++ attributes
                )
                contents

        dropdown name label_content items =
                [ H.button
                    [ HA.type_ "button"
                    , HA.class "btn"
                    , HA.id <| name++"-dropdown"
                    , HA.attribute "popovertarget" <| name++"-menu"
                    ]
                    label_content
                , H.menu
                    [ HA.id <| name++"-menu"
                    , HA.attribute "popover" "auto"
                    ]
                    items
                ]

        help_block content = H.p [ HA.class "help-block" ] content
        
        inline_help_block content = H.span [ HA.class "help-block inline" ] content

        alert kind content = H.div [HA.class <| "alert "++kind] content

        styled_text kind content = H.span [HA.class kind] content

        boolean_input o =
            [ H.input
                [ HA.type_ "checkbox"
                , HA.checked o.checked
                , HE.onCheck o.onCheck
                , HA.id o.id
                ]
                []
            ]

    in
        { icon = icon
        , helplink = helplink False
        , labelled_helplink = helplink True
        , button = button
        , dropdown = dropdown
        , help_block = help_block
        , inline_help_block = inline_help_block
        , alert = alert
        , styled_text = styled_text
        , boolean_input = boolean_input
        , config = config
        }

visibleIf : Bool -> List (Html msg) -> List (Html msg)
visibleIf prop content = if prop then content else []

raw_html : JE.Value -> Html msg
raw_html content = 
    H.node "raw-html" 
        [HA.property "html" content]
        []

raw_html_string : String -> Html msg
raw_html_string content = 
    H.node "raw-html" 
        [HA.attribute "html" content]
        []

jme_preview : { expression : String, notation : String, for : String} -> Html msg
jme_preview o = 
    H.node
        "jme-preview"
        [ HA.attribute "expression" o.expression
        , HA.attribute "notation" o.notation
        , HA.attribute "for" o.for
        ]
        []

jme_value : { value : JE.Value, abbreviate : Bool } -> Html msg
jme_value o =
    H.node "jme-value"
        [ HA.property "value" o.value
        , HA.attribute "abbreviate" <| if o.abbreviate then "true" else "false"
        ]
        []

sr_only : String -> Html msg
sr_only str = H.span [HA.class "sr-only"] [H.text str]

toggle_list : ToggleListOptions a msg -> Ui msg -> List a -> Html msg
toggle_list o ui_ items =
    H.ul
        [ HA.class "toggle-list" ]
        (items |> List.map (\item ->
            H.li [] <| List.concat
                [ ui_.boolean_input 
                    { id = o.id_for item
                    , checked = o.is_checked item
                    , onCheck = o.toggle item
                    }
                , [ H.text " "
                  , H.label [ HA.for <| o.id_for item ] [ H.text <| o.label_for item ] 
                  , H.text " "
                  ]
                , o.view_item item
                ]
        ))
