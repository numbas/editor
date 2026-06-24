module Ui exposing
    ( Ui
    , UiConfig
    , ui
    , visibleIf
    , raw_html
    , jme_preview
    )

import Aria
import Dict exposing (Dict)
import Html as H exposing (Html)
import Html.Attributes as HA

type alias Ui msg =
    { icon : String -> Html msg
    , helplink : String -> String -> Html msg
    , dropdown : String -> List (Html msg) -> List (Html msg) -> List (Html msg)
    , help_block : List (Html msg) -> Html msg
    , inline_help_block : List (Html msg) -> Html msg
    , alert : String -> List (Html msg) -> Html msg
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

        helplink term subject =
            let
                hint = "Help with " ++ subject
            in
                case Dict.get (String.toLower term) config.docs_mapping of
                    Just term_url -> 
                        H.a
                            [ HA.href <| config.help_root++term_url
                            , HA.class "helplink info"
                            , HA.target "numbasquickhelp"
                            , Aria.label <| hint
                            , HA.title hint
                            ]
                            [ icon "help"
                            ]
                    Nothing ->
                        H.span [ HA.class "warning" ] [H.text <| "Unknown docs term: "++term]

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
    in
        { icon = icon
        , helplink = helplink
        , dropdown = dropdown
        , help_block = help_block
        , inline_help_block = inline_help_block
        , alert = alert
        , config = config
        }

visibleIf : Bool -> List (Html msg) -> List (Html msg)
visibleIf prop content = if prop then content else []

raw_html content = H.node "raw-html" [HA.attribute "html" content] []

jme_preview : { expression : String, notation : String, for : String} -> Html msg
jme_preview o = 
    H.node
        "jme-preview"
        [ HA.attribute "expression" o.expression
        , HA.attribute "notation" o.notation
        , HA.attribute "for" o.for
        ]
        []

