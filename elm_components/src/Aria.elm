module Aria exposing (..)

import Html as H
import Html.Attributes as HA

selected : Bool -> H.Attribute msg
selected v = HA.attribute "aria-selected" <| if v then "true" else "false"

controls : String -> H.Attribute msg
controls = HA.attribute "aria-controls"

labelledBy : String -> H.Attribute msg
labelledBy = HA.attribute "aria-labelledby"

role : String -> H.Attribute msg
role = HA.attribute "role"

label : String -> H.Attribute msg
label = HA.attribute "aria-label"
