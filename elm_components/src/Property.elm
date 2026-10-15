module Property exposing
    ( Options
    , Widget
    , Field
    , visibleIf
    )

import Html as H exposing (Html)
import Json.Encode as JE
import Settings exposing (Address, Settings)
import Ui exposing (Ui)

type alias Options msg =
    { help : Maybe String {- text description of the subject. The label is used to find the matching reference in the docs. -}
    , id : String {- id attribute for the input -}
    , label : String {- displayed label text -}
    , settings : Settings
    , setter : (JE.Value, Address) -> msg
    }

type alias Widget msg = Ui msg -> Options msg -> Field msg

type alias Field msg =
    { options : Options msg
    , view : List (Html msg)
    }

visibleIf : Bool -> Field msg -> Field msg
visibleIf visible field =
    { field | view = Ui.visibleIf visible field.view }
