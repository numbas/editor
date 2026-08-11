module Settings exposing
    ( Settings
    , Address
    , AddressItem(..)
    , Value
    , Getter
    , Getters
    , Setter
    , Setters
    , empty
    , fromValue
    , index
    , field
    , key
    , indexWhere
    , indexWhereName
    , at
    , atIndex
    , atField
    , no_defaults
    , maybe_get
    , get
    , getters
    , insert
    , merge
    , set
    , setters
    , setList
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
    | Key String

type alias Address = List AddressItem

type alias Getter a = Settings -> a

type alias Setter a msg = a -> msg

type alias Getters =
    { string : Getter String
    , bool : Getter Bool
    , value : Getter Value
    , list : Getter (List Value)
    }

type alias Setters msg =
    { string : Setter String msg
    , bool : Setter Bool msg
    , value : Setter Value msg
    }

empty : Settings
empty =
    { value = JE.object []
    , defaults = JE.object []
    , at = []
    }

fromValue : JE.Value -> JE.Value -> Settings
fromValue defaults value = 
    { value = value
    , defaults = defaults
    , at = []
    }

at : Address -> Settings -> Settings
at at_ s = { s | at = s.at ++ at_ }

field : String -> AddressItem
field = Field

key : String -> AddressItem
key = Key

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

no_defaults : Settings -> Settings
no_defaults settings = { settings | defaults = JE.null }

maybe_get : JD.Decoder a -> Settings -> Maybe a
maybe_get decoder settings =    
    let
        reach : Bool -> Address -> JD.Decoder a
        reach use_default at_ = 
            let
                down = reach use_default
            in
                case at_ of
                    [] -> decoder
                    (Index i)::rest -> JD.oneOf ([(True, JD.index i (down rest)), (use_default, JD.field "items" (down rest))] |> List.filter first |> List.map second)
                    (Field k)::rest -> JD.field k (down rest)
                    (Key k)::[] -> JE.string k |> JD.decodeValue decoder |> \r -> case r of
                        Ok a -> JD.succeed a
                        Err _ -> JD.fail ""

                    (Key k)::rest -> JD.field k (down rest)
                    (IndexWhere prop _)::rest ->
                        (decode_index_where prop)
                        |> JD.andThen (\i -> JD.index i (down rest))


        decode_value = reach False settings.at

        decode_default = reach True settings.at
    in
        settings.value
        |> JD.decodeValue decode_value
        |> (\r -> case r of
            Ok v -> Ok v
            Err _ -> JD.decodeValue decode_default settings.defaults
           )
        |> Result.toMaybe


get : JD.Decoder a -> a -> Settings -> a
get decoder default settings =
    maybe_get decoder settings
    |> Maybe.withDefault default

getters : Getters
getters =
    { string = get (JD.oneOf [JD.string, JD.float |> JD.map String.fromFloat]) ""
    , bool = get JD.bool False
    , value = get JD.value (JE.null)
    , list = get (JD.list JD.value) []
    }

insert : String -> Value -> Settings -> Settings
insert k v s = 
    let
        dict = JD.decodeValue (JD.dict JD.value) s.value |> Result.withDefault (Dict.empty)
        ndict = Dict.insert k v dict
    in
        {s | value = JE.dict identity identity ndict }

merge : Dict String Value -> Settings -> Settings
merge more s = 
    let
        value = JD.decodeValue (JD.dict JD.value) s.value |> Result.withDefault Dict.empty
    in
        { s | value = JE.dict identity identity (Dict.union value more) }

set : ((Value, Address) -> msg) -> Address -> (a -> Value) -> Setter a msg
set msg at_ encoder a = msg (encoder a, at_)

setters : Settings -> ((Value,Address) -> msg) -> Setters msg
setters settings msg =
    let
        sset = set msg settings.at
    in
        { string = sset JE.string
        , bool = sset JE.bool
        , value = sset identity
        }

setList : ((Value,Address) -> msg) -> (a -> Value) -> Settings -> Setter (List a) msg
setList msg encode settings = set msg settings.at (JE.list encode)

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

            (Key k)::[] ->
                let
                    nk = JD.decodeValue JD.string v |> Result.withDefault k
                in
                    JD.decodeValue (JD.dict JD.value) ss
                    |> Result.withDefault (Dict.fromList [])
                    |> Dict.toList
                    |> (\l -> if List.member k (List.map first l) then l else l++[(k, JE.null)])
                    |> List.map (\(k2, v2) -> (if k2==k then nk else k2, v2))
                    |> Dict.fromList
                    |> JE.dict identity identity

            (Key k)::rest -> 
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

