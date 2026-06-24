module Settings exposing
    ( Settings
    , Address
    , Value
    , Getter
    , Getters
    , Setter
    , Setters
    , empty
    , fromValue
    , index
    , field
    , indexWhere
    , indexWhereName
    , at
    , atIndex
    , atField
    , maybe_get
    , get
    , getters
    , insert
    , set
    , setters
    , setAt
    )

import Dict exposing (Dict)
import Json.Encode as JE
import Json.Decode as JD
import List.Extra as LE
import Tuple exposing (pair, first, second)

type alias Value = JE.Value

type alias Settings = 
    { value : JE.Value
    , defaults : JE.Value
    , at : Address
    }

type AddressItem
    = Index Int
    | Field String
    | IndexWhere (JD.Decoder Bool) Value

type alias Address = List AddressItem

empty : Settings
empty =
    { value = JE.object []
    , defaults = JE.object []
    , at = []
    }

fromValue : JE.Value -> JE.Value -> Settings
fromValue value defaults = 
    { value = value
    , defaults = defaults
    , at = []
    }

at : Address -> Settings -> Settings
at at_ s = { s | at = s.at ++ at_ }

field : String -> AddressItem
field = Field

index : Int -> AddressItem
index = Index

indexWhere : JD.Decoder Bool -> Value -> AddressItem
indexWhere = IndexWhere

indexWhereName name = indexWhere (JD.field "name" JD.string |> JD.map ((==) name)) (JE.object [("name", JE.string name)])

atIndex : Int -> Settings -> Settings
atIndex i = at [Index i]

atField : String -> Settings -> Settings
atField k = at [Field k]

decode_index_where : JD.Decoder Bool -> JD.Decoder Int
decode_index_where prop =
    (JD.list prop)
    |> JD.map (List.indexedMap pair >> (\ps -> ps |> List.filter second |> List.map first |> List.head |> Maybe.withDefault (List.length ps)))

maybe_get : JD.Decoder a -> Settings -> Maybe a
maybe_get decoder settings =    
    let
        reach : Address -> JD.Decoder a
        reach at_ = case at_ of
            [] -> decoder
            (Index i)::rest -> JD.index i (reach rest)
            (Field k)::rest -> JD.field k (reach rest)
            (IndexWhere prop _)::rest ->
                (decode_index_where prop)
                |> JD.andThen (\i -> JD.index i (reach rest))


        d = reach settings.at
    in
        settings.value
        |> JD.decodeValue d
        |> (\r -> case r of
            Ok v -> Ok v
            Err _ -> JD.decodeValue d settings.defaults
           )
        |> Result.toMaybe


get : JD.Decoder a -> a -> Settings -> a
get decoder default settings =
    maybe_get decoder settings
    |> Maybe.withDefault default

type alias Getter a = Settings -> a

type alias Setter a msg = a -> msg

type alias Getters =
    { string : Getter String
    , bool : Getter Bool
    , value : Getter Value
    }

getters : Getters
getters =
    { string = get (JD.oneOf [JD.string, JD.float |> JD.map String.fromFloat]) ""
    , bool = get JD.bool False
    , value = get JD.value (JE.null)
    }

insert : String -> Value -> Settings -> Settings
insert k v s = 
    let
        dict = JD.decodeValue (JD.dict JD.value) s.value |> Result.withDefault (Dict.empty)
        ndict = Dict.insert k v dict
    in
        {s | value = JE.dict identity identity ndict }

set : ((Value, Address) -> msg) -> Address -> (a -> Value) -> Setter a msg
set msg at_ encoder a = msg (encoder a, at_)

type alias Setters msg =
    { string : Setter String msg
    , bool : Setter Bool msg
    , value : Setter Value msg
    }

setters : Settings -> ((Value,Address) -> msg) -> Setters msg
setters settings msg =
    let
        sset = set msg settings.at
    in
        { string = sset JE.string
        , bool = sset JE.bool
        , value = sset identity
        }

force_updateAt : Int -> (JE.Value -> JE.Value) -> JE.Value -> List JE.Value -> List JE.Value
force_updateAt i fn default l =
    let
        nl = l ++ (List.repeat ((i+1) - (List.length l)) default)
    in
        LE.updateAt i fn nl

setAt : Address -> JE.Value -> Settings -> Settings
setAt at_ v settings =
    let
        setValue : Address -> JE.Value -> JE.Value
        setValue aa ss = case aa of
            [] -> v

            (Index i)::rest -> 
                JD.decodeValue (JD.list JD.value) ss
                |> Result.withDefault []
                |> force_updateAt i (setValue rest) JE.null
                |> JE.list identity

            (Field k)::rest -> 
                JD.decodeValue (JD.dict JD.value) ss
                |> Result.withDefault (Dict.fromList [])
                |> Dict.update k (Maybe.withDefault (JE.object []) >> setValue rest >> Just)
                |> JE.dict identity identity

            (IndexWhere prop default)::rest -> 
                let
                    i = Result.withDefault 0 <| JD.decodeValue (decode_index_where prop) ss
                    nss = 
                        JD.decodeValue (JD.list JD.value) ss 
                        |> Result.withDefault []
                        |> force_updateAt i identity default
                        |> JE.list identity

                in
                    setValue ((Index i)::rest) nss
    in
        { settings | value = setValue at_ settings.value }

