module Aria exposing (..)

import Html as H
import Html.Attributes as HA

selected : Bool -> H.Attribute msg
selected = HA.attribute "aria-selected" << bool_str

bool_str v = if v then "true" else "false"

controls : String -> H.Attribute msg
controls = HA.attribute "aria-controls"

labelledBy : String -> H.Attribute msg
labelledBy = HA.attribute "aria-labelledby"

role : String -> H.Attribute msg
role = HA.attribute "role"

label : String -> H.Attribute msg
label = HA.attribute "aria-label"

pressed : Bool -> H.Attribute msg
pressed = HA.attribute "aria-pressed" << bool_str 
