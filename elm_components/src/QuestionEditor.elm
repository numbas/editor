port module QuestionEditor exposing (main)

import Aria
import Browser
import Debouncer.Messages as Debouncer exposing (Debouncer, toDebouncer)
import Dict exposing (Dict)
import FilterList
import Html as H exposing (Html)
import Html.Attributes as HA
import Html.Events as HE
import Http
import Json.Encode as JE
import Json.Decode as JD
import Json.Decode.Extra as JDE exposing (andMap)
import List.Extra as LE
import Parser as P exposing (Parser, Step(..), (|.), (|=))
import Set exposing (Set)
import Settings as S exposing (Settings)
import Tabber exposing (Tabber, Tab, TabView, Msg(..), TabLabel(..), tab_button)
import Task
import Tuple exposing (pair, mapFirst, first, second)
import Ui exposing (Ui, UiConfig, visibleIf, jme_preview, raw_html)
import History exposing (History)
import Util exposing 
    ( fi
    , ff
    , letter_ordinal
    , delay
    , first_two
    , dropRight
    , third
    , nested_count
    )

port ask_numbas : JE.Value -> Cmd msg
port answer_numbas : (JE.Value -> msg) -> Sub msg

{- not really a monad, shhh -}
type alias Monad a b = (a, b)

type ChangeAmount
    = NoChange
    | SmallChange
    | BigChange

type alias ChangeSideEffect x = Monad x (ChangeAmount, Cmd Msg)

type alias NumbasQuery =
    { command : String
    , key : JE.Value
    , param : JE.Value
    }

type alias Project =
    { name : String
    , url : String
    , breadcrumbs : List ProjectFolder
    }

type alias ProjectFolder =
    { name : String
    , url : String
    }

type alias Preview =
    { url : String
    , target : String
    }

type alias ActiveModelRecord = 
    { generate_variables_debouncer : Debouncer Msg
    , extension_search : FilterList.State
    , saving : Saving
    , last_saved : Maybe String
    , adding_part : Maybe (PartPath, ChildPart)
    , tab_state : Tabber.State
    , pk : Int
    , preview : Preview
    , project : Project
    , urls : EditorUrls
    , share : ShareTokens
    , extensions : List Extension
    , jme_types : List String
    , ui : Ui Msg
    , numbas : JE.Value
    , default_settings : JE.Value
    , history : History Question
    }

type alias EditorUrls =
    { copy : String
    , delete : String
    , download : String
    , source : String
    }

type alias ShareTokens =
    { view : String
    , edit : String
    }

type Saving
    = Saved (Result Http.Error ())
    | Changed
    | Saving String

type Model
    = ActiveModel ActiveModelRecord
    | ErrorModel JD.Error

type alias Question =
    { settings : Settings
    , computed : Settings
    , parts : PartContainer
    , variable_groups : List VariableGroup
    , scope : Maybe JE.Value
    , instance : Maybe JE.Value
    }

type PartsMode
    = ExploreMode
    | AllPartsMode

type alias PartPath = List (ChildPart, Int)

type ChildPart
    = TopPart
    | Gap
    | Step
    | Alternative

type alias Parts =
    { parts : List Part
    , gaps : List Part
    , steps : List Part
    , alternatives : List Part
    }

type PartContainer = PartContainer Parts

type alias PartType =
    { name : String
    , nice_name : String
    , description : String
    , help_url : String
    , can_be_gap : Bool
    , can_be_step: Bool
    , has_marks : Bool
    , has_marking_settings : Bool
    , has_feedback_icon : Bool
    , has_correct_answer : Bool
    , widget : String
    }

type alias Part =
    { type_ :  PartType
    , settings : Settings
    , computed : Settings
    , children : PartContainer
    , marking_algorithm : MarkingAlgorithm
    }

type alias Note =
  { settings : Settings
  , changed : Bool
  }

type alias MarkingAlgorithm = 
    { notes : List Note
    , base_notes : List Note
    }

type alias VariablePath = (Int, Int)

type alias VariableGroup =
    { name : String
    , variables : List Variable
    }

type alias Variable =
    { value : Maybe (Result String JE.Value)
    , computed : Settings
    , settings : Settings
    , template : String
    }

type alias VariablesGenerationResult =
    { conditionSatisfied : Bool
    , variables : Dict String VariableGenerationResult
    , scope : JE.Value
    }

type alias VariableGenerationResult =
    { value : Result String JE.Value
    , result : Dict String JE.Value
    }

type alias GeneratedPartInfo =
    { answer : JE.Value
    }

type alias Extension =
    { name : String
    , location : String
    , edit_url : String
    , can_edit : Bool
    , url : String
    , pk : Int
    , script_url : String
    , scripts : List String
    , stylesheets : List String
    }

type alias BuiltinConstant =
    { name : String
    , tex : String
    , value : JE.Value
    , enabled : Bool
    }

type SubmitResult =
    Answered MarkingFeedback

type alias MarkingFeedback = 
    { credit : Float
    , messages : List FeedbackMessage
    }

type alias FeedbackMessage =
    { credit_change : String
    , credit: Float
    , message : JE.Value
    , op : String
    , reason : String
    , scope : JE.Value
    }

type alias PropertyOptions =
    { help : Maybe String {- text description of the subject. The label is used to find the matching reference in the docs. -}
    , id : String {- id attribute for the input -}
    , label : String {- displayed label text -}
    , settings : Settings
    , setter : (JE.Value, S.Address) -> Msg
    }

type alias PropertyWidget = Ui Msg -> PropertyOptions -> List (Html Msg)

type Msg
    = UpdateQuestion QuestionMsg
    | UpdateTab Tabber.Msg
    | Undo
    | Redo
    | NoOp
    | Save Question
    | FinishedSaving (Result Http.Error ())
    | StartAddingPart PartPath ChildPart
    | AnswerNumbas JE.Value
    | GenerateVariableDebouncer (Debouncer.Msg Msg)
    | SetExtensionSearch String

type alias SettingWatchers path a = List (S.Address, path -> { a | settings : Settings, computed : Settings } -> JE.Value -> Maybe (Cmd Msg))

type SettingChangeKind
    = FinalSetting
    | CustomisableFinalSetting
    | ComputedSetting

type QuestionMsg
    = ChangeQuestionSetting SettingChangeKind (JE.Value, S.Address)
    | UpdatePart PartPath PartMsg
    | AddPart PartPath ChildPart Part
    | DeletePart PartPath
    | AddVariableGroup
    | AddVariable Int
    | DeleteVariable VariablePath
    | UpdateVariable VariablePath VariableMsg
    | RegenerateVariables
    | AddFunction
    | ShowVariable String
    | ShowPart PartPath
    | GenerateQuestion

type PartMsg
    = ChangePartSetting SettingChangeKind (JE.Value, S.Address)
    | UpdateMarkingAlgorithm MarkingAlgorithmMsg
    | SubmitAnswer

type VariableMsg
    = ChangeVariableSetting (JE.Value, S.Address)
    | ChangeVariableTemplateSetting (JE.Value, S.Address)
    | ChangeVariableComputed String JE.Value
    | PrettyPrintJSON

type MarkingAlgorithmMsg
    = ChangeMarkingAlgorithmNote Int (JE.Value, S.Address)
    | AddMarkingAlgorithmNote
    | DeleteMarkingAlgorithmNote Int

do_ask_numbas : NumbasQuery -> Cmd msg
do_ask_numbas q =
    JE.object
        [ ("command", JE.string q.command)
        , ("key", q.key)
        , ("param", q.param)
        ]
    |> ask_numbas

ask_numbas_about_part : PartPath -> String -> JE.Value -> Cmd msg
ask_numbas_about_part path command param = do_ask_numbas
    { command = command
    , key = JE.object [("part", JE.string <| part_path_toString path)]
    , param = param
    }

ask_numbas_about_variable : VariablePath -> String -> JE.Value -> Cmd msg
ask_numbas_about_variable (gi,vi) command param = do_ask_numbas
    { command = command
    , key = JE.object [("variable", JE.list JE.int [gi, vi])]
    , param = param
    }

nocmd : model -> (model, Cmd msg)
nocmd model = (model, Cmd.none)

nochange : model -> ChangeSideEffect model
nochange model = (model, (NoChange, Cmd.none))

set_tab : String -> String -> Cmd Msg
set_tab tabber_id tab_id = Tabber.set_tab tabber_id tab_id |> Task.perform UpdateTab

numbas_version = "finer_feedback_settings"

insert_json : String -> JE.Value -> JE.Value -> JE.Value
insert_json k v value =
    let
        obj = 
            JD.decodeValue (JD.dict JD.value) value
            |> Result.withDefault Dict.empty

        nobj =
            Dict.insert k v obj

    in
        JE.dict identity identity nobj

blank_variable : Variable
blank_variable =
    { value = Nothing
    , computed = S.empty
    , settings = S.empty
    , template = "anything"
    }

encode_model : ActiveModelRecord -> JE.Value
encode_model model =
    let
        eq = encode_question model.history.current
    in
        JE.object
            [ ("content", JE.string <| "// Numbas version: "++numbas_version++"\n"++(JE.encode 0 eq))
            , ("ability_levels", JE.list JE.string [])
            , ("extensions", JE.list JE.string [])
            , ("metadata", JE.object
                [ ("description", JE.string "")
                , ("licence", JE.string "None specified")
                ]
              )
            , ("resources", JE.list JE.string [])
            , ("tags", JE.list JE.string [])
            , ("taxonomy_nodes", JE.list JE.string [])
            ]

save_question : JE.Value -> ActiveModelRecord -> Cmd Msg
save_question encoded_model model =
    Http.request
        { method = "POST"
        , headers = 
            [ Http.header "X-CSRFToken" model.ui.config.csrf_token
            ]
        , url = ""
        , body = Http.jsonBody encoded_model
        , expect = Http.expectWhatever FinishedSaving
        , timeout = Just 5000
        , tracker = Nothing
        }


main = Browser.element
    { init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }


empty_part_container =
    PartContainer 
        { parts = []
        , gaps = []
        , steps = []
        , alternatives = []
        }

apply_part_container : (Parts -> a) -> PartContainer -> a
apply_part_container fn pc = case pc of
    PartContainer c -> fn c

map_part_container : (Parts -> Parts) -> PartContainer -> PartContainer
map_part_container fn = apply_part_container (fn >> PartContainer)

part_getter : ChildPart -> (PartContainer -> List Part)
part_getter kind = apply_part_container <| case kind of
    TopPart -> .parts
    Gap -> .gaps
    Step -> .steps
    Alternative -> .alternatives

set_parts : ChildPart -> List Part -> PartContainer -> PartContainer
set_parts kind parts = map_part_container (\c -> 
    case kind of
        TopPart -> { c | parts = parts }
        Gap -> { c | gaps = parts }
        Step -> { c | steps = parts }
        Alternative -> { c | alternatives = parts }
    )

parse_part_path : String -> Maybe PartPath
parse_part_path = 
    let
        part_path_parser : Parser PartPath
        part_path_parser =
            P.loop
                []
                part_path_parser_help

        part_path_parser_help path =
            P.oneOf
            [ P.succeed (\k n -> Loop ((k, n)::path))
                |= P.oneOf
                    ( [ ("p", TopPart)
                      , ("g", Gap)
                      , ("s", Step)
                      , ("a", Alternative)
                      ]
                      |> List.map (\(s,kind) -> P.symbol s |> P.map (\_ -> kind))
                    )
                |= P.int
            , P.succeed () |> P.map (\_ -> Done (List.reverse path))
            ]
    in
        P.run part_path_parser >> Result.toMaybe

update_part_container : PartPath -> (PartContainer -> PartContainer) -> PartContainer -> PartContainer
update_part_container path fn container = case path of
    [] -> fn container

    (kind, i)::rest -> 
        let
            list = part_getter kind container
            nlist = LE.updateAt i (\p -> { p | children = update_part_container rest fn p.children}) list
        in
            set_parts kind nlist container

part_siblings : ChildPart -> PartPath -> PartContainer -> List Part
part_siblings kind path c = case path of
    [] -> part_getter kind c
    (k,i)::rest -> 
        LE.getAt i (part_getter k c) 
        |> Maybe.map (.children >> part_siblings kind rest)
        |> Maybe.withDefault []

child_part_name : ChildPart -> String
child_part_name kind = case kind of
    TopPart -> "p"
    Gap -> "g"
    Step -> "s"
    Alternative -> "a"

child_part_label : ChildPart -> String
child_part_label kind = case kind of
    TopPart -> "part"
    Gap -> "gap"
    Step -> "step"
    Alternative -> "alternative"

part_path_toString : PartPath -> String
part_path_toString =
    List.map (\(kind,i) -> (child_part_name kind)++(fi i))
    >> String.join ""

add_part : ChildPart -> Part -> PartContainer -> PartContainer
add_part kind p c =
    let
        existing = part_getter kind c
    in
        set_parts kind (existing++[p]) c

add_part_at : PartPath -> ChildPart -> Part -> PartContainer -> PartContainer
add_part_at path kind part = update_part_container path (add_part kind part)

delete_part : ChildPart -> Int -> PartContainer -> PartContainer
delete_part kind i c =
    let
        existing = part_getter kind c
    in
        set_parts kind (LE.removeAt i existing) c

delete_part_at : PartPath -> PartContainer -> PartContainer
delete_part_at path pc = case List.reverse path of
    [] -> pc
    (kind, i)::rest -> update_part_container (List.reverse rest) (delete_part kind i) pc

delete_variable_at : VariablePath -> List VariableGroup -> List VariableGroup
delete_variable_at (gi, vi) = LE.updateAt gi (\g -> { g | variables = LE.removeAt vi g.variables })

pullout : (a -> (a, x)) -> (b -> a) -> (a -> b -> b) -> b -> (b, x)
pullout fn get set container =
    let
        a = get container
        (na, x) = fn a
        ncontainer = set na container
    in
        (ncontainer, x)

m_updateAt : Int -> (a -> ChangeSideEffect a) -> List a -> ChangeSideEffect (List a)
m_updateAt i fn =
       List.indexedMap pair
    >> List.foldl (\(j,a) (ol,mm) -> 
        if j==i then 
            let
                (na, x) = fn a
            in
                (ol++[na], x)
        else
            (ol++[a], mm)
        )
        ([] |> nochange)

mapMonad : (a -> b) -> Monad a x -> Monad b x
mapMonad = Tuple.mapFirst

update_variable_at : VariablePath -> (Variable -> ChangeSideEffect Variable) -> List VariableGroup -> ChangeSideEffect (List VariableGroup)
update_variable_at (gi,vi) fn groups =
    let
        do_group group = 
            let
                (variables, cmd) = m_updateAt vi fn group.variables
            in
                ({group | variables = variables}, cmd)
    in
        groups
        |> m_updateAt gi do_group

update_part_at : PartPath -> (Part -> ChangeSideEffect Part) -> PartContainer -> ChangeSideEffect PartContainer
update_part_at path fn c = 
    case path of
        [] -> c |> nochange
        (kind, i)::rest ->
            let
                parts : List Part
                parts = part_getter kind c

                up p = case rest of
                    [] -> fn p
                    _ -> 
                        update_part_at rest fn p.children
                        |> mapMonad (\nchildren -> { p | children = nchildren })
            in
                m_updateAt i up parts
                |> mapMonad (\nparts -> set_parts kind nparts c)


part_children : Part -> Parts
part_children part = case part.children of
    PartContainer c -> c

unwrap_part_container : PartContainer -> List (PartPath, Part)
unwrap_part_container = apply_part_container (\c ->
    let
        handle : ChildPart -> Int -> Part -> List (PartPath, Part)
        handle kind i part = [([(kind,i)],part)] ++ (unwrap_part_container part.children |> List.map (Tuple.mapFirst ((::) (kind,i))))
    in
        [ (TopPart, .parts)
        , (Gap, .gaps)
        , (Step, .steps)
        , (Alternative, .alternatives)
        ]
        |> List.concatMap (\(kind, getter) -> getter c |> List.indexedMap (handle kind) |> List.concatMap identity)
    )

variable_type : Variable -> Maybe String
variable_type = .value >> Maybe.andThen (Result.andThen (JD.decodeValue (JD.field "type" JD.string) >> Result.mapError JD.errorToString) >> Result.toMaybe)

standard_part_type : String -> String -> String -> String -> String -> PartType
standard_part_type name nice_name description help_page widget =
  { name = name
  , nice_name = nice_name
  , description = description
  , help_url = help_page
  , can_be_gap = True
  , can_be_step = True
  , has_marks = True
  , has_marking_settings = True
  , has_feedback_icon = True
  , has_correct_answer = True
  , widget = widget
  }

part_types : List PartType
part_types = 
    [ { name = "information"
      , nice_name = "Information only"
      , description = "An information part contains only a prompt and no answer input. It is most often used as a Step to provide a hint for a parent part."
      , help_url = "information-only"
      , can_be_gap = False
      , can_be_step = True
      , has_marks = False
      , has_marking_settings = False
      , has_feedback_icon = False
      , has_correct_answer = False
      , widget = ""
      }
    , { name = "gapfill"
      , nice_name = "Gap-fill"
      , description = "Gap-fill parts allow you to include answer inputs inline with the prompt text, instead of at the end of the part."
      , help_url = "gap-fill"
      , can_be_gap = False
      , can_be_step = False
      , has_marks = True
      , has_marking_settings = True
      , has_feedback_icon = True
      , has_correct_answer = False
      , widget = ""
      }
    , { name = "extension"
      , nice_name = "Extension"
      , description = "An extension part acts as a placeholder for any interactive element added by an extension, or custom code in the question, which awards marks to the student."
      , help_url = "extension-part"
      , can_be_gap = True
      , can_be_step = True
      , has_marks = True
      , has_marking_settings = True
      , has_feedback_icon = False
      , has_correct_answer = False
      , widget = ""
      }
    , standard_part_type
        "jme"
        "Mathematical expression"
        "Ask the student to enter an algebraic expression, using JME syntax."
        "mathematical-expression"
        "jme"
    , standard_part_type
        "numberentry"
        "Number entry"
        "Ask the student to enter a number."
        "number-entry"
        "number"
    , standard_part_type
        "matrix"
        "Matrix entry"
        "Ask the student to enter a matrix of numbers."
        "matrix-entry"
        "matrix"
    , standard_part_type
        "patternmatch"
        "Match text pattern"
        "Ask the student to enter short, non-mathematical text."
        "match-text-pattern"
        "string"
    , standard_part_type
        "1_n_2"
        "Choose one from a list"
        "The student must choose one of several options."
        "multiple-choice"
        "radios"
    , standard_part_type
        "m_n_2"
        "Choose several from a list"
        "The student can choose any of a list of options."
        "multiple-choice"
        "checkboxes"
    , standard_part_type
        "m_n_x"
        "Match choices with answers"
        "The student is presented with a 2D grid of choices and answers. Depending on how the part is set up, they must either match up each choice with an answer, or select any number of choice-answer pairs."
        "multiple-choice"
        "m_n_x"
    ]

custom_part_type =
    { name = "custom"
    , nice_name = "Custom"
    , description = "TODO"
    , help_url = "question/parts/custom.html"
    , can_be_gap = True
    , can_be_step = True
    , has_marks = True
    , has_marking_settings = True
    , has_feedback_icon = True
    , has_correct_answer = True
    , widget = ""
    }

bottom_index : PartPath -> Maybe (ChildPart, Int)
bottom_index = List.reverse >> List.head

part_name : PartPath -> Part -> String
part_name path part = case S.getters.string (S.atField "customName" part.settings) of
    "" -> case bottom_index path of
        Just (TopPart, i) -> "Part "++(letter_ordinal i)++")"
        Just (Gap, i) -> "Gap "++(fi i)++"."
        Just (Step, i) -> "Step "++(fi i)
        Just (Alternative, i) -> "Alternative "++(fi i)
        _ -> "Part"

    name -> name

blank_note = { settings = S.empty, changed = True }

new_part : JE.Value -> PartType -> JE.Value -> PartContainer -> Part
new_part default_settings type_ settings children =
    let
        string = JE.string ""
        true = JE.bool True
        false = JE.bool False
        float = String.fromFloat >> JE.string

        standard_defaults = get_default_settings ["part"] default_settings

        type_defaults = get_default_settings ["part_types", type_.name] default_settings

        base_notes = 
            get_default_settings ["marking_algorithms", type_.name] default_settings
            |> JD.decodeValue (JD.list decode_note)
            |> Result.withDefault []

        notes = 
            JD.decodeValue (JD.at ["customMarkingAlgorithm", "notes"] (JD.list decode_note) ) settings
            |> Result.withDefault []
            |> List.map (\n -> {n | changed = True})

        marking_algorithm =
            { notes = notes ++ base_notes
            , base_notes = base_notes
            }

        defaults = 
            Result.map2 (Dict.union)
                (JD.decodeValue (JD.dict JD.value) standard_defaults)
                (JD.decodeValue (JD.dict JD.value) type_defaults)
            |> Result.map (JE.dict identity identity)
            |> Result.withDefault JE.null

        nsettings = S.fromValue defaults settings
    in
        { type_ = type_
        , settings = nsettings
        , computed = S.empty
        , children = children
        , marking_algorithm = marking_algorithm
        }

get_default_settings : List String -> JE.Value -> JE.Value
get_default_settings at =
    JD.decodeValue (JD.at at JD.value)
    >> Result.withDefault (JE.null)

decode_question : JE.Value -> JD.Decoder Question
decode_question default_settings =
    JD.succeed (\settings -> 
        let
            rulesets : List JE.Value
            rulesets = 
                S.maybe_get
                    ( JD.dict (JD.list JD.string) |> JD.map (Dict.toList >> List.map (\(name, rules) -> JE.object [("name", JE.string name), ("definition", JE.string <| String.join "," rules)])) )
                    (S.atField "rulesets" <| S.no_defaults settings)
                |> Maybe.withDefault []

            computed =
                S.empty
                |> S.insert "rulesets" (JE.list identity rulesets)
        in
            Question settings computed
        )
    |> andMap (JD.value |> JD.map (S.fromValue (get_default_settings ["question"] default_settings)))
    |> andMap (decode_child_parts default_settings)
    |> andMap (
        JD.map2 (\group_defs variable_dict ->
            let
                grouped_variables = group_defs |> List.map second |> List.concat |> Set.fromList

                ungrouped_variables = Dict.values variable_dict |> List.filter (\v -> 
                    let
                        name = name_of v
                    in
                        not (Set.member name grouped_variables))

                ungrouped = { name = "Ungrouped variables", variables = ungrouped_variables }

                groups : List VariableGroup
                groups = group_defs |> List.map (\(name, vnames) ->
                    { name = name
                    , variables = vnames |> List.filterMap (\n -> Dict.get n variable_dict)
                    }
                    )
            in
                ungrouped :: groups
                
        )
        (JD.oneOf
            [ JD.field "variable_groups" (JD.list (JD.succeed pair
                |> andMap (JD.field "name" JD.string)
                |> andMap (JD.list JD.string)
              ))
            , JD.succeed []
            ]
        )
        (JD.oneOf 
            [ JD.field "variables" <| JD.dict <| decode_variable default_settings
            , JD.succeed Dict.empty
            ]
        )
       )
    |> andMap (JD.succeed Nothing)
    |> andMap (JD.succeed Nothing)

decode_part : JE.Value -> JD.Decoder Part
decode_part default_settings = 
    JD.succeed (new_part default_settings)
    |> andMap (
        JD.field "type" (JD.string
        |> JD.andThen (\t -> case part_types |> List.filter (.name >> (==) t) |> List.head of
            Just type_ -> JD.succeed type_
            Nothing -> JD.succeed custom_part_type
           )
       )
    )
    |> andMap JD.value
    |> andMap (decode_child_parts default_settings)

decode_child_parts : JE.Value -> JD.Decoder PartContainer
decode_child_parts default_settings = 
    let
        doer key = JD.oneOf [JD.field key (JD.list (JD.lazy (\_ -> decode_part default_settings))), JD.succeed []]
    in
        (JD.succeed Parts)
        |> andMap (doer "parts")
        |> andMap (doer "gaps")
        |> andMap (doer "steps")
        |> andMap (doer "alternatives")
        |> JD.map PartContainer


child_part_kinds : List (String, ChildPart)
child_part_kinds =
    [ ("parts", TopPart)
    , ("gaps", Gap)
    , ("steps", Step)
    , ("alternatives", Alternative)
    ]

decode_variable : JE.Value -> JD.Decoder Variable
decode_variable default_settings =
    let
        variable_defaults = get_default_settings ["question", "variables", "additionalProperties"] default_settings
    in
        JD.succeed (Variable Nothing S.empty)
        |> andMap (JD.value |> JD.map (S.fromValue variable_defaults))
        |> andMap (JD.oneOf [JD.field "templateType" JD.string, JD.succeed "anything"])


decode_extension : JD.Decoder Extension
decode_extension =
    JD.succeed Extension
    |> andMap (JD.field "name" JD.string)
    |> andMap (JD.field "location" JD.string)
    |> andMap (JD.field "edit_url" JD.string)
    |> andMap (JD.field "can_edit" JD.bool)
    |> andMap (JD.field "url" JD.string)
    |> andMap (JD.field "pk" JD.int)
    |> andMap (JD.field "script_url" JD.string)
    |> andMap (JD.field "scripts" (JD.list JD.string))
    |> andMap (JD.field "stylesheets" (JD.list JD.string))


decode_project: JD.Decoder Project
decode_project =
    JD.succeed Project
    |> andMap (JD.field "name" JD.string)
    |> andMap (JD.field "url" JD.string)
    |> andMap (JD.field "breadcrumbs" (JD.list decode_project_folder))

decode_project_folder : JD.Decoder ProjectFolder
decode_project_folder =
    JD.succeed ProjectFolder
    |> andMap (JD.field "name" JD.string)
    |> andMap (JD.field "url" JD.string)

decode_urls: JD.Decoder EditorUrls
decode_urls =
    JD.succeed EditorUrls
    |> andMap (JD.field "copy" JD.string)
    |> andMap (JD.field "delete" JD.string)
    |> andMap (JD.field "download" JD.string)
    |> andMap (JD.field "source" JD.string)

decode_share : JD.Decoder ShareTokens
decode_share =
    JD.succeed ShareTokens
    |> andMap (JD.field "view" JD.string)
    |> andMap (JD.field "edit" JD.string)

decode_preview: JD.Decoder Preview
decode_preview =
    JD.succeed Preview
    |> andMap (JD.field "url" JD.string)
    |> andMap (JD.field "target" JD.string)

decode_ui =
    JD.succeed UiConfig
    |> andMap (JD.at ["item_json", "icon_map"] (JD.dict JD.string))
    |> andMap (JD.field "CSRFToken" JD.string)
    |> andMap (JD.at ["item_json", "helpURL"] JD.string)
    |> andMap (JD.field "docs_mapping" (JD.dict JD.string |> JD.map (Dict.toList >> List.map (Tuple.mapFirst String.toLower) >> Dict.fromList)))
    |> JD.map Ui.ui

decode_note =
    JD.succeed Note
    |> andMap (JD.value |> JD.map (S.fromValue JE.null))
    |> andMap (JD.succeed False)

andThen2 : (a -> b -> JD.Decoder c) -> JD.Decoder a -> JD.Decoder b -> JD.Decoder c
andThen2 fn a b = JD.map2 fn a b |> JD.andThen identity

decode_flags : JD.Decoder ActiveModelRecord
decode_flags =
    JD.succeed ( 
        ActiveModelRecord 
            (Debouncer.debounce 500 |> toDebouncer)
            FilterList.init
            (Saved (Ok ()))
            Nothing
            Nothing
    )
    |> andMap (JD.field "tab_state" Tabber.decode_state)
    |> andMap (JD.at ["item_json", "itemJSON", "id"] JD.int)
    |> andMap (JD.at ["item_json", "preview"] decode_preview)
    |> andMap (JD.at ["item_json", "project"] decode_project)
    |> andMap (JD.at ["item_json", "urls"] decode_urls)
    |> andMap (JD.at ["item_json", "share"] decode_share)
    |> andMap (JD.at ["item_json", "numbasExtensions"] (JD.list decode_extension))
    |> andMap (JD.field "jme_types" (JD.list JD.string))
    |> andMap (decode_ui)
    |> JD.andThen (\partial -> 
        andThen2
            (\numbas default_settings ->
                (JD.at ["item_json", "itemJSON", "JSONContent"] (decode_question default_settings))
                |> JD.map (\q -> partial numbas default_settings (History.init q))
            )
            (JD.field "Numbas" JD.value)
            (JD.field "default_settings" JD.value)
       )

encode_question : Question -> JE.Value
encode_question question =
    JE.object 
        (( S.get (JD.dict JD.value |> JD.map Dict.toList) [] question.settings)
        ++ (encode_part_container question.parts)
        ++ [ ("variables", question.variable_groups |> List.concatMap (.variables) |> List.map (\v ->
                (name_of v, encode_variable v)
                ) |> JE.object
             )
           ]
        )

encode_variable : Variable -> JE.Value
encode_variable variable = JE.object (S.get (JD.dict JD.value |> JD.map Dict.toList) [] variable.settings)
        

encode_part_container : PartContainer -> List (String, JE.Value)
encode_part_container pc = 
    ( child_part_kinds
    |> List.map (Tuple.mapSecond (\k -> part_getter k pc))
    |> List.map (Tuple.mapSecond (JE.list encode_part))
    )

encode_part : Part -> JE.Value
encode_part part =
    let
        notes = part.marking_algorithm.notes |> List.filter (.changed)

        use_custom_algorithm = notes /= [] || part.type_.name == "extension"
        
        extendBaseMarkingAlgorithm = S.getters.bool (S.atField "extendBaseMarkingAlgorithm" part.settings)
    in
        JE.object
            (( S.get (JD.dict JD.value |> JD.map Dict.toList) [] part.settings)
            ++ [ ("type", JE.string part.type_.name)
               , ("customMarkingAlgorithm", encode_marking_algorithm part.marking_algorithm)
               , ("extendBaseMarkingAlgorithm", JE.bool <| (not use_custom_algorithm) || extendBaseMarkingAlgorithm)
               ]
            ++ (encode_part_container part.children)
            )

note_toString : Note -> String
note_toString note =
    let
        nfield k = S.atField k note.settings
        nstring = nfield >> S.getters.string

        name = nstring "name"
        description = nstring "description" |> String.replace "(" "" |> String.replace ")" ""
        definition = nstring "definition"
    in
        name ++ (if description /= "" then " ("++description++")" else "") ++ ":\n" ++ definition

encode_marking_algorithm : MarkingAlgorithm -> JE.Value
encode_marking_algorithm =
    .notes
    >> List.filter (.changed)
    >> JE.list (.settings >> .value)
    >> (\n -> JE.object [("notes", n)])

init : JE.Value -> (Model, Cmd Msg)
init flags =
    JD.decodeValue decode_flags flags
    |> (\r -> case r of
        Ok active -> compute_all active |> Tuple.mapFirst ActiveModel
        Err err -> ErrorModel err |> nocmd
       )

compute_all model =
    let
        question = model.history.current
        all_parts = unwrap_part_container question.parts

        part_cmds : List (Cmd Msg)
        part_cmds = all_parts |> List.concatMap (\(path,part) -> 
            part_setting_computed
            |> List.filterMap (\(ats, fn) -> S.maybe_get JD.value (S.at ats part.settings) |> Maybe.andThen (fn path part))
            )

        all_variables : List (VariablePath, Variable)
        all_variables = 
            question.variable_groups 
            |> List.indexedMap (\gi group -> 
                group.variables
                |> List.indexedMap (\vi variable -> ((gi,vi), variable))
               )
            |> List.concat

        variable_cmds : List (Cmd Msg)
        variable_cmds = all_variables |> List.concatMap (\(path, variable) -> 
            variable_setting_computed
            |> List.filterMap (\(ats, fn) -> S.maybe_get JD.value (S.at ats variable.settings) |> Maybe.andThen (fn path variable))
            )


        variable_def_cmds : List (Cmd Msg)
        variable_def_cmds =
            all_variables
            |> List.map (\(path, variable) -> 
                let
                    definition = S.getters.string (S.atField "definition" variable.settings)
                in
                    ask_numbas_about_variable path "parse_templateType" <|
                        JE.object
                            [ ("variable", variable.settings.value)
                            ]
               )

        cmds = part_cmds ++ variable_cmds ++ variable_def_cmds
    in
        (model, Cmd.batch cmds)

variable_debouncer_config : Debouncer.UpdateConfig Msg ActiveModelRecord
variable_debouncer_config =
    { mapMsg = GenerateVariableDebouncer
    , getDebouncer = .generate_variables_debouncer
    , setDebouncer = \d m -> { m | generate_variables_debouncer = d }
    }

variables_changed : Cmd Msg
variables_changed = 
    Task.perform 
        (  RegenerateVariables
        |> UpdateQuestion
        |> Debouncer.provideInput
        |> GenerateVariableDebouncer
        |> always
        )
        (Task.succeed ())

update : Msg -> Model -> (Model, Cmd Msg)
update msg model = case model of
    ActiveModel active -> update_active msg active |> mapFirst ActiveModel
    ErrorModel _ -> model |> nocmd

update_active : Msg -> ActiveModelRecord -> (ActiveModelRecord, Cmd Msg)
update_active msg model = case msg of
    UpdateQuestion qmsg -> 
        let
            oq = model.history.current
            (nq, (mchange, cmd)) = update_question qmsg oq
            change = case mchange of
                NoChange -> History.no_change
                SmallChange -> History.small_change
                BigChange -> History.big_change 

            history = change nq model.history
        in
            ({ model | history = history, saving = Changed }, Cmd.batch [cmd, if mchange /= NoChange then delay 2000 (Save nq) else Cmd.none])

    GenerateVariableDebouncer dmsg ->
        Debouncer.update update_active variable_debouncer_config dmsg model

    UpdateTab tab_msg -> 
        let
            (state, tabcmd) = Tabber.update tab_msg model.tab_state
        in
            ({model | tab_state = state}, Cmd.map UpdateTab tabcmd)

    AnswerNumbas res -> 
        JD.decodeValue 
            (JD.map2 pair
                (JD.field "command" JD.string)
                (JD.field "result" JD.value)
            |> JD.andThen (\(command, value) -> 
                JD.field "key" (JD.oneOf
                    [ JD.field "part" (JD.string |> JD.andThen (parse_part_path >> JDE.fromMaybe "Bad part path")) |> JD.map (\path -> ChangePartSetting ComputedSetting (value, [S.field command]) |> UpdatePart path |> UpdateQuestion)
                    , JD.field "variable" (JD.list JD.int |> JD.andThen (first_two >> JDE.fromMaybe "Bad variable path")) |> JD.map (\path -> ChangeVariableComputed command value |> UpdateVariable path |> UpdateQuestion)
                    , JDE.when JD.string ((==) "question") (JD.succeed (ChangeQuestionSetting ComputedSetting (value, [S.field command]) |> UpdateQuestion))
                    ]
                )
               )
            |> JD.map (\mm -> update_active mm model)
            )
            res
        |> Result.withDefault (model, Cmd.none) 

    Save q -> 
        let
            encoded_model = encode_model model
            encoded_model_string = JE.encode 0 encoded_model
        in
            if model.last_saved /= Just encoded_model_string && model.saving /= Saving encoded_model_string then
                ({ model | saving = Saving encoded_model_string }, save_question encoded_model model)
            else
                (model, Cmd.none)

    FinishedSaving res -> case model.saving of
        Saving str -> { model | saving = Saved res, last_saved = Just str } |> nocmd
        _ -> model |> nocmd

    StartAddingPart path kind -> { model | adding_part = Just (path, kind) } |> nocmd

    Undo -> { model | history = History.undo model.history } |> compute_all

    Redo -> { model | history = History.redo model.history } |> compute_all

    SetExtensionSearch s -> { model | extension_search = FilterList.update model.extension_search s } |> nocmd

    NoOp -> model |> nocmd

update_question : QuestionMsg -> Question -> ChangeSideEffect Question
update_question msg question = case msg of
    ChangeQuestionSetting ComputedSetting (value, at) -> case at of
        (S.Field "generateVariables")::_ ->
            let
                result = 
                    value
                    |> JD.decodeValue
                        (JD.succeed VariablesGenerationResult
                        |> andMap (JD.field "conditionSatisfied" JD.bool)
                        |> andMap (JD.field "variables" <| JD.dict (
                            JD.succeed VariableGenerationResult
                                |> andMap (JD.oneOf
                                    [ JD.field "value" JD.value |> JD.map Ok
                                    , JD.field "error" JD.string |> JD.map Err
                                    ]
                                  )
                                |> andMap (JD.dict JD.value)
                            ))
                        |> andMap (JD.field "scope" JD.value)
                        )

                nvariable_groups = 
                    result
                    |> Result.map (\r ->
                        question.variable_groups
                        |> List.indexedMap (\gi group ->
                            let
                                nvariables =
                                    group.variables
                                    |> List.indexedMap (\vi variable ->
                                        case Dict.get (name_of variable) r.variables of
                                            Just vvalue -> 
                                                let
                                                    ncomputed = S.merge vvalue.result variable.computed
                                                in
                                                    { variable | computed = ncomputed, value = Just vvalue.value }
                                            Nothing -> variable
                                       )
                            in
                                { group | variables = nvariables }
                           )
                       )
                    |> Result.withDefault question.variable_groups

                scope = 
                    result
                    |> Result.map .scope
                    |> Result.toMaybe
            in
                { question | variable_groups = nvariable_groups, scope = scope } |> nochange

        (S.Field "generateQuestion")::_ ->
            let
                instance = 
                    value
                    |> JD.decodeValue (JD.field "question" JD.value)
                    |> Result.toMaybe

                decode_generated_part_info =
                    JD.succeed GeneratedPartInfo
                    |> andMap (JD.field "answer" JD.value)

                part_infos = 
                    value
                    |> JD.decodeValue (JD.field "part_info" <| JD.dict decode_generated_part_info)
                    |> Result.withDefault (Dict.fromList [])
                    |> Dict.toList
                    |> List.filterMap (\(pathstr, info) ->
                        Maybe.map2 pair
                            (parse_part_path pathstr)
                            (Just info)
                       )

                apply_part_info : GeneratedPartInfo -> Part -> ChangeSideEffect Part
                apply_part_info info part =
                    { part | computed = S.setAt [S.field "expectedAnswer"] info.answer part.computed }
                    |> nochange

                nparts = 
                    List.foldl
                        (\(path, info) pc -> update_part_at path (apply_part_info info) pc |> first)
                        question.parts
                        part_infos
            in
                { question | instance = instance, parts = nparts } |> nochange

        (S.Field "rulesets")::_ ->
            let
                nq = { question | computed = S.setAt at value question.computed }

                rulesets_dict : Dict String JE.Value
                rulesets_dict =
                    S.getters.list (S.atField "rulesets" nq.computed)
                    |> List.filterMap (
                        JD.decodeValue 
                            (JD.map2 pair
                                (JD.field "name" JD.string)
                                (JD.field "definition" JD.string |> JD.map (String.split ","))
                            )
                        >> Result.toMaybe
                        >> Maybe.map (\(name, rules) -> (name, JE.list JE.string rules))
                       )
                    |> Dict.fromList

                rulesets_value = JE.dict identity identity rulesets_dict

            in
                update_question (ChangeQuestionSetting FinalSetting (rulesets_value, [S.field "rulesets"])) nq

        _ -> update_setting question_setting_computed ComputedSetting (value, at) () question

    ChangeQuestionSetting kind (v,at) -> update_setting question_setting_computed kind (v,at) () question

    AddPart parent_path kind part -> 
        let
            siblings = part_siblings kind parent_path question.parts
            index = List.length siblings
            npath = parent_path++[(kind, index)]
            tab_id = part_tab_id npath
        in
            ({ question | parts = add_part_at parent_path kind part question.parts }, (BigChange, set_tab "parts" tab_id))

    UpdatePart path pmsg -> 
        let
            (parts, cmd) = update_part_at path (update_part question pmsg path) question.parts
        in
            ({ question | parts = parts }, cmd)

    DeletePart path -> ({ question | parts = delete_part_at path question.parts }, nocmd BigChange)

    AddVariableGroup ->
        ({ question | variable_groups = { name = "", variables = [] }::question.variable_groups }, nocmd BigChange)

    AddVariable gi -> 
        let
            ngroups =
                question.variable_groups
                |> LE.updateAt gi (\g -> { g | variables = g.variables ++ [blank_variable] })

            vi = 
                question.variable_groups
                |> LE.getAt gi
                |> Maybe.map (.variables >> List.length)
                |> Maybe.withDefault 0

            tab_id = variable_tab_id (gi, vi)

        in
            ({ question | variable_groups = ngroups }, (BigChange, Cmd.batch [variables_changed, set_tab "variables" tab_id]))

    DeleteVariable path ->({ question | variable_groups = delete_variable_at path question.variable_groups }, (BigChange, variables_changed))

    UpdateVariable path vmsg ->
        let
            (variable_groups, (change, cmd)) = update_variable_at path (update_variable vmsg path) question.variable_groups
        in
            ({ question | variable_groups = variable_groups }, (change, Cmd.batch [cmd, variables_changed]))

    RegenerateVariables ->
        let
            cmd = do_ask_numbas 
                { command = "generateVariables"
                , key = JE.string "question"
                , param = JE.object [("question", encode_question question)]
                }
        in
            (question, (NoChange, cmd))

    GenerateQuestion -> case question.scope of
        Nothing -> question |> nochange

        Just scope -> 
            let
                cmd = do_ask_numbas 
                    { command = "generateQuestion"
                    , key = JE.string "question"
                    , param = JE.object 
                        [ ("question", encode_question question)
                        , ("scope", scope)
                        ]
                    }
            in
                (question, (NoChange, cmd))

    ShowVariable name ->
        let
            all_variables : Dict String VariablePath
            all_variables =
                question.variable_groups
                |> List.indexedMap (\gi g -> 
                    g.variables 
                    |> List.indexedMap (\vi ->
                        variable_names
                        >> List.map (\n -> (n, (gi,vi)))
                    )
                    |> List.concat
                )
                |> List.concat
                |> Dict.fromList

            mpath = Dict.get name all_variables
        in
            case mpath of
                Just path -> (question, (NoChange, Cmd.batch [set_tab "main" "variables", set_tab "variables" (variable_tab_id path)]))
                Nothing -> question |> nochange

    ShowPart path ->
        let
            tab_id = part_tab_id path
        in
            (question, (NoChange, set_tab "parts" tab_id))

    AddFunction ->
        let
            functions = S.getters.list (S.atField "functions" question.settings)

            nfunctions = functions ++ [JE.null]

            fi = List.length functions
        in
            ({ question | settings = S.setAt [S.field "functions"] (JE.list identity nfunctions) question.settings}, (BigChange, set_tab "functions" (function_tab_id fi)))
            

question_setting_computed : List (S.Address, () -> Question -> JE.Value -> Maybe (Cmd Msg))
question_setting_computed =
    [ ([S.field "extensions"], \_ q v -> Just variables_changed)
    , ([S.field "functions"], \_ q v -> Just variables_changed)
    ]

update_part : Question -> PartMsg -> PartPath -> Part -> ChangeSideEffect Part
update_part question msg path part = case msg of
    ChangePartSetting kind (v, at) -> update_setting part_setting_computed kind (v, at) path part

    UpdateMarkingAlgorithm mmsg -> update_marking_algorithm mmsg path part

    SubmitAnswer -> case question.instance of
        Nothing -> part |> nochange
        Just instance ->
            let
                answer = S.getters.value (S.atField "testing_answer" part.computed)

                cmd = ask_numbas_about_part path "submit_answer" <|
                        JE.object
                            [ ("answer", answer)
                            , ("path", JE.string <| part_path_toString path)
                            , ("question", instance)
                            ]
            in
                (part, (NoChange, cmd))
            
update_setting : SettingWatchers path a -> SettingChangeKind -> (JE.Value, S.Address) -> path -> { a | settings : Settings, computed : Settings} -> ChangeSideEffect { a | settings : Settings, computed : Settings }
update_setting watchers kind (v, at) path a = case kind of
    FinalSetting ->
        let
            cmds = 
                ( watchers
                  |> List.filter (\(ats, _) -> ats == at)
                  |> List.filterMap (\(_, f) -> f path a v)
                )
                |> List.filter ((/=) Cmd.none) 

            nsettings = S.setAt at v a.settings
        in
            ({ a | settings = nsettings }, (SmallChange, Cmd.batch cmds))

    ComputedSetting -> { a | computed = S.setAt at v a.computed } |> nochange

    CustomisableFinalSetting ->
        let
            value = JD.decodeValue JD.string v |> Result.withDefault "custom"

            nv = case value of
                "custom" -> JE.string ""
                _ -> v

            (na, cmd) = update_setting watchers FinalSetting (nv, at) path a

            ncomputed = S.setAt at (JE.bool <| value == "custom") na.computed
        in
            ({ na | computed = ncomputed }, cmd)


update_marking_algorithm : MarkingAlgorithmMsg -> PartPath -> Part -> ChangeSideEffect Part
update_marking_algorithm msg path part =
    let
        marking_algorithm = part.marking_algorithm

        path_string = part_path_toString path
        (nalgo, cmd) = case msg of
            ChangeMarkingAlgorithmNote i (v, at) -> 
                let
                    nnotes = LE.updateAt i (\note -> { note | changed = True, settings = S.setAt at v note.settings }) marking_algorithm.notes
                in
                    ({ marking_algorithm | notes = nnotes }, (SmallChange, Cmd.none))

            AddMarkingAlgorithmNote ->
                let
                    set_tab_cmd = set_tab (path_string++"-marking-algorithm-notes") (fi <| List.length marking_algorithm.notes)
                in
                    ({ marking_algorithm | notes = marking_algorithm.notes ++ [blank_note] }, (SmallChange, set_tab_cmd))

            DeleteMarkingAlgorithmNote i -> ({ marking_algorithm | notes = LE.removeAt i marking_algorithm.notes }, (BigChange, Cmd.none))
                
    in
        ({ part | marking_algorithm = nalgo }, cmd)
            


part_setting_computed : SettingWatchers PartPath Part
part_setting_computed =
    let
        string = JD.decodeValue JD.string >> Result.toMaybe
    in
        [ -- check if answer to JME part is an equation
         ([S.field "answer"], \path part -> 
            if part.type_.name == "jme" then
                string >> Maybe.map (\answer -> ask_numbas_about_part path "is_equation" <|
                    JE.object
                        [ ("expression", JE.string answer)
                        , ("notation", S.getters.value (S.atField "notation" part.settings))
                        ]
                )
            else
                \_ -> Nothing
         )
        , -- find names of variables used in the correct answer
         ([S.field "answer"], \path part -> 
            if part.type_.name == "jme" then
                string >> Maybe.map (\answer -> ask_numbas_about_part path "findvars" <|
                    JE.object
                        [ ("expression", JE.string answer)
                        , ("notation", S.getters.value (S.atField "notation" part.settings))
                        , ("expandJuxtapositionsSettings", JE.object
                            [ ("singleLetterVariables", S.getters.value (S.atField "singleLetterVariables" part.settings))
                            , ("noUnknownFunctions", JE.bool <| not <| S.getters.bool (S.atField "allowUnknownFunctions" part.settings))
                            , ("implicitFunctionComposition", S.getters.value (S.atField "implicitFunctionComposition" part.settings))
                            , ("normaliseSubscripts", JE.bool True)
                            ]
                          )
                        ]
                )
            else
                \_ -> Nothing
         )
        , -- find names of variables used in the correct answer
         ([S.field "mustmatchpattern", S.field "pattern"], \path part -> 
            if part.type_.name == "jme" then
                string >> Maybe.map (\pattern -> ask_numbas_about_part path "capturedNames" <|
                    JE.object
                        [ ("pattern", JE.string pattern)
                        ]
                )
            else
                \_ -> Nothing
         )
        ]
                

variable_setting_computed : List (S.Address, VariablePath -> Variable -> JE.Value -> Maybe (Cmd Msg))
variable_setting_computed =
    [ -- work out template again after changing template type
      ([S.field "templateType"], \path variable _ ->
          Just <| ask_numbas_about_variable path "parse_templateType" <|
            JE.object
                [ ("variable", variable.settings.value)
                ]
      )
    ]

update_variable : VariableMsg -> VariablePath -> Variable -> ChangeSideEffect Variable
update_variable msg path variable = case msg of
    ChangeVariableSetting (v, at) ->
        let
            nsettings = S.setAt at v variable.settings

            nvariable = { variable | settings = nsettings }

            cmds = 
                  (variable_setting_computed
                    |> List.filterMap (\(ats, f) -> if (S.at ats S.empty).at == at then f path nvariable v else Nothing )
                   )
                |> List.filter ((/=) Cmd.none) 
        in
            (nvariable, (SmallChange, Cmd.batch cmds))

    ChangeVariableTemplateSetting (v, at) ->
        let
            cmds = []

            ncomputed = S.setAt at v variable.computed

            cfield k = S.atField k ncomputed
            cstring = cfield >> S.getters.string
            cbool = cfield >> S.getters.bool
            cvalue = cfield >> S.getters.value
            cfloat = cstring >> String.toFloat >> Maybe.withDefault 0

            cmd = ask_numbas_about_variable path "variable_template_to_definition" <|
                JE.object
                    [ ("template", cvalue "template")
                    , ("templateType", S.getters.value (S.atField "templateType" variable.settings))
                    ]
        in
            ({ variable | computed = ncomputed }, (SmallChange, cmd))

    ChangeVariableComputed command value -> case command of
        "parse_templateType" ->
            { variable | computed = S.insert "template" value variable.computed }
            |> nochange

        "variable_template_to_definition" ->
            let
                rdefinition = JD.decodeValue (JD.field "definition" JD.string) value
            in
                case rdefinition of
                    Ok definition ->
                        { variable | settings = S.insert "definition" (JE.string definition) variable.settings }
                        |> nochange
                    Err _ ->
                        variable |> nochange
                
        _ -> variable |> nochange

    PrettyPrintJSON ->
        let
            at = [S.field "template", S.field "json"]
            json = S.getters.string (S.at at variable.computed)

            pretty_json =
                json
                |> JD.decodeString JD.value
                |> Result.map (JE.encode 4)
                |> Result.withDefault json

            ncomputed = S.setAt at (JE.string pretty_json) variable.computed
        in
            { variable | computed = ncomputed } |> nochange
            

labelled_field : Ui Msg -> PropertyOptions -> PropertyWidget -> List (Html Msg)
labelled_field ui o make_input =
    [ H.label
        [ HA.for o.id
        ]
        [ H.text o.label
        ]
    , case make_input ui o of
        a::[] ->
            a

        lots -> 
            H.div
                []
                lots
    ]++(case o.help of
        Just subject -> [H.text " ", ui.helplink o.label subject]
        Nothing -> []
    )

unlabelled_field : Ui Msg -> PropertyOptions -> (List (H.Attribute Msg) -> PropertyWidget) -> List (Html Msg)
unlabelled_field ui o make_input =
    [ case make_input [Aria.label o.label] ui o of
        a::[] ->
            a

        lots -> 
            H.div
                []
                lots
    ]

boolean_property : PropertyWidget
boolean_property ui o =
    ui.boolean_input
        { checked = S.getters.bool o.settings
        , onCheck = (S.setters o.settings o.setter).bool
        , id = o.id
        }

custom_text_property : List (H.Attribute Msg) -> PropertyWidget
custom_text_property attrs _ o =
    [ H.input
        ([ HA.value <| S.getters.string o.settings
        , HE.onInput <| (S.setters o.settings o.setter).string
        , HA.id o.id
        , HA.class "monospace"
        ]++attrs)
        []
    ]

text_property : PropertyWidget
text_property = custom_text_property []

code_property : PropertyWidget
code_property _ o =
    [ H.node "code-editor"
        [ HA.value <| S.getters.string o.settings
        , HE.onInput <| (S.setters o.settings o.setter).string
        , HA.id o.id
        ]
        []
    ]

percent_property : PropertyWidget
percent_property _ o =
    [ H.input
        [ HA.value <| S.getters.string o.settings
        , HE.onInput <| (S.setters o.settings o.setter).string
        , HA.id o.id
        , HA.type_ "range"
        , HA.min "0"
        , HA.max "100"
        , HA.step "5"
        ]
        []
    , H.output
        [ HA.for o.id
        ]
        [ H.text <| (S.getters.string o.settings)++"%" ]
    ]

jme_property : { notation : String } -> PropertyWidget
jme_property eo ui o =
    (text_property ui o)
    ++ [ jme_preview
            { expression = S.getters.string o.settings
            , notation = eo.notation
            , for = o.id
            }
       ]

latex_property : PropertyWidget
latex_property ui o =
    let
        latex = S.getters.string o.settings
    in
        (text_property ui o)
        ++ [ mathjax_span <| if latex == "" then "" else "\\(" ++ latex ++ "\\)"
           ]

custom_select_property : List (H.Attribute Msg) -> List (String, String) -> PropertyWidget
custom_select_property attrs options _ o =
    let
        current_value = S.getters.string o.settings
    in
        [ H.select
            ([ HE.onInput <| (S.setters o.settings o.setter).string
            , HA.id o.id
            ]++attrs)
            (options |> List.map (\(value, label) -> 
                H.option 
                    [ HA.value value
                    , HA.selected <| value == current_value
                    ]
                    [H.text label]
            ))
        ]

select_or_custom_property : Bool -> List (Maybe String, String) -> List (H.Attribute Msg) -> PropertyWidget
select_or_custom_property use_custom options attrs _ o =
    let
        current_value = if use_custom then Nothing else Just (S.getters.string o.settings)
    in
        [ H.select
            ([ HE.onInput <| (S.setters o.settings o.setter).string
            , HA.id o.id
            ]++attrs)
            (options |> List.map (\(value, label) -> 
                H.option 
                    [ HA.value <| Maybe.withDefault "custom" value
                    , HA.selected <| value == current_value
                    ]
                    [H.text label]
            ))
        ]

select_property = custom_select_property []

content_property : PropertyWidget
content_property _ o =
    [ H.node "tinymce-editor"
        [ HA.attribute "config" "tinymceConfig"
        , HA.attribute "setup" "setupTinyMCE"
        , HE.on "input" (JD.field "detail" JD.string |> JD.map ((S.setters o.settings o.setter).string))
        , HA.id o.id
        , HA.value <| S.getters.string o.settings
        ]
        [ H.text <| S.getters.string o.settings
        ]
    ]

multi_select_property : List { value : String, label : String, description : String } -> PropertyWidget
multi_select_property choices ui o =
    let
        chosen = S.get (JD.list JD.string |> JD.map Set.fromList) Set.empty o.settings

        check choice checked = 
            let
                nchosen = (if checked then Set.insert else Set.remove) choice.value chosen
            in
                (S.setters o.settings o.setter).value (nchosen |> Set.toList |> JE.list JE.string)

    in
        [ H.ul [HA.class "list-unstyled multi-select"] 
            (choices |> List.indexedMap (\i choice ->
                let
                    id = o.id++"-choice-"++(fi i)
                in
                    H.li
                        []
                        [ H.input
                            [ HA.type_ "checkbox"
                            , HA.name choice.value
                            , HA.checked <| Set.member choice.value chosen
                            , HE.onCheck (check choice)
                            , HA.id <| id
                            ]
                            []
                        , H.text " "
                        , H.label
                            [ HA.for id
                            ]
                            [ H.text choice.label ]
                        , H.text " "
                        , ui.inline_help_block [ H.text choice.description ]
                        ]
            ))
        ]

mathjax_span : String -> Html msg
mathjax_span content = H.node "mathjax-span" [HA.attribute "text" content] []

view : Model -> Html Msg
view model = case model of
    ActiveModel active -> view_active active

    ErrorModel error -> view_error error

view_error : JD.Error -> Html Msg
view_error error =
    H.main_
        []
        [H.text <| JD.errorToString error]

part_tab_id : PartPath -> String
part_tab_id path = "part-"++(part_path_toString path)

variable_path_to_id : VariablePath -> String
variable_path_to_id (g, v) = (fi g)++"-"++(fi v)

{- an HTML element ID for a variable -}
variable_tab_id : VariablePath -> String
variable_tab_id path = "variable-" ++ (variable_path_to_id path)

function_tab_id : Int -> String
function_tab_id i = "function-" ++ (fi i)

{- Get the list of individual names for a variable. -}
variable_names : Variable -> List String
variable_names v =
    let
        computed_names = S.get (JD.maybe <| JD.list JD.string) Nothing (S.atField "names" v.computed)
        name_input = name_of v
    in
        computed_names
        |> Maybe.withDefault (name_input |> String.split "," |> List.map String.trim)

{- Names of immediate dependencies of the given variable -}
dependencies_of : Variable -> List String
dependencies_of =
    .computed
    >> S.atField "dependencies"
    >> S.get (JD.list JD.string) []

variable_is_random : Variable -> Bool
variable_is_random v =
    let
        isDeterministic = S.getters.bool <| S.atField "isDeterministic" v.computed
        isRandom = S.getters.bool <| S.atField "isRandom" v.computed
    in
        (not isDeterministic) && isRandom

name_of : { a | settings : Settings } -> String
name_of thing = S.getters.string (S.atField "name" thing.settings)

variable_link : String -> Html Msg
variable_link name = 
    H.a
        [ HA.href "#"
        , HE.onClick (ShowVariable name |> UpdateQuestion)
        , HA.class "monospace btn"
        ]
        [ H.text name ]

part_link : PartPath -> Part -> Html Msg
part_link path part =
    H.a
        [ HA.href "#"
        , HE.onClick (ShowPart path |> UpdateQuestion)
        , HA.class "btn"
        ]
        [H.text <| part_name path part]

numberNotationStyles : List {value : String, label : String, description : String}
numberNotationStyles =
    [ { value = "plain"
      , label = "English (Plain)"
      , description = "No thousands separator; dot for decimal point."
      }
    , { value = "en"
      , label = "English"
      , description = "Commas separate thousands; dot for decimal point."
      }
    , { value = "si-en"
      , label = "SI (English)"
      , description = "Spaces separate thousands; dot for decimal point."
      }
    , { value = "si-fr"
      , label = "SI (French)"
      , description = "Spaces separate thousands; comma for decimal point."
      }
    , { value = "eu"
      , label = "Continental"
      , description = "Dots separate thousands; comma for decimal point."
      }
    , { value = "plain-eu"
      , label = "Continental (Plain)"
      , description = "No thousands separator; comma for decimal point."
      }
    , { value = "ch"
      , label = "Swiss"
      , description = "Apostrophes separate thousands; dot for decimal point."
      }
    , { value = "in"
      , label = "Indian"
      , description = "Commas separate groups; rightmost group is 3 digits, other groups 2 digits; dot for decimal point."
      }
    , { value = "scientific"
      , label = "Scientific"
      , description = "A significand followed by the letter \"e\" and an integer exponent."
      }
    ]

view_active : ActiveModelRecord -> Html Msg
view_active model = 
    let
        question = model.history.current

        ui = model.ui

        qfield k = S.atField k question.settings

        parts_mode : PartsMode
        parts_mode = S.getters.string (qfield "partsMode") |> \s -> case s of
            "explore" -> ExploreMode
            _ -> AllPartsMode

        main_tabber = 
            { name = "main"
            , allow_empty = False
            , tabs = 
                [ { id = "statement"
                  , label = SimpleLabel "Statement"
                  , icon = Just "text"
                  , view = statement_tab
                  }
                , { id = "variables"
                  , label = SimpleLabel "Variables"
                  , icon = Just "list"
                  , view = variables_tab
                  }
                , { id = "parts"
                  , label = SimpleLabel "Parts"
                  , icon = Just "correct"
                  , view = parts_tab
                  }
                , { id = "advice"
                  , label = SimpleLabel "Advice"
                  , icon = Just "advice"
                  , view = advice_tab
                  }
                , { id = "extensions"
                  , label = SimpleLabel "Extensions & scripts"
                  , icon = Just "extension"
                  , view = extensions_scripts_tab
                  }
                , { id = "settings"
                  , label = SimpleLabel "Settings"
                  , icon = Just "settings"
                  , view = settings_tab
                  }
                ]
            }

        qset = ChangeQuestionSetting FinalSetting >> UpdateQuestion

        question_field : { id : String, label : String, help : Maybe String } -> PropertyWidget -> List (Html Msg)
        question_field o = labelled_field
            ui
            { id = o.id
            , label = o.label
            , help = o.help
            , settings = qfield o.id
            , setter = qset
            }

        notation_options : List (String, String)
        notation_options =
            JD.decodeValue
                (JD.at ["jme", "notations"] (JD.dict (JD.field "name" JD.string)) |> JD.map Dict.toList)
                model.numbas
            |> Result.withDefault [("standard", "Standard")]

        explore_penalty_options : List (String, String)
        explore_penalty_options =
            S.get (JD.list (JD.oneOf [JD.field "name" JD.string |> JD.map Just, JD.succeed Nothing]) |> JD.map (List.filterMap identity)) [] (S.atField "penalties" question.settings)
            |> List.map (\v -> (v,v))

        statement_tab : TabView Msg
        statement_tab =
            { contents = 
                [ H.fieldset [] <|
                    (question_field
                        { id = "statement"
                        , label = "Statement"
                        , help = Just "the question statement"
                        }
                        content_property
                    )
                ]
            , attributes = []
            }

        advice_tab : TabView Msg
        advice_tab =
            { contents = 
                [ H.fieldset [] <|
                    (question_field
                        { id = "advice"
                        , label = "Advice"
                        , help = Just "the question advice"
                        }
                        content_property
                    )
                ]
            , attributes = []
            }

        all_variables : List Variable
        all_variables = question.variable_groups |> List.concatMap (.variables)

        variable_dict : Dict String Variable
        variable_dict =
            all_variables
            |> List.map (\v -> (name_of v, v))
            |> Dict.fromList

        get_variable : String -> Maybe Variable
        get_variable name = Dict.get name variable_dict

        all_dependencies_of : Variable -> List Variable
        all_dependencies_of variable =
            let
                visit : List String -> Variable -> List Variable
                visit vpath v =
                    let
                        name = name_of v
                        deps = 
                            dependencies_of v
                            |> List.filterMap get_variable
                    in
                        if List.member name vpath then
                            []
                        else
                            deps ++ (List.concatMap (visit (name::vpath)) deps)
            in
                visit [] variable

        dependants_of : Variable -> List Variable
        dependants_of v =
            let
                name = name_of v
            in
                all_variables
                |> List.filter (dependencies_of >> List.member name)

        all_dependants_of : Variable -> List Variable
        all_dependants_of variable =
            let
                visit : List String -> Variable -> List Variable
                visit vpath v =
                    let
                        name = name_of v
                        deps = dependants_of v
                    in
                        if List.member name vpath then
                            []
                        else
                            deps ++ (List.concatMap (visit (name::vpath)) deps)
            in
                visit [] variable


        variable_tab : VariablePath -> Variable -> Tab Msg
        variable_tab path variable =
            let
                prefix_id s = "variable-"++(variable_path_to_id path)++"-" ++ s

                vfield k = S.atField k variable.settings
                cfield k = S.atField k variable.computed

                vstring = vfield >> S.getters.string
                vbool = vfield >> S.getters.bool
                vfloat = vstring >> String.toFloat >> Maybe.withDefault 0

                vset : (JE.Value, S.Address) -> Msg
                vset = ChangeVariableSetting >> UpdateVariable path >> UpdateQuestion

                tset : (JE.Value, S.Address) -> Msg
                tset = ChangeVariableTemplateSetting >> UpdateVariable path >> UpdateQuestion

                dependencies : List String
                dependencies = dependencies_of variable

                names = variable_names variable |> Set.fromList

                used_by : List String
                used_by =
                    all_variables
                    |> List.filter (dependencies_of >> Set.fromList >> Set.intersect names >> (/=) Set.empty)
                    |> List.map (variable_names >> String.join ", ")

                variable_field : { id : String, label : String, help : Maybe String } -> PropertyWidget -> List (Html Msg)
                variable_field o = labelled_field
                    ui
                    { id = prefix_id o.id
                    , label = o.label
                    , help = o.help
                    , settings = vfield o.id
                    , setter = vset
                    }

                template_field : { id : String, label : String, help : Maybe String } -> PropertyWidget -> List (Html Msg)
                template_field o = labelled_field
                    ui
                    { id = prefix_id <| "-template-"++o.id
                    , label = o.label
                    , help = o.help
                    , settings = S.at [S.field "template", S.field o.id] variable.computed
                    , setter = tset
                    }

                inline_text_field : { id : String, label : String, help : Maybe String } -> List (Html Msg)
                inline_text_field o = 
                    custom_text_property
                        [ Aria.label o.label ]
                        ui
                        { id = o.id
                        , label = o.label
                        , help = o.help
                        , settings = S.at [S.field "template", S.field o.id] variable.computed
                        , setter = tset
                        }


                jme_template =
                    { id = "anything"
                    , label = "JME code"
                    , view = List.concat
                        [ template_field
                            { id = "code"
                            , label = "Value"
                            , help = Nothing
                            }
                            code_property
                        , [ui.labelled_helplink "jme-functions" "JME function reference"]
                        ]
                    }

                builtin_templateTypes =
                    jme_template ::
                    [ { id = "range"
                      , label = "Range of numbers"
                      , view = 
                            [ H.p [HA.class "inline-fields"] <| List.concat
                                [ [H.text "Numbers between "]
                                , inline_text_field
                                    { id = "min"
                                    , label = "Minimum"
                                    , help = Nothing
                                    }
                                , [H.text " and "]
                                , inline_text_field
                                    { id = "max"
                                    , label = "Maximum"
                                    , help = Nothing
                                    }
                                , [H.text " (inclusive) with step size "]
                                , inline_text_field
                                    { id = "step"
                                    , label = "Step size"
                                    , help = Nothing
                                    }
                                ]
                            ]
                      }
                    , { id = "randrange"
                      , label = "Random number from a range"
                      , view = 
                            [ H.p [HA.class "inline-fields"] <| List.concat
                                [ [H.text "A random number between "]
                                , inline_text_field
                                    { id = "min"
                                    , label = "Minimum"
                                    , help = Nothing
                                    }
                                , [H.text " and "]
                                , inline_text_field
                                    { id = "max"
                                    , label = "Maximum"
                                    , help = Nothing
                                    }
                                , [H.text " (inclusive) with step size "]
                                , inline_text_field
                                    { id = "step"
                                    , label = "Step size"
                                    , help = Nothing
                                    }
                                ]
                            ]
                      }
                    , { id = "string"
                      , label = "Short text string"
                      , view = List.concat
                        [ template_field
                            { id = "string"
                            , label = "Value"
                            , help = Nothing
                            }
                            text_property
                        , [ui.help_block [H.text "(text string)"]]
                        , template_field
                            { id = "isTemplate"
                            , label = "Is this a template?"
                            , help = Nothing
                            }
                            boolean_property
                        ]
                      }
                    , { id = "long plain string"
                      , label = "Long plain text string"
                      , view = List.concat
                        [ template_field
                            { id = "string"
                            , label = "Value"
                            , help = Nothing
                            }
                            code_property
                        , [ui.help_block [H.text "(text string)"]]
                        , template_field
                            { id = "isTemplate"
                            , label = "Is this a template?"
                            , help = Nothing
                            }
                            boolean_property
                        ]
                      }
                    , { id = "long string"
                      , label = "Formatted text"
                      , view = List.concat
                        [ template_field
                            { id = "string"
                            , label = "Value"
                            , help = Nothing
                            }
                            content_property
                        , [ui.help_block [H.text "(text string)"]]
                        , template_field
                            { id = "isTemplate"
                            , label = "Is this a template?"
                            , help = Nothing
                            }
                            boolean_property
                        ]
                      }
                    , { id = "mathematical expression"
                      , label = "Abstract mathematical expression"
                      , view = List.concat
                        [ template_field
                            { id = "expression"
                            , label = "Expression"
                            , help = Nothing
                            }
                            code_property
                        ]
                      }
                    , { id = "list of numbers"
                      , label = "List of numbers"
                      , view =
                          let
                              stored_values = S.get (JD.list JD.string) [] (S.at [S.field "template", S.field "values"] variable.computed)

                              last_thing = stored_values |> List.reverse |> List.head |> Maybe.withDefault ""

                              values = stored_values ++ (if last_thing == "" then [] else [""])
                          in
                            List.concat
                                [ [H.label [] [H.text "Value"]]
                                , values |> List.indexedMap (\i v ->
                                    custom_text_property
                                        [ Aria.label <| "Number "++(fi i) ]
                                        ui
                                        { id = "value-"++(fi i)
                                        , label = "Number "++(fi i)
                                        , help = Nothing
                                        , settings = S.at [S.field "template", S.field "values", S.index i] variable.computed
                                        , setter = tset
                                        }
                                  )
                                  |> List.concat
                                ] 
                        }
                    , { id = "list of strings"
                      , label = "List of short text strings"
                      , view =
                          let
                              stored_values = 
                                  S.get (JD.list JD.string) [] (S.at [S.field "template", S.field "values"] variable.computed)
                                  |> List.reverse
                                  |> LE.dropWhile ((==) "")
                                  |> List.reverse

                              values = stored_values ++ [""]
                          in
                            List.concat
                                [ [H.label [] [H.text "Value"]]
                                , values |> List.indexedMap (\i v ->
                                    custom_text_property
                                        [ Aria.label <| "Number "++(fi i) ]
                                        ui
                                        { id = "value-"++(fi i)
                                        , label = "Number "++(fi i)
                                        , help = Nothing
                                        , settings = S.at [S.field "template", S.field "values", S.index i] variable.computed
                                        , setter = tset
                                        }
                                  )
                                  |> List.concat
                                ] 
                        }
                    , { id = "json"
                      , label = "JSON data"
                      , view = List.concat
                            [ template_field
                                { id = "json"
                                , label = "Value"
                                , help = Nothing
                                }
                                code_property
                            , [ ui.button ""
                                [ HE.onClick <| UpdateQuestion <| UpdateVariable path <| PrettyPrintJSON
                                ]
                                [ H.text "Clean up formatting" ]
                              ]
                            ]
                      }
                    ]
                    

                templateTypes = builtin_templateTypes

                templateType = 
                    LE.find (.id >> (==) (vstring "templateType")) templateTypes
                    |> Maybe.withDefault jme_template

                mvalue = variable.value

                variable_name = vstring "name"

                variable_label = if variable_name == "" then "Unnamed" else variable_name

                vview =
                    { contents = List.concat
                        [ [H.fieldset [ HA.class "vertical" ] <| List.concat
                            [ [ ui.button "danger"
                                [ HE.onClick <| UpdateQuestion <| DeleteVariable path
                                ]
                                [ ui.icon "remove"
                                , H.text "Delete this variable"
                                ]
                              ]
                            , variable_field
                                { id = "name"
                                , label = "Name"
                                , help = Nothing
                                }
                                text_property
                            , variable_field
                                { id = "templateType"
                                , label = "Data type"
                                , help = Just "data type"
                                }
                                (select_property (templateTypes |> List.map (\t -> (t.id, t.label))))
                            , templateType.view
                            , variable_field
                                { id = "description"
                                , label = "Description"
                                , help = Nothing
                                }
                                content_property
                            , variable_field
                                { id = "can_override"
                                , label = "Can an exam override the value of this variable?"
                                , help = Just "exams overriding variable values"
                                }
                                boolean_property
                          ]
                        ]
                        , case mvalue of
                                Just (Ok value) -> 
                                    [H.section
                                        [ HA.class "generated-value well" ]
                                        [ H.h3 [] 
                                            [ H.text "Generated value"
                                            , H.text " "
                                            , H.small [ HA.class "datatype" ] <| case variable_type variable of
                                                Just type_ -> [H.text <| type_]
                                                Nothing -> [H.text "Unknown type"]
                                            ]
                                        , Ui.jme_value { value = value, abbreviate = False }
                                        ]
                                    ]

                                Just (Err err) -> 
                                    [ ui.alert "warning"
                                        [ H.h4 [] [H.text "Error"]
                                        , Ui.raw_html_string err
                                        ]
                                    ]

                                Nothing -> []
                        , case dependencies of
                                [] -> []
                                _ -> [H.section
                                        [ HA.class "dependencies" ]
                                        [ H.h3 [] 
                                            [ ui.icon "from"
                                            , H.text "Depends on"
                                            ]
                                        , H.ul
                                            [ HA.class "list-inline" ]
                                            (dependencies |> List.map (\d -> 
                                                H.li [] 
                                                    [ variable_link d
                                                    ]
                                            ))
                                        ]
                                     ]
                        , case used_by of
                                [] -> []
                                _ -> [H.section
                                        [ HA.class "used-by" ]
                                        [ H.h3 [] 
                                            [ H.text "Used by"
                                            , ui.icon "to"
                                            ]
                                        , H.ul
                                            [ HA.class "list-inline" ]
                                            (used_by |> List.map (\d -> 
                                                H.li [] 
                                                    [ H.a
                                                        [ HA.href "#"
                                                        , HE.onClick (ShowVariable d |> UpdateQuestion)
                                                        , HA.class "monospace btn info"
                                                        ]
                                                        [ H.text d ]
                                                    ]
                                            ))
                                        ]
                                     ]
                        ]
                    , attributes = []
                    }
            in
                { id = variable_tab_id path
                , label = SimpleLabel <| variable_label
                , icon = Nothing
                , view = vview
                }

        grouped_variable_tabs : List (VariableGroup, List (Int, (Variable, Tab Msg)))
        grouped_variable_tabs = 
            let
                groups_with_tabs : List (VariableGroup, List (Variable, Tab Msg))
                groups_with_tabs =
                    question.variable_groups
                    |> List.indexedMap (\gi group ->
                        (group
                        , group.variables |> List.indexedMap (\vi variable ->
                            (variable, variable_tab (gi,vi) variable)
                          )
                        )
                       )
            in
                nested_count groups_with_tabs

        variables_tabber =
            { name = "variables"
            , allow_empty = True
            , tabs = grouped_variable_tabs |> List.map second |> List.concat |> List.map (second >> second)
            }

        variables_tab : TabView Msg
        variables_tab =
            { contents =
                [ H.nav
                    [ HA.id "variables" ]
                    [ H.h2 [] [ H.text "Variables" ]
                    , H.menu [ HA.class "list-unstyled" ] <| List.concat
                        [ (grouped_variable_tabs |> List.indexedMap (\gi (group, variable_tabs) ->
                            H.li [ HA.class "variable-group" ]
                                [ H.header []
                                    [ H.h3 [] [H.text group.name]
                                    ]
                                , H.table []
                                    [ H.thead [] [H.tr []
                                        [ H.th [] [Ui.sr_only "Properties"]
                                        , H.th [] [H.text "Name"]
                                        , H.th [] [H.text "Type"]
                                        , H.th [] [H.text "Generated Value"]
                                        ]
                                      ]
                                    , H.tbody [] <| (variable_tabs |> List.indexedMap (\vi (tab_index, (variable, vtab)) ->
                                        let
                                            vfield k = S.atField k variable.settings
                                            cfield k = S.atField k variable.computed

                                            path = (gi, vi)

                                            mtype = variable_type variable
                                        in
                                            H.tr
                                                [ HE.onClick <| UpdateTab <| Tabber.SetTab "variables" <| variable_tab_id path ]
                                                [ H.td [ HA.class "properties"]
                                                    [ if variable_is_random variable then ui.icon "random" else H.text "" ]
                                                    -- TODO lock value
                                                , H.td [ HA.class "name" ] 
                                                    [ tab_button ui UpdateTab model.tab_state variables_tabber vtab tab_index
                                                    ]
                                                , H.td [HA.class "type"] (case mtype of 
                                                    Just type_ -> [H.text <| type_]
                                                    Nothing -> []
                                                  )
                                                , H.td [HA.class "value"] (case variable.value of
                                                    Just (Ok value) -> [Ui.jme_value { value = value, abbreviate = True }]
                                                    Just (Err err) -> [H.span [HA.class "truncate warning"] [Ui.raw_html_string err]]
                                                    Nothing -> []
                                                  )
                                                ]
                                      ))
                                    ]
                                , ui.button ""
                                    [ HE.onClick (UpdateQuestion <| AddVariable gi )
                                    ]
                                    [ ui.icon "add"
                                    , H.text <| if group.variables == [] then "Add a variable" else "Add another variable"
                                    ]
                                ]

                          ))
                        ]
                    , ui.button "primary"
                        [ HE.onClick (RegenerateVariables |> UpdateQuestion)
                        ]
                        [ ui.icon "regenerate"
                        , H.text "Regenerate values"
                        ]
                    , ui.button ""
                        [ HE.onClick (AddVariableGroup |> UpdateQuestion)
                        ]
                        [ ui.icon "add"
                        , H.text "New variable group"
                        ]
                    ]
                , view_tabpanel variables_tabber
                ]
            , attributes = [ HA.class "tabbed-sidebar"]
            }

        settings_tab =
            { contents =
                [ H.fieldset [] <| List.concat
                    [question_field
                        { id = "name"
                        , label = "Name"
                        , help = Nothing
                        }
                        text_property
                    , question_field
                        { id = "partsMode"
                        , label = "Parts mode"
                        , help = Nothing
                        }
                        (select_property 
                            [("all", "Sequential")
                            ,("explore", "Explore")
                            ]
                        )
                    ]
                ]
            , attributes = []
            }

        all_parts : List (PartPath, Part)
        all_parts = unwrap_part_container question.parts

        (add_part_path, add_part_kind) = model.adding_part |> Maybe.withDefault ([], TopPart)

        top_parts : List (PartPath, Part)
        top_parts = case question.parts of
            PartContainer parts -> 
                parts.parts
                |> List.indexedMap (\i p -> ([(TopPart, i)], p))

        next_parts_from : Part -> List (PartPath, Part)
        next_parts_from pp = 
            S.get (JD.list (JD.field "otherPart" JD.int)) [] (S.atField "nextParts" pp.settings)
            |> List.filterMap (\i -> LE.getAt i top_parts)

        reachable_parts : List PartPath
        reachable_parts = 
            let
                visit : List PartPath -> List (PartPath, Part) -> List PartPath
                visit seen queue = case queue of
                    [] -> seen
                    (ppath, pp)::rest -> 
                        if List.member ppath seen then
                            visit seen rest
                        else
                            visit (ppath::seen) (rest++(next_parts_from pp))
            in
                top_parts
                |> List.take 1
                |> visit []

        parts_tabber =
            { name = "parts"
            , allow_empty = True
            , tabs = all_parts |> List.map part_tab
            }

        parts_tab =
            { contents = 
                [ H.nav
                    []
                    [ H.h2 [] [ H.text "Parts" ]
                    , view_tablist parts_tabber [HA.class "vertical"]
                    , ui.button "primary"
                        [ HE.onClick <| StartAddingPart [] TopPart
                        , HA.attribute "commandfor" "add-part"
                        , HA.attribute "command" "show-modal"
                        ]
                        [ ui.icon "add"
                        , H.text "Add a part"
                        ]
                    , add_part_modal
                    ]
                , view_tabpanel parts_tabber
                ]
            , attributes = [HA.class "tabbed-sidebar"]
            }

        add_part_modal : Html Msg
        add_part_modal =
            let
                kind_label = child_part_label add_part_kind
            in
                H.node "dialog"
                    (List.concat
                        [ [ HA.id "add-part"
                          , HA.attribute "closedby" "any"
                          ]
                        , case model.adding_part of
                            Just _ -> [HA.attribute "open" ""]
                            Nothing -> []
                        ]
                    )
                    [ H.header
                        []
                        [ H.h2 
                            [] 
                            [ icon "add"
                            , H.text <| case add_part_kind of
                                TopPart -> "Add a part"
                                Gap -> "Add a gap"
                                Step -> "Add a step"
                                Alternative -> "Add an alternative"
                            ]
                        , ui.button "xs"
                            [ HA.attribute "commandfor" "add-part"
                            , HA.attribute "command" "close"
                            ]
                            [ ui.icon "close"
                            , H.text "Cancel"
                            ]
                        ]
                    , ui.help_block [H.text <| "Choose a type for this new "++kind_label++"."]
                    , H.form
                        []
                        [ H.ul
                            [ HA.class "list-unstyled" ]
                            (part_types |> List.map (\t ->
                                H.li
                                    []
                                    [ ui.button "primary"
                                        [ HE.onClick (UpdateQuestion <| AddPart add_part_path add_part_kind (new_part model.default_settings t (JE.object []) empty_part_container))
                                        , HA.attribute "commandfor" "add-part"
                                        , HA.attribute "command" "close"
                                        ]
                                        [ icon "add"
                                        , H.text t.nice_name
                                        ]
                                    , ui.help_block 
                                        [ ui.helplink t.help_url t.nice_name
                                        , H.text t.description
                                        ]
                                        |> H.map (\_ -> NoOp)
                                    ]
                            ))
                        ]
                    ]

        part_tab : (PartPath, Part) -> Tab Msg
        part_tab (path, part) =
            let
                path_string = part_path_toString path

                prefix_id : String -> String
                prefix_id id = path_string++"-"++id

                kind = bottom_index path |> Maybe.map first |> Maybe.withDefault TopPart

                is_gap = kind == Gap

                gaps : List Part
                gaps = part_getter Gap part.children

                is_step = kind == Step

                is_alternative = kind == Alternative

                is_top_level = kind == TopPart

                pmsg = UpdatePart path >> UpdateQuestion

                pset : (JE.Value, S.Address) -> Msg
                pset = ChangePartSetting FinalSetting >> pmsg

                term_to_url = String.replace " " "-"

                part_help : String -> String
                part_help term = "question/parts/reference.html#term-"++(term_to_url term)

                part_type_help : String -> String
                part_type_help term = 
                    let
                        filename = Maybe.withDefault part.type_.name <| Dict.get part.type_.name <| Dict.fromList
                            [ ("jme","mathematical-expression")
                            , ("patternmatch", "match-text-pattern")
                            , ("1_n_2", "multiple-choice")
                            , ("m_n_2", "multiple-choice")
                            , ("m_n_x", "multiple-choice")
                            ]
                    in
                        "question/parts/"++filename++".html#term-"++(term_to_url term)

                part_field : { id : String, label : String, help : Maybe String } -> PropertyWidget -> List (Html Msg)
                part_field o = labelled_field
                    ui
                    { id = prefix_id o.id
                    , label = o.label
                    , help = o.help
                    , settings = pfield o.id
                    , setter = pset
                    }

                tabs : List (Tabber.Tab Msg)
                tabs =  
                    [ (prompt_tab, not is_gap && not is_alternative)
                    , (alternative_feedback_tab, is_alternative)
                    , (marking_settings_tab, part.type_.has_marking_settings)
                    ]
                    ++ (type_tabs |> List.map (\p -> (p, True)))
                    ++ 
                    [ (marking_algorithm_tab, part.type_.has_marks)
                    , (testing_tab, part.type_.has_marks)
                    , (scripts_tab, True)
                        , (adaptive_marking_tab, not is_alternative && parts_mode == AllPartsMode)
                        , (next_parts_tab, is_top_level && parts_mode == ExploreMode)
                    ]
                    |> List.filter second |> List.map first

                choices_tab =
                    let
                        choices = S.get (JD.list JD.string) [] (pfield "choices")
                        matrix = S.get (JD.list JD.string) [] (pfield "matrix")
                        distractors = S.get (JD.list JD.string) [] (pfield "distractors")

                        customChoices = fieldIsString "choices"

                        set_choices = S.setList pset JE.string (pfield "choices")

                        settings_value = S.getters.value part.settings

                        remove_choice i =
                            JD.decodeValue (JD.dict JD.value) settings_value
                            |> Result.map
                                (   Dict.insert "choices" (JE.list JE.string <| LE.removeAt i choices)
                                 >> Dict.insert "matrix" (JE.list JE.string <| LE.removeAt i matrix)
                                 >> Dict.insert "distractors" (JE.list JE.string <| LE.removeAt i distractors)
                                 >> JE.dict identity identity
                                )
                            |> Result.withDefault settings_value
                            |> \s -> pset (s, [])

                        markingMethod = pstring "markingMethod"

                        needsMaxMarks = markingMethod == "score per matched cell" || markingMethod == "all-or-nothing"
                    in
                        { id = "choices"
                          , label = SimpleLabel "Choices"
                          , icon = Just "list"
                          , view =
                              { contents = List.concat
                                  [ [H.fieldset [] <| List.concat
                                    [ case part.type_.name of
                                        "m_n_2" ->
                                            (part_field
                                                { id = "markingMethod"
                                                , label = "Marking method"
                                                , help = Just "marking method"
                                                }
                                                (select_property
                                                    [ ("sum ticked cells", "Sum ticked cells")
                                                    , ("score per matched cell", "Score per matched cell")
                                                    , ("all-or-nothing", "All-or-nothing")
                                                    ]
                                                )
                                            )++(case markingMethod of
                                                "sum ticked cells" ->
                                                    [ui.help_block [H.text "For each choice, specify the number of marks to add or subtract when the student picks it."]]
                                                "score per matched cell" ->
                                                    [ui.help_block [H.text "For each choice, write 1 in the marks field if the student should tick it, or 0 if they should leave it unticked."]]
                                                _ -> []
                                            )++(visibleIf (needsMaxMarks && pfloat "maxMarks" == 0) <|
                                                [ ui.alert "warning"
                                                    [ H.text "You must set a "
                                                    , H.map UpdateTab <| Tabber.tab_link part_tabber_name "marking-settings" "maximum number of marks"
                                                    , H.text " in order to use this marking method."
                                                    ]
                                                ]
                                            )

                                        _ -> []

                                    , toggleExpressionField
                                        { field = "choices"
                                        , default = JE.list JE.string []
                                        , id = "customChoices"
                                        , label = "Variable list of choices?"
                                        , help = Just "variable list of choices"
                                        }
                                    , visibleIf (customChoices) <|
                                        part_field
                                            { id = "choices"
                                            , label = "List of choices"
                                            , help = Just "list of choices"
                                            }
                                            text_property
                                    , part_field
                                        { id = "shuffleChoices"
                                        , label = "Shuffle order of choices?"
                                        , help = Just "shuffling choices"
                                        }
                                        boolean_property
                                    ]]
                                  , visibleIf (not <| customChoices) <| List.concat
                                        [ [H.h4 [] [H.text "Choices"]]
                                        , (choices |> List.indexedMap
                                            (\i choice ->
                                                H.fieldset
                                                    [ HA.class "choice" ]
                                                    (List.concat <|
                                                        [ [ H.legend [] [H.text <| "Choice "++(fi i)] ]
                                                        , labelled_field
                                                            ui
                                                            { id = "choice-"++(fi i)
                                                            , label = "Content"
                                                            , help = Nothing
                                                            , settings = S.at [S.field "choices", S.index i] part.settings
                                                            , setter = pset
                                                            }
                                                            content_property -- TODO : smaller
                                                        , [ ui.button "danger"
                                                                [ HE.onClick <| remove_choice i
                                                                ]
                                                                [ ui.icon "remove"
                                                                , H.text "Delete this choice"
                                                                ]
                                                          ]
                                                        , visibleIf (not customMCQMarking) <| labelled_field
                                                            ui
                                                            { id = "choice-"++(fi i)++"-marks"
                                                            , label = "Marks"
                                                            , help = Nothing
                                                            , settings = S.at [S.field "matrix", S.index i] part.settings
                                                            , setter = pset
                                                            }
                                                            text_property
                                                        , labelled_field
                                                            ui
                                                            { id = "choice-"++(fi i)++"-distractor"
                                                            , label = "Distractor message"
                                                            , help = Nothing
                                                            , settings = S.at [S.field "distractors", S.index i] part.settings
                                                            , setter = pset
                                                            }
                                                            text_property
                                                        ]
                                                    )
                                            )
                                          )
                                        ]
                                        ++[ ui.button "primary"
                                            [ HE.onClick <| set_choices <| choices++[""]
                                            ]
                                            [ ui.icon "add"
                                            , H.text "Add a choice"
                                            ]
                                        ]
                                  ]
                              , attributes = []
                              }
                        }

                type_tabs : List (Tabber.Tab Msg)
                type_tabs = case part.type_.name of
                    "jme" ->
                        let
                            notation = pstring "notation"

                            notation_name = 
                                notation_options
                                |> List.filter (first >> (==) notation)
                                |> List.head
                                |> Maybe.map second
                                |> Maybe.withDefault notation

                            mustMatchPattern = S.getters.string (S.at [S.field "mustmatchpattern", S.field "pattern"] part.settings)

                            capturedNames = S.get (JD.list JD.string) [] (cfield "capturedNames")

                            capturedNameOptions =
                                   ("", "Whole expression")
                                :: (capturedNames |> List.map (\n -> (n,n)))
                        in
                        [ { id = "restrictions"
                          , label = SimpleLabel "Restrictions"
                          , icon = Just "restriction"
                          , view =
                              { contents = 
                                  [ H.fieldset [] <| List.concat
                                    [ [ H.legend [] [H.text "Pattern restriction"] ]
                                    , labelled_field
                                        ui
                                        { id = "mustMatchPattern"
                                        , label = "Pattern student's answer must match"
                                        , help = Just "pattern restriction"
                                        , settings = S.at [S.field "mustmatchpattern", S.field "pattern"] part.settings
                                        , setter = pset
                                        }
                                        (\_ o -> List.concat
                                            [ jme_property { notation = "pattern_matching" } ui o
                                            , visibleIf (notation /= "standard")
                                                [ ui.alert "warning"
                                                    [ H.text "Write this pattern in the standard notation, not "
                                                    , H.em [] [H.text notation_name]
                                                    , H.text "."
                                                    ]
                                                ]
                                            ]
                                        )
                                    , if mustMatchPattern == "" then [] else List.concat <|
                                        [ labelled_field
                                            ui
                                            { id = "mustmatchpattern-nameToCompare"
                                            , label = "Part of expression to mark"
                                            , help = Just "part of expression to mark"
                                            , settings = S.at [S.field "mustmatchpattern", S.field "nameToCompare"] part.settings
                                            , setter = pset
                                            }
                                            (select_property capturedNameOptions)
                                        , labelled_field
                                            ui
                                            { id = "mustmatchpattern-partialCredit"
                                            , label = "Partial credit for not matching pattern"
                                            , help = Just "partial credit for not matching pattern"
                                            , settings = S.at [S.field "mustmatchpattern", S.field "partialCredit"] part.settings
                                            , setter = pset
                                            }
                                            percent_property
                                        , labelled_field
                                            ui
                                            { id = "mustmatchpattern-warningTime"
                                            , label = "When to warn the student if their answer does not match the pattern"
                                            , help = Just "pattern warning time"
                                            , settings = S.at [S.field "mustmatchpattern", S.field "warningTime"] part.settings
                                            , setter = pset
                                            }
                                            (select_property
                                                [ ("submission", "After submitting")
                                                , ("input", "While entering their answer")
                                                , ("prevent", "Prevent submission")
                                                ]
                                            )
                                        , labelled_field
                                            ui
                                            { id = "mustmatchpattern-message"
                                            , label = "Warning message"
                                            , help = Nothing
                                            , settings = S.at [S.field "mustmatchpattern", S.field "message"] part.settings
                                            , setter = pset
                                            }
                                            content_property
                                        ]
                                            
                                    ]
                                  , H.fieldset [] <| List.concat
                                    [ [ H.legend [] [H.text "Variables"] ]
                                    , part_field
                                        { id = "checkVariableNames"
                                        , label = "Warn if student uses an unexpected variable name?"
                                        , help = Just "unexpected variable names"
                                        }
                                        boolean_property
                                    , part_field
                                        { id = "singleLetterVariables"
                                        , label = "Force single letter variable names?"
                                        , help = Just "single letter variable names"
                                        }
                                        boolean_property
                                    , part_field
                                        { id = "allowUnknownFunctions"
                                        , label = "Allow unknown function names?"
                                        , help = Just "unknown function names"
                                        }
                                        boolean_property
                                    , part_field
                                        { id = "implicitFunctionComposition"
                                        , label = "Use implicit function composition?"
                                        , help = Just "implicit function composition"
                                        }
                                        boolean_property
                                    ]
                                  ]
                              , attributes = []
                              }
                          }
                        , { id = "checking-accuracy"
                          , label = SimpleLabel "Checking accuracy"
                          , icon = Just "scale"
                          , view =
                              { attributes = []
                              , contents = 
                                  [ H.fieldset [] <| List.concat
                                    [ [ H.legend [] [H.text "Checking accuracy"]
                                      , ui.help_block 
                                         [ ui.helplink "Checking accuracy" "checking accuracy"
                                         , H.text "Define the range of points over which the student's answer will be compared with the correct answer, and the method used to compare them."
                                         ]
                                      ]
                                    , part_field
                                        { id = "checkingType"
                                        , label = "Checking type"
                                        , help = Just "checking type"
                                        }
                                        (select_property 
                                            [ ("absdiff", "Absolute difference")
                                            , ("reldiff", "Relative difference")
                                            , ("dp", "Decimal points")
                                            , ("sigfig", "Significant figures")
                                            ]
                                        )
                                    , part_field
                                        { id = "checkingAccuracy"
                                        , label = "Checking accuracy"
                                        , help = Just "checking accuracy"
                                        }
                                        text_property
                                    , part_field
                                        { id = "vsetRangePoints"
                                        , label = "Points to check"
                                        , help = Just "checked points"
                                        }
                                        text_property
                                    , part_field
                                        { id = "failureRate"
                                        , label = "Maximum no. of failures"
                                        , help = Just "maximum number of failures"
                                        }
                                        text_property
                                    , labelled_field
                                        ui
                                        { id = "vsetRangeStart"
                                        , label = "Checking range start"
                                        , help = Just "checking range start"
                                        , settings = S.at [S.field "vsetRange", S.index 0] part.settings
                                        , setter = pset
                                        }
                                        text_property
                                    , labelled_field
                                        ui
                                        { id = "vsetRangeEnd"
                                        , label = "Checking range end"
                                        , help = Just "checking range end"
                                        , settings = S.at [S.field "vsetRange", S.index 1] part.settings
                                        , setter = pset
                                        }
                                        text_property
                                    ]
                                  , H.fieldset [] <| List.concat
                                    [ [ H.legend [] [H.text "Variable value generators"]
                                      , ui.help_block 
                                         [ ui.helplink "variable-value-generators" "variable value generators"
                                         , H.text "Give expressions which produce values for each of the variables in the expected answer. Leave blank to pick a random value from the range defined above, following the inferred type of the variable."
                                         ]
                                      ]
                                    , let
                                        names = S.get (JD.list (JD.map2 pair (JD.field "name" JD.string) (JD.maybe <| JD.field "inferredType" JD.string))) [] (cfield "findvars")
                                      in
                                        names
                                        |> List.concatMap (\(name, minferredType) ->
                                            List.concat
                                                [ labelled_field
                                                    ui
                                                    { id = "value-generator-"++name
                                                    , label = name
                                                    , help = Nothing
                                                    , settings = S.at [S.field "valuegenerators", S.indexWhereName name, S.field "value"] part.settings
                                                    , setter = pset
                                                    }
                                                    (\_ o -> 
                                                        (text_property ui o)
                                                        ++ case minferredType of
                                                            Nothing -> []
                                                            Just inferredType -> [ui.help_block [ H.text <| "(this might be a " ++ inferredType ++ ")" ]]
                                                    )
                                                ]
                                           )
                                    ]
                                  ]
                              }
                          }
                        ]

                    "1_n_2" ->
                        [ choices_tab
                        ]

                    "m_n_2" ->
                        [ choices_tab
                        ]

                    "m_n_x" ->
                        let
                            displayType = pstring "displayType"

                            choices = S.get (JD.list JD.string) [] (pfield "choices")
                            answers = S.get (JD.list JD.string) [] (pfield "answers")
                            matrix = S.get (JD.list (JD.list JD.string)) [] (pfield "matrix")

                            set_choices = psetList JE.string (pfield "choices")
                            set_answers = psetList JE.string (pfield "answers")

                            settings_value = S.getters.value part.settings

                            markingMethod = pstring "markingMethod"

                            remove_choice i =
                                JD.decodeValue (JD.dict JD.value) settings_value
                                |> Result.map
                                    (   Dict.insert "choices" (JE.list JE.string <| LE.removeAt i choices)
                                     >> Dict.insert "matrix" (JE.list (JE.list JE.string) <| LE.removeAt i matrix)
                                     >> JE.dict identity identity
                                    )
                                |> Result.withDefault settings_value
                                |> \s -> pset (s, [])

                            remove_answer i =
                                JD.decodeValue (JD.dict JD.value) settings_value
                                |> Result.map
                                    (   Dict.insert "choices" (JE.list JE.string <| LE.removeAt i choices)
                                     >> Dict.insert "matrix" (JE.list (JE.list JE.string) <| List.map (LE.removeAt i) matrix)
                                     >> JE.dict identity identity
                                    )
                                |> Result.withDefault settings_value
                                |> \s -> pset (s, [])

                            needsMaxMarks = markingMethod == "score per matched cell" || markingMethod == "all-or-nothing"

                            customChoices = fieldIsString "choices"
                            customAnswers = fieldIsString "answers"

                            hasChoices = choices /= []
                            hasAnswers = answers /= []

                            showMarkingMatrix = hasChoices && hasAnswers && not customMCQMarking
                        in
                        [ { id = "choices"
                          , label = SimpleLabel "Choices"
                          , icon = Just "list"
                          , view =
                              { contents = List.concat
                                  [ [H.fieldset [] <| List.concat
                                    [ toggleExpressionField
                                        { field = "choices"
                                        , default = JE.list JE.string []
                                        , id = "customChoices"
                                        , label = "Variable list of choices?"
                                        , help = Just "variable list of choices"
                                        }
                                    , visibleIf customChoices <|
                                        part_field
                                            { id = "choices"
                                            , label = "List of choices"
                                            , help = Just "list of choices"
                                            }
                                            text_property
                                    , part_field
                                        { id = "shuffleChoices"
                                        , label = "Shuffle order of choices?"
                                        , help = Just "shuffling choices"
                                        }
                                        boolean_property
                                    , part_field
                                        { id = "choicesHeader"
                                        , label = "Text before choices"
                                        , help = Just "text before choices"
                                        }
                                        text_property
                                    ]]
                                  , visibleIf (not customChoices) <| List.concat
                                        [ [H.h4 [] [H.text "Choices"]]
                                        , (choices |> List.indexedMap
                                            (\i choice ->
                                                H.fieldset
                                                    [ HA.class "choice" ]
                                                    (List.concat <|
                                                        [ [ H.legend [] [H.text <| "Choice "++(fi i)] ]
                                                        , labelled_field
                                                            ui
                                                            { id = "choice-"++(fi i)
                                                            , label = "Content"
                                                            , help = Nothing
                                                            , settings = S.at [S.field "choices", S.index i] part.settings
                                                            , setter = pset
                                                            }
                                                            content_property -- TODO : smaller
                                                        , [ ui.button "danger"
                                                            [ HE.onClick <| remove_choice i
                                                            ]
                                                            [ ui.icon "remove"
                                                            , H.text "Delete this choice"
                                                            ]
                                                          ]
                                                        ]
                                                    )
                                            )
                                          )
                                        ]
                                        ++[ ui.button "primary"
                                            [ HE.onClick <| set_choices <| choices++[""]
                                            ]
                                            [ ui.icon "add"
                                            , H.text "Add a choice"
                                            ]
                                        ]
                                  ]
                              , attributes = []
                              }
                          }
                        , { id = "answers"
                          , label = SimpleLabel "Answers"
                          , icon = Just "list"
                          , view =
                              { contents = List.concat
                                  [ [H.fieldset [] <| List.concat
                                    [ toggleExpressionField
                                        { field = "answers"
                                        , default = JE.list JE.string []
                                        , id = "customAnswers"
                                        , label = "Variable list of answers?"
                                        , help = Just "variable list of answers"
                                        }
                                    , visibleIf customAnswers <|
                                        part_field
                                            { id = "answers"
                                            , label = "List of answers"
                                            , help = Just "list of answers"
                                            }
                                            text_property
                                    , part_field
                                        { id = "shuffleAnswers"
                                        , label = "Shuffle order of answers?"
                                        , help = Just "shuffling answers"
                                        }
                                        boolean_property
                                    , part_field
                                        { id = "answersHeader"
                                        , label = "Text above answers"
                                        , help = Just "text above answers"
                                        }
                                        text_property
                                    ]]
                                  , visibleIf (not customAnswers) <| List.concat
                                        [ [H.h4 [] [H.text "Answers"]]
                                        , (answers |> List.indexedMap
                                            (\i _ ->
                                                H.fieldset
                                                    [ HA.class "answer" ]
                                                    (List.concat <|
                                                        [ [ H.legend [] [H.text <| "Answer "++(fi i)] ]
                                                        , labelled_field
                                                            ui
                                                            { id = "answer-"++(fi i)
                                                            , label = "Content"
                                                            , help = Nothing
                                                            , settings = S.at [S.field "answers", S.index i] part.settings
                                                            , setter = pset
                                                            }
                                                            content_property -- TODO : smaller
                                                        , [ ui.button "danger"
                                                                [ HE.onClick <| remove_answer i
                                                                ]
                                                                [ ui.icon "remove"
                                                                , H.text "Delete this answer"
                                                                ]
                                                          ]
                                                        ]
                                                    )
                                            )
                                          )
                                        ]
                                        ++[ ui.button "primary"
                                            [ HE.onClick <| set_answers <| answers++[""]
                                            ]
                                            [ ui.icon "add"
                                            , H.text "Add a answer"
                                            ]
                                        ]
                                  ]
                              , attributes = []
                              }
                          }
                        , { id = "marking-matrix"
                          , label = SimpleLabel "Marking matrix"
                          , icon = Just "grid"
                          , view =
                              { contents = List.concat
                                [ [H.fieldset [] <| List.concat
                                    [ visibleIf (displayType == "checkbox") <| part_field
                                        { id = "markingMethod"
                                        , label = "Marking method"
                                        , help = Just "marking method"
                                        }
                                        (select_property
                                            [ ("sum ticked cells", "Sum ticked cells")
                                            , ("score per matched cell", "Score per matched cell")
                                            , ("all-or-nothing", "All-or-nothing")
                                            ]
                                        )
                                    , visibleIf (displayType == "checkbox" && needsMaxMarks && (String.toFloat (pstring "maxMarks") |> Maybe.withDefault 0) <= 0 ) <|
                                        [ ui.alert "warning"
                                            [ H.text "You must set a "
                                            , H.map UpdateTab <| Tabber.tab_link part_tabber_name "marking-settings" "maximum number of marks"
                                            , H.text " in order to use this marking method."
                                            ]
                                        ]
                                    , labelled_field
                                        ui
                                        { id = "customMCQMarking"
                                        , label = "Custom marking matrix?"
                                        , help = Just "custom marking matrix"
                                        , settings = part.settings
                                        , setter = pset
                                        }
                                        (\_ o -> 
                                            [ H.input
                                                [ HA.type_ "checkbox"
                                                , HA.checked <| customMCQMarking
                                                , HE.onCheck <| \b -> if b then pset (JE.string "", [S.field "matrix"]) else psetList identity (pfield "matrix") []
                                                , HA.id o.id
                                                ]
                                                []
                                            ]
                                        )
                                    , visibleIf customMCQMarking <|
                                        part_field
                                            { id = "matrix"
                                            , label = "Custom matrix expression"
                                            , help = Just "custom matrix expression"
                                            }
                                            text_property
                                    ]]
                                , visibleIf showMarkingMatrix <|
                                  [ H.fieldset [] <|
                                    [ H.legend [] [H.text "Marking matrix"]
                                    , if displayType == "radiogroup" || markingMethod == "sum ticked cells" then
                                        ui.help_block [ H.text "For each combination of answer and choice, specify the number of marks to add or subtract when the student picks it."]
                                      else
                                        ui.help_block [ H.text "For each combination of answer and choice, write 1 if the student should tick it, or 0 if they should leave it unticked."]
                                    , H.table [] <| List.concat
                                            [ [H.thead
                                                []
                                                [ H.tr [] <| (H.td [] [])::(answers |> List.indexedMap (\i answer -> 
                                                    H.th 
                                                        [ HA.id <| prefix_id <| "mcq-matrix-answer-"++(fi i)
                                                        , HA.scope "row"
                                                        ]
                                                        [mathjax_span answer]
                                                  ))
                                                ]
                                              ]
                                            , choices |> List.indexedMap (\i choice ->
                                                H.tr [] <| List.concat
                                                    [ [H.th 
                                                        [ HA.id <| prefix_id <| "mcq-matrix-choice-"++(fi i)
                                                        , HA.scope "row"
                                                        ]
                                                        [mathjax_span choice]
                                                      ]
                                                    , answers |> List.indexedMap (\j _ ->
                                                        H.td [] (custom_text_property
                                                            [ HA.attribute "aria-labelledby" <| (prefix_id <| "mcq-matrix-answer-"++(fi j))++" "++(prefix_id <| "mcq-matrix-choice-"++(fi i))
                                                            ]
                                                            ui
                                                            { id = "matrix-"++(fi i)++"-"++(fi j)
                                                            , label = "Choice "++(fi i)++", answer "++(fi j)
                                                            , help = Nothing
                                                            , settings = S.at [S.field "matrix", S.index i, S.index j] part.settings
                                                            , setter = pset
                                                            }
                                                        ))
                                                    ]
                                                )
                                            ]
                                    ]
                                  ]
                                ]
                              , attributes = []
                              }
                          }
                        ]

                    _ -> []

                part_tabber_name = "part-"++path_string

                part_tabber =
                    { name = part_tabber_name
                    , allow_empty = False
                    , tabs = tabs
                    }

                pfield k = S.atField k part.settings

                pstring = pfield >> S.getters.string
                pbool = pfield >> S.getters.bool
                pfloat = pstring >> String.toFloat >> Maybe.withDefault 0
                psetList = S.setList pset

                cfield k = S.atField k part.computed

                prompt_tab =
                    { id = "prompt"
                    , label = SimpleLabel "Prompt"
                    , icon = Just "text"
                    , view =
                        { contents = 
                            [ H.fieldset [ HA.class "vertical" ] <|
                                (part_field
                                    { id = "prompt"
                                    , label = "Prompt"
                                    , help = Just "the part prompt"
                                    }
                                    content_property
                                )
                            ]
                        , attributes = []
                        }
                    }

                marks_field = part_field
                    { id = "marks"
                    , label = "Marks"
                    , help = Just "marks"
                    }
                    text_property

                show_feedback_fields = List.concat
                    [ part_field
                        { id = "showCorrectAnswer"
                        , label = "Show correct answer on reveal?"
                        , help = Just "revealing the correct answer"
                        }
                        boolean_property
                    , part_field
                        { id = "showFeedbackIcon"
                        , label = "Show score feedback icon?"
                        , help = Just "the feedback icon"
                        }
                        boolean_property
                    ]

                fieldIsString field =
                    S.getters.value (pfield field)
                    |> JD.decodeValue JD.string
                    |> Result.toMaybe
                    |> (/=) Nothing

                customMCQMarking = fieldIsString "matrix"

                toggleExpressionField : { id : String, label : String, help : Maybe String, field : String, default : JE.Value } -> List (Html Msg)
                toggleExpressionField eo =
                    labelled_field
                        ui
                        { id = eo.id
                        , label = eo.label
                        , help = eo.help
                        , settings = part.settings
                        , setter = pset
                        }
                        (\_ o -> 
                            [ H.input
                                [ HA.type_ "checkbox"
                                , HA.checked <| fieldIsString eo.field
                                , HE.onCheck <| \b -> pset (if b then JE.string "" else eo.default, [S.field eo.field])
                                , HA.id o.id
                                ]
                                []
                            ]
                        )

                marking_settings_tab = 
                    { id = "marking-settings"
                    , label = SimpleLabel "Marking settings"
                    , icon = Just "pencil"
                    , view =
                        { contents = case part.type_.name of
                            "jme" ->
                                [ H.fieldset [] <| List.concat
                                    [ marks_field
                                    , part_field
                                        { id = "answer"
                                        , label = "Correct answer"
                                        , help = Just "correct answer"
                                        }
                                        (jme_property { notation = pstring "notation" })
                                    , visibleIf (S.getters.bool (cfield "is_equation"))
                                        [ H.div 
                                            [ HA.class "alert warning" ]
                                            [ ui.helplink "marking-an-equation" "marking an equation"
                                            , H.text "The correct answer is an equation. Use the "
                                            , H.map UpdateTab <| Tabber.tab_link part_tabber_name "checking-accuracy" "accuracy tab"
                                            , H.text " to generate variable values satisfying this equation so it can be marked accurately."
                                            ]
                                        ]
                                    , part_field
                                        { id = "notation"
                                        , label = "Notation"
                                        , help = Just "notation"
                                        }
                                        (select_property notation_options)
                                    ]
                                , H.fieldset [] show_feedback_fields
                                , H.fieldset [] <| List.concat
                                    [ [ H.legend [] [H.text "Advanced settings"] ]
                                    , part_field
                                        { id = "answerSimplification"
                                        , label = "Answer simplification rules"
                                        , help = Just "answer simplification rules"
                                        }
                                        text_property
                                    , part_field
                                        { id = "showPreview"
                                        , label = "Show preview of student's answer?"
                                        , help = Just "student answer preview"
                                        }
                                        boolean_property
                                    , part_field
                                        { id = "caseSensitive"
                                        , label = "Expression is case-sensitive?"
                                        , help = Just "case-sensitivity"
                                        }
                                        boolean_property
                                    ]
                                ]

                            "numberentry" ->
                                let
                                    precisionType = pstring "precisionType"

                                    precisionWord = case precisionType of
                                        "dp" -> "Digits"
                                        "sigfig" -> "Significant figures"
                                        _ -> ""

                                    fractionPossible = not (List.member precisionType ["dp", "sigfig"])

                                    allowFractions = pbool "allowFractions"

                                    mustBeReduced = pbool "mustBeReduced"
                                in
                                    [ H.fieldset [] <| List.concat
                                        [ marks_field
                                        , part_field
                                            { id = "minValue"
                                            , label = "Minimum accepted value"
                                            , help = Just "minimum accepted value"
                                            }
                                            text_property
                                        , part_field
                                            { id = "maxValue"
                                            , label = "Maximum accepted value"
                                            , help = Just "maximum accepted value"
                                            }
                                            text_property
                                        ]
                                    , H.fieldset [] show_feedback_fields
                                    , H.fieldset [] <| List.concat
                                        [ [ H.legend [] [H.text "Advanced settings"] ]
                                        , part_field
                                            { id = "displayAnswer"
                                            , label = "Display answer"
                                            , help = Just "display answer"
                                            }
                                            (\_ o -> List.concat
                                                [ text_property ui o
                                                , visibleIf (pstring "displayAnswer" == "")
                                                    [ui.help_block [ H.text "(The midpoint of the minimum and maximum accepted values)" ]]
                                                ]
                                            )
                                        , part_field
                                            { id = "precisionType"
                                            , label = "Precision restriction"
                                            , help = Just "precision restriction"
                                            }
                                            (select_property
                                                [ ("none", "None")
                                                , ("dp", "Decimal places")
                                                , ("sigfig", "Significant figures")
                                                ]
                                            )
                                        , visibleIf (fractionPossible) <|
                                            part_field
                                                { id = "allowFractions"
                                                , label = "Allow the student to enter a fraction?"
                                                , help = Just "allowing the student to enter a fraction"
                                                }
                                                boolean_property
                                        , visibleIf (fractionPossible && allowFractions) <| List.concat
                                            [ part_field
                                                { id = "mustBeReduced"
                                                , label = "Must the fraction be reduced?"
                                                , help = Just "reduced fractions"
                                                }
                                                boolean_property
                                            , part_field
                                                { id = "showFractionHint"
                                                , label = "Show fraction input hint?"
                                                , help = Just "the fraction input hint"
                                                }
                                                boolean_property
                                            , visibleIf mustBeReduced <| 
                                                part_field
                                                    { id = "mustBeReducedPC"
                                                    , label = "Partial credit for unreduced fraction"
                                                    , help = Just "reduced fraction"
                                                    }
                                                    boolean_property
                                            , part_field
                                                { id = "correctAnswerFraction"
                                                , label = "Display the correct answer as a fraction?"
                                                , help = Just "displaying the correct answer as a fraction"
                                                }
                                                boolean_property
                                            ]
                                        , visibleIf (precisionType /= "none") <| List.concat
                                            [ part_field
                                                { id = "precision"
                                                , label = precisionWord
                                                , help = Nothing
                                                }
                                                text_property
                                            , part_field
                                                { id = "strictPrecision"
                                                , label = "Require trailing zeros?"
                                                , help = Just "trailing zeros"
                                                }
                                                boolean_property
                                            , part_field
                                                { id = "showPrecisionHint"
                                                , label = "Show precision restriction hint?"
                                                , help = Just "precision restriction hint"
                                                }
                                                boolean_property
                                            , part_field
                                                { id = "precisionPartialCredit"
                                                , label = "Partial credit for wrong precision"
                                                , help = Nothing
                                                }
                                                percent_property
                                            , part_field
                                                { id = "precisionMessage"
                                                , label = "Message if wrong precision"
                                                , help = Nothing
                                                }
                                                content_property
                                            ]
                                        ]
                                    , H.fieldset [] <| List.concat
                                        [ [ H.legend [] [H.text "Notation styles"] ]
                                        , part_field
                                            { id = "notationStyles"
                                            , label = "Allowed notation"
                                            , help = Just "allowed notation styles"
                                            }
                                            (multi_select_property numberNotationStyles)
                                        , part_field
                                            { id = "correctAnswerStyle"
                                            , label = "Correct answer style"
                                            , help = Just "correct answer style"
                                            }
                                            (select_property (numberNotationStyles |> List.map (\s -> (s.value, s.label))))
                                        ]
                                    ]

                            "1_n_2" ->
                                let
                                    displayType = pstring "displayType"
                                in
                                    [ H.fieldset [] <| List.concat
                                        [ part_field
                                            { id = "showCellAnswerState"
                                            , label = "Show choice feedback state?"
                                            , help = Just "choice feedback state"
                                            }
                                            boolean_property
                                        ]
                                    , H.fieldset [] show_feedback_fields
                                    , H.fieldset [] <| List.concat
                                        [ [ H.legend [] [H.text "Advanced settings"] ]
                                        , part_field
                                            { id = "displayType"
                                            , label = "Selection type"
                                            , help = Just "selection type"
                                            }
                                            (select_property 
                                                [ ("radiogroup", "Radio buttons")
                                                , ("dropdownlist", "Drop down list")
                                                ]
                                            )
                                        , visibleIf (displayType == "dropdownlist") <|
                                            part_field
                                                { id = "showBlankOption"
                                                , label = "Show a blank choice?"
                                                , help = Just "blank choice"
                                                }
                                                boolean_property
                                        , visibleIf (displayType == "radiogroup") <|
                                            part_field
                                                { id = "displayColumns"
                                                , label = "Number of display columns"
                                                , help = Just "display columns"
                                                }
                                                text_property
                                        , toggleExpressionField 
                                            { id = "customMarking"
                                            , label = "Custom marking matrix?"
                                            , help = Just "custom marking matrix"
                                            , field = "matrix"
                                            , default = JE.list JE.string []
                                            }
                                        , visibleIf customMCQMarking <|
                                            part_field
                                                { id = "matrix"
                                                , label = "Custom matrix expression"
                                                , help = Just "custom matrix expression"
                                                }
                                                text_property
                                        , part_field
                                            { id = "interpretedAnswerForm"
                                            , label = "Form of the interpreted answer"
                                            , help = Just "form of the interpreted answer"
                                            }
                                            (select_property
                                                [ ("list of list of boolean", "2D array of booleans")
                                                , ("index of choice", "Index of selected choice")
                                                , ("text of choice", "Text of selected choice")
                                                ]
                                            )
                                        ]
                                    ]

                            "m_n_2" ->
                                [ H.fieldset [] <| List.concat
                                    [ part_field
                                        { id = "minMarks"
                                        , label = "Minimum marks"
                                        , help = Just "minimum marks"
                                        }
                                        text_property
                                    , part_field
                                        { id = "maxMarks"
                                        , label = "Maximum marks"
                                        , help = Just "maximum marks"
                                        }
                                        text_property
                                    , part_field
                                        { id = "showCellAnswerState"
                                        , label = "Show choice feedback state?"
                                        , help = Just "choice feedback state"
                                        }
                                        boolean_property
                                    ]
                                , H.fieldset [] show_feedback_fields
                                , H.fieldset [] <| List.concat
                                    [ [ H.legend [] [H.text "Advanced settings"] ]
                                    , part_field
                                        { id = "displayColumns"
                                        , label = "Number of display columns"
                                        , help = Just "display columns"
                                        }
                                        text_property
                                    , part_field
                                        { id = "minAnswers"
                                        , label = "Minimum answers"
                                        , help = Just "minimum answers"
                                        }
                                        text_property
                                    , part_field
                                        { id = "maxAnswers"
                                        , label = "Maximum answers"
                                        , help = Just "maximum answers"
                                        }
                                        text_property
                                    , visibleIf (pfloat "minAnswers" /= 0 || pfloat "maxAnswers" /= 0) <|
                                        part_field
                                            { id = "warningType"
                                            , label = "What to do if wrong number of answers selected"
                                            , help = Just "wrong number of answers"
                                            }
                                            (select_property
                                                [ ("none", "Do nothing")
                                                , ("warn", "Warn")
                                                , ("prevent", "Prevent submission")
                                                ]
                                            )
                                    , labelled_field
                                        ui
                                        { id = "customMCQMarking"
                                        , label = "Custom marking matrix?"
                                        , help = Just "custom marking matrix"
                                        , settings = part.settings
                                        , setter = pset
                                        }
                                        (\_ o -> 
                                            [ H.input
                                                [ HA.type_ "checkbox"
                                                , HA.checked <| customMCQMarking
                                                , HE.onCheck <| \b -> if b then pset (JE.string "", [S.field "matrix"]) else psetList identity (pfield "matrix") []
                                                , HA.id o.id
                                                ]
                                                []
                                            ]
                                        )
                                    , visibleIf customMCQMarking <|
                                        part_field
                                            { id = "matrix"
                                            , label = "Custom matrix expression"
                                            , help = Just "custom matrix expression"
                                            }
                                            text_property
                                    , part_field
                                        { id = "interpretedAnswerForm"
                                        , label = "Form of the interpreted answer"
                                        , help = Just "form of the interpreted answer"
                                        }
                                        (select_property
                                            [ ("list of list of boolean", "2D array of booleans")
                                            , ("list of boolean", "List of booleans")
                                            , ("indices of choices", "Indices of selected choices")
                                            , ("text of choices", "Text of selected choices")
                                            ]
                                        )
                                    ]
                                ]

                            "m_n_x" ->
                                let
                                    displayType = pstring "displayType"

                                    layoutType = pstring "layoutType"
                                in
                                    [ H.fieldset [] <| List.concat
                                        [ part_field
                                            { id = "minMarks"
                                            , label = "Minimum marks"
                                            , help = Just "minimum marks"
                                            }
                                            text_property
                                        , part_field
                                            { id = "maxMarks"
                                            , label = "Maximum marks"
                                            , help = Just "maximum marks"
                                            }
                                            text_property
                                        , part_field
                                            { id = "showCellAnswerState"
                                            , label = "Show choice feedback state?"
                                            , help = Just "choice feedback state"
                                            }
                                            boolean_property
                                        ]
                                    , H.fieldset [] show_feedback_fields
                                    , H.fieldset [] <| List.concat
                                        [ [ H.legend [] [H.text "Advanced settings"] ]
                                        , part_field
                                            { id = "minAnswers"
                                            , label = "Minimum answers"
                                            , help = Just "minimum answers"
                                            }
                                            text_property
                                        , part_field
                                            { id = "maxAnswers"
                                            , label = "Maximum answers"
                                            , help = Just "maximum answers"
                                            }
                                            text_property
                                        , visibleIf (pfloat "minAnswers" /= 0 || pfloat "maxAnswers" /= 0) <|
                                            part_field
                                                { id = "warningType"
                                                , label = "What to do if wrong number of answers selected"
                                                , help = Just "wrong number of answers"
                                                }
                                                (select_property
                                                    [ ("none", "Do nothing")
                                                    , ("warn", "Warn")
                                                    , ("prevent", "Prevent submission")
                                                    ]
                                                )
                                        , part_field
                                            { id = "displayType"
                                            , label = "Selection type"
                                            , help = Just "selection type"
                                            }
                                            (select_property 
                                                [ ("radiogroup", "One from each row")
                                                , ("checkbox", "Checkboxes")
                                                ]
                                            )
                                        , part_field
                                            { id = "layoutType"
                                            , label = "Layout"
                                            , help = Just "layout"
                                            }
                                            (select_property
                                                [ ("all", "Show all options")
                                                , ("lowertriangle", "Lower triangle")
                                                , ("strictlowertriangle", "Lower triangle (no diagonal)")
                                                , ("uppertriangle", "Upper triangle")
                                                , ("strictuppertriangle", "Upper triangle (no diagonal)")
                                                , ("expression", "Custom expression")
                                                ]
                                            )
                                        , visibleIf (layoutType == "expression") <|
                                            part_field
                                                { id = "layoutExpression"
                                                , label = "Custom layout expression"
                                                , help = Nothing
                                                }
                                                text_property
                                        , part_field
                                            { id = "interpretedAnswerForm"
                                            , label = "Form of the interpreted answer"
                                            , help = Just "form of the interpreted answer"
                                            }
                                            (select_property
                                                [ ("list of list of boolean", "2D array of booleans")
                                                , ("indices of pairs", "List of chosen pair indices")
                                                , ("text of choices", "Text of chosen pairs")
                                                ]
                                            )
                                        ]
                                    ]

                            "gapfill" -> 
                                let
                                    gap_types =
                                        gaps
                                        |> List.map (\g -> g.type_.name)
                                        |> Set.fromList

                                    all_gaps_same_type = 
                                        gaps
                                        |> List.map (\g -> g.type_.name)
                                        |> Set.fromList
                                        |> Set.size
                                        |> (>=) 1
                                in
                                    [ H.fieldset [] <| List.concat
                                        [ visibleIf all_gaps_same_type <| part_field
                                            { id = "sortAnswers"
                                            , label = "Sort student's answers before marking?"
                                            , help = Just "sorting answers"
                                            }
                                            boolean_property
                                        , part_field
                                            { id = "inlineCorrectAnswer"
                                            , label = "Show expected answers inline?"
                                            , help = Just "showing expected answers inline"
                                            }
                                            boolean_property
                                        ]
                                    , H.fieldset [] show_feedback_fields
                                    ]

                            "matrix" -> 
                                let
                                    allowResize = pbool "allowResize"

                                    precisionType = pstring "precisionType"

                                    precisionWord = case precisionType of
                                        "dp" -> "Digits"
                                        "sigfig" -> "Significant figures"
                                        _ -> ""

                                    gridlines = pstring "gridlines"
                                in
                                    [ H.fieldset [] <| List.concat
                                        [ marks_field
                                        , part_field
                                            { id = "correctAnswer"
                                            , label = "Correct answer"
                                            , help = Nothing
                                            }
                                            code_property
                                        ]
                                    , H.fieldset [] show_feedback_fields
                                    , H.fieldset [] <| List.concat
                                        [ [H.legend [] [H.text "Size of the matrix"]]
                                        , part_field
                                            { id = "numRows"
                                            , label = "Number of rows"
                                            , help = Just "number of rows"
                                            }
                                            text_property
                                        , part_field
                                            { id = "numColumns"
                                            , label = "Number of columns"
                                            , help = Just "number of columns"
                                            }
                                            text_property
                                        , part_field
                                            { id = "allowResize"
                                            , label = "Allow student to change size of matrix?"
                                            , help = Just "resizing the matrix"
                                            }
                                            boolean_property
                                        , visibleIf allowResize <| List.concat
                                            [ part_field
                                                { id = "minRows"
                                                , label = "Minimum number of rows"
                                                , help = Just "minimum number of rows"
                                                }
                                                text_property
                                            , part_field
                                                { id = "maxRows"
                                                , label = "Maximum number of rows"
                                                , help = Just "maximum number of rows"
                                                }
                                                text_property
                                            , part_field
                                                { id = "minColumns"
                                                , label = "Minimum number of columns"
                                                , help = Just "minimum number of columns"
                                                }
                                                text_property
                                            , part_field
                                                { id = "maxColumns"
                                                , label = "Maximum number of columns"
                                                , help = Just "maximum number of columns"
                                                }
                                                text_property
                                            ]
                                        ]
                                    , H.fieldset [] <| List.concat
                                        [ [H.legend [] [H.text "Precision"]]
                                        , part_field
                                            { id = "tolerance"
                                            , label = "Margin of error allowed in each cell"
                                            , help = Just "margin of error"
                                            }
                                            text_property
                                        , part_field
                                            { id = "markPerCell"
                                            , label = "Gain marks for each correct cell?"
                                            , help = Just "marks per correct cell"
                                            }
                                            boolean_property
                                        , part_field
                                            { id = "precisionType"
                                            , label = "Precision restriction"
                                            , help = Just "precision restriction"
                                            }
                                            (select_property
                                                [ ("none", "None")
                                                , ("dp", "Decimal places")
                                                , ("sigfig", "Significant figures")
                                                ]
                                            )
                                        , visibleIf (precisionType /= "none") <| List.concat
                                            [ part_field
                                                { id = "precision"
                                                , label = precisionWord
                                                , help = Nothing
                                                }
                                                text_property
                                            , part_field
                                                { id = "strictPrecision"
                                                , label = "Require trailing zeros?"
                                                , help = Just "trailing zeros"
                                                }
                                                boolean_property
                                            , part_field
                                                { id = "precisionPartialCredit"
                                                , label = "Partial credit for wrong precision"
                                                , help = Nothing
                                                }
                                                percent_property
                                            , part_field
                                                { id = "precisionMessage"
                                                , label = "Message if wrong precision"
                                                , help = Nothing
                                                }
                                                content_property
                                            ]
                                        ]
                                    , H.fieldset [] <| List.concat
                                        [ [H.legend [] [H.text "Pre-filled cells"]]
                                        , part_field
                                            { id = "prefilledCells"
                                            , label = "Pre-filled cells"
                                            , help = Just "pre-filled cells"
                                            }
                                            code_property
                                        ]
                                    , H.fieldset [] <| List.concat
                                        [ [H.legend [] [H.text "Grid lines"]]
                                        , part_field
                                            { id = "gridlines"
                                            , label = "Grid lines"
                                            , help = Just "grid lines"
                                            }
                                            (select_property
                                                [ ("none", "None")
                                                , ("afterFirstRow", "After first row")
                                                , ("beforeLastRow", "Before last row")
                                                , ("afterFirstColumn", "After first column")
                                                , ("beforeLastColumn", "Before last column")
                                                , ("custom", "Custom expression")
                                                ]
                                            )
                                        , visibleIf (gridlines == "custom") <| List.concat
                                            [ part_field
                                                { id = "gridlinesCustomRows"
                                                , label = "Rows with lines"
                                                , help = Just "rows with lines"
                                                }
                                                code_property
                                            , part_field
                                                { id = "gridlinesCustomColumns"
                                                , label = "Columns with lines"
                                                , help = Just "columns with lines"
                                                }
                                                code_property
                                            ]
                                        ]
                                    ]

                            "patternmatch" ->
                                let
                                    showCorrectAnswer = pbool "showCorrectAnswer"

                                    matchMode = pstring "matchMode"
                                in
                                    [ H.fieldset [] <| List.concat
                                        [ marks_field
                                        , part_field
                                            { id = "matchMode"
                                            , label = "Match test"
                                            , help = Just "match test"
                                            }
                                            (select_property
                                                [ ("regex", "Regular expression")
                                                , ("exact", "Exact match")
                                                ]
                                            )
                                        , part_field
                                            { id = "answer"
                                            , label = "Answer pattern"
                                            , help = Just "answer pattern"
                                            }
                                            text_property
                                        , part_field
                                            { id = "allowEmpty"
                                            , label = "Allow the student to submit an empty answer?"
                                            , help = Just "empty answers"
                                            }
                                            boolean_property
                                        , visibleIf (showCorrectAnswer && matchMode == "regex") <|
                                            part_field
                                                { id = "displayAnswer"
                                                , label = "Display answer"
                                                , help = Just "display answer"
                                                }
                                                text_property
                                        ]
                                    , H.fieldset [] show_feedback_fields
                                    , H.fieldset [] <| List.concat
                                        [ [H.legend [] [H.text "Advanced settings"] ]
                                        , part_field
                                            { id = "caseSensitive"
                                            , label = "Must the answer be in the correct case?"
                                            , help = Just "case sensitivity"
                                            }
                                            boolean_property
                                        , visibleIf (pbool "caseSensitive") <| part_field
                                            { id = "partialCredit"
                                            , label = "Partial credit for answer not matching case"
                                            , help = Nothing
                                            }
                                            percent_property
                                        ]
                                    ]


                            _ -> [] -- TODO: custom
                        , attributes = []
                        }
                    }

                alternative_feedback_tab =
                    { id = "alternative-feedback-message"
                    , label = SimpleLabel "Feedback message"
                    , icon = Just "feedback"
                    , view =
                        { contents = 
                            [ H.fieldset [] <| List.concat
                                [ part_field
                                    { id = "useAlternativeFeedback"
                                    , label = "Show all feedback?"
                                    , help = Just "using all alternative feedback"
                                    }
                                    boolean_property
                                , part_field
                                    { id = "alternativeFeedbackMessage"
                                    , label = "Message if this alternative is used"
                                    , help = Just "alternative feedback message"
                                    }
                                    content_property
                                ]
                            ] 
                        , attributes = []
                        }
                    }

                marking_algorithm_tab =
                    let
                        marking_algorithm = part.marking_algorithm

                        notes = marking_algorithm.notes

                        extendBaseMarkingAlgorithm = pbool "extendBaseMarkingAlgorithm"

                        update_algo = UpdateMarkingAlgorithm >> pmsg

                        note_name : Note -> String
                        note_name note = S.getters.string (S.atField "name" note.settings)

                        changed_note_names : Set String
                        changed_note_names = 
                            notes
                            |> List.filter (.changed)
                            |> List.map (note_name)
                            |> Set.fromList

                        shown_notes =
                            notes
                            |> List.filter (\note -> note.changed || (not (Set.member (note_name note) changed_note_names)))

                        note_tabs = shown_notes |> List.indexedMap pair |> List.filter (\(_,note) -> note.changed || extendBaseMarkingAlgorithm) |> List.map (\(i, note) ->
                            let
                                nfield k = S.atField k note.settings
                                nstring = nfield >> S.getters.string
                                name = nstring "name"

                                nset = ChangeMarkingAlgorithmNote i >> update_algo

                                note_field o = labelled_field
                                    ui
                                    { id = prefix_id <| "note-"++(fi i)
                                    , label = o.label
                                    , help = Nothing
                                    , settings = nfield o.id
                                    , setter = nset
                                    }

                            in
                                { id = fi i
                                , label = SimpleLabel <| if String.trim name /= "" then name else "Unnamed note"
                                , icon = Nothing
                                , view =
                                    { contents = 
                                        [ H.fieldset [ HA.class "vertical" ] <| List.concat
                                            [ [ ui.button "danger" 
                                                    [ HE.onClick <| update_algo <| DeleteMarkingAlgorithmNote i ]
                                                    [ ui.icon "remove", H.text "Delete this note" ]
                                              ]
                                            , note_field
                                                { id = "name"
                                                , label = "Name"
                                                }
                                                text_property
                                            , note_field
                                                { id = "definition"
                                                , label = "Definition"
                                                }
                                                code_property
                                            , note_field
                                                { id = "description"
                                                , label = "Description"
                                                }
                                                content_property
                                            ]
                                        ]
                                        , attributes = []
                                    }
                                }
                            )

                        notes_tabber = 
                            { name = prefix_id "marking-algorithm-notes"
                            , allow_empty = False
                            , tabs = note_tabs
                            }

                        add_note = AddMarkingAlgorithmNote |> update_algo
                    in
                        { id = "marking-algorithm"
                        , label = SimpleLabel "Marking algorithm"
                        , icon = Just "ok"
                        , view =
                            { contents =
                                [ H.fieldset [] <| List.concat
                                    [ visibleIf (part.type_.name /= "extension") <| part_field
                                        { id = "extendBaseMarkingAlgorithm"
                                        , label = "Extend base marking algorithm?"
                                        , help = Just "extending the base marking algorithm"
                                        }
                                        boolean_property
                                    ]
                                , H.section [HA.class "tabbed-sidebar"]
                                    [ H.nav []
                                        [ view_tablist notes_tabber [ HA.class "vertical" ]
                                        , ui.button "primary"
                                              [ HE.onClick add_note
                                              ]
                                              [ ui.icon "add"
                                              , H.text "Add a note"
                                              ]
                                        ]
                                    , view_tabpanel notes_tabber 
                                    ]
                                ]
                            , attributes = []
                            }
                        }

                testing_tab =
                    let
                        decode_feedback_message : JD.Decoder FeedbackMessage
                        decode_feedback_message = 
                            JD.succeed FeedbackMessage
                            |> andMap (JD.field "credit_change" JD.string)
                            |> andMap (JD.field "credit" JD.float)
                            |> andMap (JD.field "message" JD.value)
                            |> andMap (JD.field "op" JD.string)
                            |> andMap (JD.field "reason" JD.string)
                            |> andMap (JD.field "scope" JD.value)

                        decode_submit_result : JD.Decoder SubmitResult
                        decode_submit_result = JD.oneOf
                            [ JD.succeed MarkingFeedback
                                |> andMap (JD.field "credit" JD.float)
                                |> andMap (JD.field "markingFeedback" <| JD.list decode_feedback_message)
                                |> JD.map Answered
                            ]
                        mresult =
                            S.maybe_get decode_submit_result (S.atField "submit_answer" part.computed)
                    in
                        { id = "testing"
                        , label = SimpleLabel "Testing"
                        , icon = Just "check"
                        , view =
                            { contents = List.concat
                                [ [ H.h4 [] [H.text "Test that the marking algorithm works"]
                                  , ui.help_block
                                      [ H.p [] [H.text "Check that the marking algorithm works with different sets of variables and student answers using the interface below."]
                                      , H.p [] [H.text "Create unit tests to save expected results and to document how the algorithm should work."]
                                      ]
                                  , ui.button "warning"
                                      [ HE.onClick <| UpdateQuestion <| GenerateQuestion ]
                                      [ H.text "generate question" ]
                                  ]
                                , visibleIf (question.instance /= Nothing) <| 
                                    [ H.form [ HE.onSubmit <| pmsg <| SubmitAnswer] 
                                        [ H.fieldset [] <| List.concat
                                            [ [H.label
                                                [ HA.for <| prefix_id "testing_expectedAnswer" ]
                                                [ H.text "Expected answer" ]
                                              , H.pre [] [H.text <| S.getters.string (S.atField "expectedAnswer" part.computed)]
                                              ]
                                            , labelled_field
                                                ui
                                                { id = prefix_id "testing_answer"
                                                , label = "Answer"
                                                , help = Nothing
                                                , settings = S.atField "testing_answer" part.computed
                                                , setter = ChangePartSetting ComputedSetting >> pmsg
                                                }
                                                text_property
                                            , [ H.button 
                                                [ HA.class "btn primary"
                                                , HA.type_ "submit"
                                                ]
                                                [H.text "submit"]
                                              ]
                                            ]
                                        ]
                                    ]
                                , case mresult of
                                    Nothing -> [H.text "not submitted"]
                                    Just (Answered result) -> 
                                        [ H.text <| "submitted: "++(ff result.credit)
                                        , H.ol [ HA.class "feedback-messages" ] (result.messages |> List.map (\m ->
                                            H.li [] [Ui.raw_html m.message]
                                            ))
                                        ]

                                ]
                            , attributes = []
                            }
                        }

                scripts_tab =
                    let
                        script_setting script field = S.at [S.field "scripts", S.field script, S.field field] part.settings

                        script_field script o = labelled_field
                            ui
                            { id = prefix_id <| script++"-"++o.id
                            , label = o.label
                            , help = Nothing
                            , settings = script_setting script o.id
                            , setter = pset
                            }

                        when_run script label = 
                            [H.p [] <| List.concat
                                [ [H.text <| "Run the "++label++" script "]
                                , custom_select_property
                                    [ Aria.label <| "When to run the "++label++" script"
                                    , HA.class "inline"
                                    ]
                                    [ ("instead", "instead of")
                                    , ("after", "after")
                                    , ("before", "before")
                                    ]
                                    ui
                                    { id = prefix_id "mark-order"
                                    , settings = script_setting script "order"
                                    , setter = pset
                                    , label = ""
                                    , help = Nothing
                                    }
                                , [H.text " the built-in script."]
                                ]
                            ]
                    in
                        { id = "scripts"
                        , label = SimpleLabel "Scripts"
                        , icon = Just "file"
                        , view =
                            { contents = 
                                [ ui.help_block 
                                    [ ui.helplink "part-scripts" "part scripts"
                                    , H.text "When you need to change the way this part works beyond the available options, you can write JavaScript code to be executed at the times described below." 
                                    ]
                                , H.fieldset [] <| List.concat
                                    [ script_field "constructor"
                                        { id = "script"
                                        , label = "When the part is created"
                                        }
                                        code_property
                                    , script_field "mark"
                                        { id = "script"
                                        , label = "Mark student's answer"
                                        }
                                        code_property
                                    , when_run "mark" "marking"
                                    , script_field "validate"
                                        { id = "script"
                                        , label = "Validate student's answer"
                                        }
                                        code_property
                                    , when_run "validate" "validation"
                                    ]

                                ]
                            , attributes = []
                            }
                        }

                adaptive_marking_tab =
                    let
                        back_references : List (PartPath, Part)
                        back_references =
                            all_parts
                            |> List.filter (\(ppath, pp) ->
                                pp.settings
                                |> S.get (JD.field "variableReplacements" <| JD.list (JD.oneOf
                                    [ JD.field "part" JD.string |> JD.map Just
                                    , JD.succeed Nothing
                                    ]
                                   ))
                                   []
                                |> List.member (Just path_string)
                               )

                        variable_replacements : List (Settings, JE.Value)
                        variable_replacements = 
                            S.getters.list (pfield "variableReplacements")
                            |> List.indexedMap (\i v -> (S.at [S.field "variableReplacements", S.index i] part.settings, v))

                        set_variable_replacements = S.setList pset identity (pfield "variableReplacements")

                        replaced_variables : List String
                        replaced_variables = variable_replacements |> List.map (first >> S.atField "variable" >> S.getters.string)

                        unreplaced_variables : List String
                        unreplaced_variables = 
                            all_variables
                            |> List.map name_of
                            |> (\s -> Set.diff (Set.fromList s) (Set.fromList replaced_variables))
                            |> Set.toList
                            |> List.sort

                        part_options : List (String, String)
                        part_options = 
                            all_parts
                            |> List.filter (\(ppath, pp) -> 
                                let
                                    is_prefix = LE.isPrefixOf ppath path
                                    has_marks = pp.type_.has_marks
                                    pkind = bottom_index ppath |> Maybe.map first |> Maybe.withDefault TopPart
                                    pis_alternative = pkind == Alternative
                                in
                                    (not is_prefix) && has_marks && (not pis_alternative)
                               )
                            |> List.map (\(ppath, pp) -> 
                                (part_path_toString ppath
                                , (String.repeat ((List.length ppath)-1) "\u{00a0}\u{00a0}") ++ (part_name ppath pp)
                                )
                               )

                        add_variable_replacement : String -> Msg
                        add_variable_replacement name =
                            (List.map second variable_replacements)++[JE.object [("variable", JE.string name), ("part", JE.string <| Maybe.withDefault "" <| Maybe.map first <| List.head <| part_options)]]
                            |> set_variable_replacements

                        remove_variable_replacement : Int -> Msg
                        remove_variable_replacement i =
                            variable_replacements
                            |> List.map second
                            |> LE.removeAt i
                            |> set_variable_replacements

                        can_make_variable_replacements = (all_variables /= []) && (part_options /= [])

                        recomputed_random_variables : List Variable
                        recomputed_random_variables =
                            replaced_variables
                            |> List.filterMap get_variable
                            |> List.concatMap (all_dependants_of)
                            |> LE.unique
                            |> List.filter variable_is_random
                    in
                        { id = "adaptive-marking"
                        , label = SimpleLabel "Adaptive marking"
                        , icon = Just "transfer"
                        , view =
                            { contents = List.concat
                                [ [ ui.help_block
                                    [ ui.helplink "adaptive-marking" "adaptive marking"
                                    , H.text "To account for errors made by the student in earlier calculations, replace question variables with answers to earlier parts."
                                    ]
                                  ]
                                , visibleIf (not (can_make_variable_replacements)) <|
                                    [ ui.alert "warning"
                                        [ H.text "In order to create a variable replacement, you must define at least one variable and one other part."
                                        ]
                                    ]
                                , visibleIf (variable_replacements /= []) <|
                                    [H.table
                                        [ HA.class "variable-replacements"
                                        ]
                                        [ H.thead
                                            []
                                            [ H.tr
                                                []
                                                [ H.th [] [H.text "Variable"]
                                                , H.th [] [H.text "Answer to use"]
                                                , H.th [] [H.text "Must be answered?"]
                                                , H.td [] []
                                                ]
                                            ]
                                        , H.tbody
                                            []
                                            (variable_replacements |> List.indexedMap (\i (vrsettings,v) ->
                                                let
                                                    variable = S.getters.string (S.atField "variable" vrsettings)

                                                    vr_prefix_id id = prefix_id <| "variable-replacement-"++(fi i)++"-"++id
                                                in
                                                    H.tr
                                                        []
                                                        [ H.td
                                                            [ HA.class "monospace" ]
                                                            [ H.text variable ]
                                                        , H.td
                                                            [ ]
                                                            (select_property
                                                                part_options
                                                                ui
                                                                { id = vr_prefix_id "part"
                                                                , label = ""
                                                                , help = Nothing
                                                                , settings = vrsettings |> S.atField "part"
                                                                , setter = pset
                                                                }
                                                            )
                                                        , H.td
                                                            []
                                                            (boolean_property
                                                                ui
                                                                { id = vr_prefix_id "must_go_first"
                                                                , label = ""
                                                                , help = Nothing
                                                                , settings = vrsettings |> S.atField "must_go_first"
                                                                , setter = pset
                                                                }
                                                            )
                                                        , H.td
                                                            []
                                                            [ ui.button "danger"
                                                                [ HE.onClick <| remove_variable_replacement i
                                                                , Aria.label <| "Remove replacement of variable "++variable
                                                                ]
                                                                [ ui.icon "remove"
                                                                ]
                                                            ]
                                                        ]
                                            ))

                                        ]
                                    ]
                                , visibleIf (recomputed_random_variables /= []) <|
                                    [ ui.alert "danger"
                                        [ H.p [] [H.text "The variable replacements you've chosen will cause the following variables to be regenerated each time the student submits an answer to this part:"]
                                        , H.ul [ HA.class "list-inline" ] (recomputed_random_variables |> List.map (\r -> H.li [] [variable_link <| name_of r]))
                                        , H.p [] [H.text "These variables have some random elements, which means they're not guaranteed to have the same value each time the student submits an answer. You should define new variables to store the random elements, so that they remain the same each time this part is marked."]
                                        , H.p [] [ui.labelled_helplink "adaptive-marking" "More information about this problem"]
                                        ]
                                    ]
                                , visibleIf (unreplaced_variables /= []) <|
                                    ui.dropdown 
                                        "add-variable-replacement" 
                                        [ ui.icon "add"
                                        , H.text "Add a variable replacement"
                                        ]
                                        (unreplaced_variables |> List.map (\name -> 
                                            H.li
                                                []
                                                [ ui.button "monospace"
                                                    [ HE.onClick <| add_variable_replacement name
                                                    , HA.attribute "command" "hide-popover"
                                                    , HA.attribute "commandfor" "add-variable-replacement-menu"
                                                    ]
                                                    [ H.text name ]
                                                ]
                                        ))
                                , [H.fieldset [] <| List.concat
                                    [ part_field
                                        { id = "variableReplacementStrategy"
                                        , label = "Variable replacement strategy"
                                        , help = Just "variable replacement strategy"
                                        }
                                        (select_property
                                            [ ("originalfirst", "Try without replacements first")
                                            , ("alwaysreplace", "Always replace variables")
                                            ]
                                        )
                                    , part_field
                                        { id = "adaptiveMarkingPenalty"
                                        , label = "Penalty when adaptive marking is used"
                                        , help = Just "adaptive marking penalty"
                                        }
                                        text_property
                                    ]
                                  ]
                                , visibleIf (back_references /= []) <|
                                    [ H.p [] [H.text "The answer to this part is used to replace variables in the following other parts:"]
                                    , H.ul [] (back_references |> List.map (\(ppath, pp) -> part_link ppath pp))
                                    , H.fieldset [] <| List.concat
                                        [ part_field
                                            { id = "adaptiveMarkingUseCondition"
                                            , label = "Condition for using this part's answer in adaptive marking"
                                            , help = Just "adaptive marking use condition"
                                            }
                                            text_property
                                        , part_field
                                            { id = "adaptiveMarkingNotUsedMessage"
                                            , label = "Message when this part's answer is not used"
                                            , help = Just "adaptive marking use message"
                                            }
                                            content_property
                                        ]
                                    ]
                                ]
                            , attributes = []
                            }
                        }

                next_parts_tab =
                    let
                        reachable : Bool
                        reachable = List.member path reachable_parts

                        is_first_part : Bool
                        is_first_part = path == [(TopPart, 0)]

                        references : List (PartPath, Part)
                        references = 
                               top_parts
                            |> List.filter (\(ppath, pp) ->
                                    next_parts_from pp
                                    |> List.map first
                                    |> List.member path
                               )

                        next_part_values = S.getters.list (S.atField "nextParts" part.settings)

                        next_parts : List (Int, S.Address, (PartPath, Part))
                        next_parts = 
                            next_part_values
                            |> List.indexedMap (\i _ ->
                                let
                                    npat = [S.field "nextParts", S.index i]

                                    npsettings = S.at npat part.settings

                                    mnp = 
                                        S.maybe_get JD.int (S.atField "otherPart" npsettings)
                                        |> Maybe.andThen (\otherPart -> LE.getAt otherPart top_parts)
                                in
                                    mnp |> Maybe.map (\np -> (i, npat, np))
                               )
                            |> List.filterMap identity

                        set_next_parts = S.setList pset identity (pfield "nextParts")

                        add_next_part : Int -> Msg
                        add_next_part index =
                            (next_part_values ++ [JE.object [("otherPart", JE.int index)]])
                            |> set_next_parts

                        remove_next_part : Int -> Msg
                        remove_next_part i = set_next_parts (LE.removeAt i next_part_values)
                    in
                        { id = "next-parts"
                        , label = SimpleLabel "Next parts"
                        , icon = Just "next"
                        , view =
                            { contents = List.concat
                                [ visibleIf (not reachable) <|
                                    [ ui.alert "warning"
                                        [ H.p [] [H.text "This part can't be reached by the student."]
                                        , if references == [] then
                                            H.p [] [H.text "Add a \"next part\" reference to this part from another part."]
                                          else
                                            H.p [] [H.text "None of the parts which can lead to this part are reachable either."]
                                        ]
                                    ]
                                , visibleIf (not is_first_part)
                                    [ H.fieldset [] <| List.concat
                                        [ part_field
                                            { id = "suggestGoingBack"
                                            , label = "Suggest going back to the previous part?"
                                            , help = Just "going back"
                                            }
                                            boolean_property
                                        ]
                                    ]
                                , [ H.h3 [] [H.text "Next part options"]
                                  , ui.help_block
                                      [ ui.helplink "next-parts" "next parts"
                                      , H.text "Define the list of parts that the student can visit after this one."
                                      ]
                                  ]
                                , next_parts |> List.map (\(i, npat, (npath, np)) ->
                                    let
                                        npsettings = S.at npat part.settings
                                        npcomputed = S.at npat part.computed

                                        npprefix_id id = prefix_id <| "next-part-"++(fi i)++"-"++id

                                        npfield k = S.atField k npsettings

                                        availabilityCondition = S.getters.string (npfield "availabilityCondition")

                                        penalty = S.getters.string (npfield "penalty")


                                        variable_replacements : List (Int, S.Address, JE.Value)
                                        variable_replacements =
                                            S.getters.list (npfield "variableReplacements")
                                            |> List.indexedMap (\vi v -> (vi, [S.field "variableReplacements", S.index vi], v))

                                        set_variable_replacements = psetList identity (S.atField "variableReplacements" npsettings)

                                        replaced_variables : List String
                                        replaced_variables = variable_replacements |> List.map ((\(_,s,_) -> S.at s npsettings) >> S.atField "variable" >> S.getters.string)

                                        unreplaced_variables : List String
                                        unreplaced_variables = 
                                            all_variables
                                            |> List.map name_of
                                            |> (\s -> Set.diff (Set.fromList s) (Set.fromList replaced_variables))
                                            |> Set.toList
                                            |> List.sort

                                        add_variable_replacement : String -> Msg
                                        add_variable_replacement name =
                                            (List.map third variable_replacements)++[JE.object [("variable", JE.string name), ("definition", JE.string "interpreted_answer")]]
                                            |> set_variable_replacements

                                        remove_variable_replacement : Int -> Msg
                                        remove_variable_replacement vi =
                                            variable_replacements
                                            |> List.map third
                                            |> LE.removeAt vi
                                            |> set_variable_replacements

                                        can_make_variable_replacements = all_variables /= []

                                        availabilityConditions =
                                            [ (Just "", "Always")
                                            , (Just "answered", "When answer submitted")
                                            , (Just "not (answered and correct)", "When unanswered or incorrect")
                                            , (Just "answered and credit<1", "When incorrect")
                                            , (Just "answered and credit=1", "When correct")
                                            , (Nothing, "Depending on expression")
                                            ]

                                        custom_availabilityCondition =
                                            S.get
                                                JD.bool
                                                (not <| List.member (Just availabilityCondition) (List.map first <| dropRight 1 availabilityConditions))
                                                (S.atField "availabilityCondition" part.computed)

                                        next_part_field o = labelled_field
                                            ui
                                            { id = npprefix_id o.id
                                            , label = o.label
                                            , help = o.help
                                            , settings = npfield o.id
                                            , setter = pset
                                            }
                                    in
                                        H.article []
                                            [ H.h4 [] [H.text <| part_name npath np]
                                            , H.p [] [H.text <| Debug.toString npath]
                                            , ui.button "danger"
                                                [ HE.onClick <| remove_next_part i
                                                ]
                                                [ ui.icon "remove"
                                                , H.text "Remove this next part option"
                                                ]
                                            , H.fieldset [] <| List.concat
                                                [ next_part_field
                                                    { id = "rawLabel"
                                                    , label = "Label"
                                                    , help = Just "label"
                                                    }
                                                    text_property
                                                , next_part_field
                                                    { id = "lockAfterLeaving"
                                                    , label = "Lock this part?"
                                                    , help = Just "locking after leaving this part"
                                                    }
                                                    boolean_property
                                                , labelled_field
                                                    ui
                                                    { id = npprefix_id "availabilityCondition"
                                                    , label = "Availability"
                                                    , help = Just "availability condition"
                                                    , settings = npfield "availabilityCondition"
                                                    , setter = ChangePartSetting CustomisableFinalSetting >> pmsg
                                                    }
                                                    (select_or_custom_property custom_availabilityCondition availabilityConditions [])
                                                , visibleIf custom_availabilityCondition <|
                                                    next_part_field
                                                        { id = "availabilityCondition"
                                                        , label = "Available if"
                                                        , help = Just "expression for availability"
                                                        }
                                                        text_property
                                                , next_part_field
                                                    { id = "penalty"
                                                    , label = "Penalty to apply when visited"
                                                    , help = Just "penalty for visiting"
                                                    }
                                                    (select_property <| ("","")::explore_penalty_options)
                                                , visibleIf (penalty /= "") <| List.concat
                                                    [ next_part_field
                                                        { id = "penaltyAmount"
                                                        , label = "Amount of penalty"
                                                        , help = Just "penalty amount"
                                                        }
                                                        text_property
                                                    , next_part_field
                                                        { id = "showPenaltyHint"
                                                        , label = "Show penalty hint?"
                                                        , help = Just "penalty hint"
                                                        }
                                                        boolean_property
                                                    ]
                                                ]
                                            , H.fieldset [] <| List.concat
                                                [ [H.legend [] [H.text "Variable replacements"]]
                                                , if variable_replacements == [] then
                                                    [ H.p [ HA.class "nothing-here" ] [H.text "No variable replacements have been defined for this next part option."] ]
                                                  else
                                                    [ H.table
                                                        []
                                                        [ H.colgroup
                                                            []
                                                            [ H.col [HA.class "name"] []
                                                            , H.col [HA.class "value"] []
                                                            , H.col [HA.class "controls"] []
                                                            ]
                                                        , H.thead
                                                            []
                                                            [ H.tr []
                                                                [ H.th [] [H.text "Variable"]
                                                                , H.th [] [H.text "Value"]
                                                                , H.td [] []
                                                                ]
                                                            ]
                                                        , H.tbody
                                                            []
                                                            (variable_replacements |> List.map (\(vi, vrat, _) -> 
                                                                let
                                                                    vrsettings = S.at vrat npsettings
                                                                    vrcomputed = S.at vrat npcomputed

                                                                    variable = S.getters.string (S.atField "variable" vrsettings)

                                                                    definition = S.getters.string (S.atField "definition" vrsettings)

                                                                    vr_prefix_id id = npprefix_id <| "variable-replacement-"++(fi i)++"-"++id

                                                                    custom_definition =
                                                                        S.get
                                                                            JD.bool
                                                                            (not <| List.member (Just definition) (List.map first <| dropRight 1 definitions))
                                                                            (S.atField "availabilityCondition" part.computed)

                                                                    gap_definitions = 
                                                                        gaps
                                                                        |> List.indexedMap (\gi gap -> 
                                                                            let
                                                                                gpath = path ++ [(Gap, gi)]

                                                                                gname = part_name gpath gap
                                                                            in
                                                                                (Just <| "interpreted_answer["++(fi gi)++"]", "Student's answer to \"" ++ gname ++ "\"")
                                                                          )

                                                                    definitions =
                                                                        [ (Just "interpreted_answer", "Student's answer to this part") ]
                                                                        ++ gap_definitions
                                                                        ++
                                                                        [ (Just "credit", "Credit awarded")
                                                                        , (Nothing, "JME expression")
                                                                        ]
                                                                in
                                                                    H.tr
                                                                        []
                                                                        [ H.td [HA.class "monospace"] [H.text variable]
                                                                        , H.td [] <| List.concat
                                                                            [ unlabelled_field
                                                                                ui
                                                                                { id = vr_prefix_id "definition"
                                                                                , label = "Value for replaced value of "++variable
                                                                                , help = Nothing
                                                                                , settings = S.atField "definition" vrsettings
                                                                                , setter = ChangePartSetting CustomisableFinalSetting >> pmsg
                                                                                }
                                                                                (select_or_custom_property custom_definition definitions)
                                                                            , visibleIf custom_definition <|
                                                                                unlabelled_field
                                                                                    ui
                                                                                    { id = vr_prefix_id "definition-jme"
                                                                                    , label = "JME expression for replaced value of "++variable
                                                                                    , help = Nothing
                                                                                    , settings = S.atField "definition" vrsettings
                                                                                    , setter = pset
                                                                                    }
                                                                                    custom_text_property
                                                                            ]
                                                                        , H.td []
                                                                            [ ui.button "danger"
                                                                                [ HE.onClick <| remove_variable_replacement vi
                                                                                , Aria.label <| "Remove replacement of variable " ++ variable
                                                                                ]
                                                                                [ ui.icon "remove"
                                                                                ]
                                                                            ]
                                                                        ]
                                                            ))
                                                      ]
                                                    ]
                                                , visibleIf (unreplaced_variables /= []) <|
                                                    ui.dropdown 
                                                        "add-variable-replacement" 
                                                        [ ui.icon "add"
                                                        , H.text "Add a variable replacement"
                                                        ]
                                                        (unreplaced_variables |> List.map (\name -> 
                                                            H.li
                                                                []
                                                                [ ui.button "monospace"
                                                                    [ HE.onClick <| add_variable_replacement name
                                                                    , HA.attribute "command" "hide-popover"
                                                                    , HA.attribute "commandfor" "add-variable-replacement-menu"
                                                                    ]
                                                                    [ H.text name ]
                                                                ]
                                                        ))
                                                ]
                                            ]

                                  )
                                , visibleIf (top_parts /= []) <|
                                    ui.dropdown
                                        "add-next-part"
                                        [ ui.icon "add"
                                        , H.text "Add a next part option"
                                        ]
                                        (top_parts |> List.indexedMap (\j (ppath, pp) ->
                                            H.li
                                                []
                                                [ ui.button "monospace"
                                                    [ HE.onClick <| add_next_part j
                                                    , HA.attribute "command" "hide-popover"
                                                    , HA.attribute "commandfor" "add-next-part-menu"
                                                    ]
                                                    [ H.text <| part_name ppath pp ]
                                                ]
                                        ))
                                ]
                            , attributes = []
                            }
                        }

                control_buttons =
                    [ (part.type_.name == "gapfill", ui.button "xs"
                        [ HE.onClick (StartAddingPart path Gap)
                        , HA.attribute "commandfor" "add-part"
                        , HA.attribute "command" "show-modal"
                        ]
                        [ ui.icon "add"
                        , H.text "Add a gap"
                        ]
                      )
                    , (parts_mode == AllPartsMode && is_top_level && part.type_.has_marks, ui.button "xs"
                        [ HE.onClick (StartAddingPart path Step)
                        , HA.attribute "commandfor" "add-part"
                        , HA.attribute "command" "show-modal"
                        ]
                        [ ui.icon "add"
                        , H.text "Add a step"
                        ]
                      )
                    , (part.type_.has_marks && not is_alternative, ui.button "xs"
                        [ HE.onClick (
                            let
                                settings = part.settings

                                nsettings =
                                    settings
                                    |> S.setAt [S.field "marks"] (JE.string "")
                                    |> S.setAt [S.field "customName"] (JE.string "")

                                npart = { part | settings = nsettings, children = empty_part_container }
                            in
                                UpdateQuestion <| AddPart path Alternative npart
                          )
                        ]
                        [ H.text "Add an alternative"
                        ]
                      )
                    , (True, ui.button "danger sm"
                        [ HE.onClick (DeletePart path |> UpdateQuestion)
                        , HA.class "btn danger sm"
                        ]
                        [ H.text "Delete this part" ]
                      )
                    ]
                    |> List.filter first
                    |> List.map second

                pview =
                    { contents = 
                        [ H.header
                            []
                            [ H.h3 
                                []
                                [ H.input 
                                    [ HA.value <| pstring "customName"
                                    , HA.placeholder <| part_name path part
                                    , HE.onInput <| (S.setters (pfield "customName") pset).string
                                    ]
                                    []
                                ]
                            , H.small [ HA.class "muted" ] [H.text part.type_.nice_name]
                            , H.div
                                [ HA.class "part-controls" ]
                                control_buttons
                            ]
                        , view_tablist part_tabber []
                        , view_tabpanel part_tabber
                        ]
                    , attributes = [ HA.class "part" ]
                    }


            in
                { id = part_tab_id path
                , label = HtmlLabel
                    { button_contents =
                        [ mathjax_span <| part_name path part
                        , H.text " "
                        , H.small [] [H.text part.type_.nice_name]
                        ]
                    , button_attributes =
                        [ HA.classList 
                            [ ("step", is_step)
                            , ("indented", not is_top_level)
                            ]
                        ]
                    , extra_contents = []
                    }
                , icon = Nothing
                , view = pview
                }

        used_extensions = 
            S.get (JD.list JD.string) [] (S.atField "extensions" question.settings)
            |> Set.fromList

        extensions_tab =
            let
                toggle_extension : Extension -> Bool -> Msg
                toggle_extension extension use = 
                    used_extensions
                    |> (if use then Set.insert else Set.remove) extension.location
                    |> Set.toList
                    |> JE.list JE.string
                    |> (\v -> ChangeQuestionSetting FinalSetting (v, [S.field "extensions"]) |> UpdateQuestion)

                shown_extensions = FilterList.filter
                    (\extension -> [extension.name, extension.location])
                    model.extensions
                    model.extension_search

                (searched_extensions, other_extensions) =
                    model.extensions
                    |> List.partition (\e -> List.member e shown_extensions)

                view_extension extension =
                    let
                        id = "use-extension-"++(fi extension.pk)
                    in
                        [ H.a
                              [ HA.href extension.url
                              , Aria.label <| "Documentation for the " ++ extension.name ++ " extension"
                              , HA.title <| "Documentation for the " ++ extension.name ++ " extension"
                              , HA.target "help"
                              ]
                              [ ui.icon "help" ]
                        , H.text " "
                        , H.a
                              [ HA.href extension.edit_url
                              , Aria.label <| "Edit the " ++ extension.name ++ " extension"
                              , HA.title <| "Edit the " ++ extension.name ++ " extension"
                              , HA.target "_blank"
                              ]
                              [ ui.icon "pencil" ]
                        ]

                extension_toggle_list = 
                    Ui.toggle_list
                        { id_for = \e -> "use-extension-"++(fi e.pk)
                        , label_for = .name
                        , is_checked = \e -> Set.member e.location used_extensions
                        , toggle = toggle_extension
                        , view_item = view_extension
                        }
                        ui
            in
                { contents = List.concat
                    [ [ ui.help_block 
                        [ ui.helplink "question-extensions" "extensions"
                        , H.text "Select extensions to use in this question."
                        ]
                      , H.label
                        [ HA.for "extension-search" ]
                        [ H.text "Search for an extension" ]
                      , H.text " "
                      , H.input
                        [ HA.type_ "search"
                        , HA.id "extension-search"
                        , HA.value <| FilterList.get_query model.extension_search
                        , HE.onInput SetExtensionSearch
                        ]
                        []
                      ]
                    , case searched_extensions of
                        [] -> []
                        _ -> 
                            [ extension_toggle_list searched_extensions
                            , H.hr [] []
                            ]
                    , [ extension_toggle_list other_extensions ]
                    ]
                , attributes = []
                }

        constants_tab =
            let
                builtin_constants : List BuiltinConstant
                builtin_constants = JD.decodeValue
                    (JD.at ["jme", "builtin_constants"] (
                        JD.succeed BuiltinConstant
                        |> andMap (JD.field "name" JD.string)
                        |> andMap (JD.field "tex" JD.string)
                        |> andMap (JD.field "value" JD.value)
                        |> andMap (JD.oneOf [JD.field "enabled" JD.bool, JD.succeed True])
                        |> JD.list
                    ))
                    model.numbas
                    |> Result.withDefault []

                default_used_builtin_constants =
                    builtin_constants
                    |> List.filter .enabled
                    |> List.map .name
                    |> List.concatMap (String.split ",")
                    |> Set.fromList

                used_builtin_constants : Set String
                used_builtin_constants = 
                    S.get
                        (   JD.dict JD.bool
                         |> JD.map (Dict.toList >> List.map first >> List.concatMap (String.split ",") >> Set.fromList)
                        ) 
                        default_used_builtin_constants
                        (S.atField "builtin_constants" question.settings)

                builtin_constant_descriptions = Dict.fromList
                    [ ("e", "Base of the natural logarithm")
                    , ("pi", "Ratio of a circle's perimeter to its diameter")
                    , ("i", "$\\sqrt{-1}$")
                    ]

                toggle_builtin_constant constant use =
                    used_builtin_constants
                    |> (if use then Set.insert else Set.remove) constant.name
                    |> Set.toList
                    |> List.map (\v -> (v, JE.bool True))
                    |> JE.object
                    |> (\v -> ChangeQuestionSetting FinalSetting (v, [S.field "builtin_constants"]) |> UpdateQuestion)

                custom_constants = S.getters.list (qfield "constants")

                set_custom_constants list = 
                    ChangeQuestionSetting FinalSetting (list |> JE.list identity, [S.field "constants"])
                    |> UpdateQuestion

                add_custom_constant = set_custom_constants (custom_constants ++ [JE.null])
            in
                { contents = 
                    [ H.fieldset
                        [ HA.class "vertical" ]
                        [ H.legend [] [H.text "Built-in constants"]
                        , ui.help_block [ H.text "Tick the built-in constants you wish to include in this question." ]
                        , Ui.toggle_list
                            { id_for = \c -> "use-builtin-constant-"++c.name
                            , label_for = .name
                            , is_checked = .name >> String.split "," >> List.any (\n -> Set.member n used_builtin_constants)
                            , toggle = toggle_builtin_constant
                            , view_item = \c -> []
                            }
                            ui
                            builtin_constants
                        ]
                    , H.fieldset [ HA.class "vertical" ] <| List.concat
                        [ [ H.legend [] [H.text "Custom constants"]
                          , ui.help_block [ H.text "Define other constants used in this question. You can define constants in terms of the built-in constants, even if they're disabled." ]
                          ]
                        , visibleIf (custom_constants /= [])
                            [ H.table
                                [ HA.id "custom-constants"]
                                [ H.thead []
                                    [ H.tr []
                                        [ H.th [] [H.text "Names"]
                                        , H.th [] [H.text "Value"]
                                        , H.th [] [H.text "LaTeX"]
                                        , H.th [] []
                                        ]
                                    ]
                                , H.tbody [] (custom_constants |> List.indexedMap (\i constant ->
                                    let
                                        cprefix_id id = "custom-constant-" ++ (fi i) ++ "-" ++ id

                                        cat = [S.field "constants", S.index i]

                                        csettings = S.at cat question.settings
                                    in
                                        H.tr []
                                            [ H.td [] 
                                                (text_property
                                                    ui
                                                    { id = cprefix_id "name"
                                                    , label = ""
                                                    , help = Nothing
                                                    , settings = csettings |> S.atField "name"
                                                    , setter = qset
                                                    }
                                                )
                                                -- TODO nameError
                                            , H.td [] 
                                                (jme_property
                                                    { notation = "standard" }
                                                    ui
                                                    { id = cprefix_id "value"
                                                    , label = ""
                                                    , help = Nothing
                                                    , settings = csettings |> S.atField "value"
                                                    , setter = qset
                                                    }
                                                )
                                            , H.td [] 
                                                (latex_property
                                                    ui
                                                    { id = cprefix_id "tex"
                                                    , label = ""
                                                    , help = Nothing
                                                    , settings = csettings |> S.atField "tex"
                                                    , setter = qset
                                                    }
                                                )
                                            , H.td []
                                                [ ui.button "danger xs"
                                                    [ HE.onClick <| set_custom_constants <| LE.removeAt i custom_constants
                                                    ]
                                                    [ ui.icon "remove"
                                                    , H.text "Delete this constant"
                                                    ]
                                                ]
                                            ]
                                    ))
                                ]
                            ]
                        , [ ui.button "primary"
                            [ HE.onClick add_custom_constant
                            ]
                            [ ui.icon "add"
                            , H.text "Add a constant"
                            ]
                          ]
                        ]
                    ]
                , attributes = []
                }

        rulesets_tab =
            let
                rulesets : List JE.Value
                rulesets = S.getters.list (S.atField "rulesets" question.computed)

                set_rulesets list = ChangeQuestionSetting ComputedSetting (JE.list identity list, [S.field "rulesets"]) |> UpdateQuestion

                add_ruleset =
                    (rulesets ++ [JE.null])
                    |> set_rulesets

                rcomputed =
                    question.computed
                    |> S.insert "rulesets" (JE.list identity rulesets)
            in
                { contents = List.concat
                    [ [ ui.help_block 
                        [ ui.helplink "rulesets" "rulesets"
                        , H.text "Define rulesets for simplification and display of mathematical expressions."
                        ]
                      ]
                    , visibleIf (rulesets /= [])
                        [ H.table
                            [ HA.id "rulesets" ]
                            [ H.thead
                                []
                                [ H.tr
                                    []
                                    [ H.th [] [H.text "Name"]
                                    , H.th [] [H.text "Definition"]
                                    , H.th [] []
                                    ]
                                ]
                            , H.tbody [] (rulesets |> List.indexedMap (\i ruleset ->
                                let
                                    rprefix_id id = "ruleset-" ++ (fi i) ++ "-" ++ id
                                    rsettings = 
                                        rcomputed
                                        |> S.at [S.field "rulesets", S.index i]

                                    rset = ChangeQuestionSetting ComputedSetting >> UpdateQuestion
                                in
                                    H.tr
                                        []
                                        [ H.td
                                            []
                                            (text_property
                                                ui
                                                { id = rprefix_id "name"
                                                , label = ""
                                                , help = Nothing
                                                , settings = rsettings |> S.atField "name"
                                                , setter = rset
                                                }
                                            )
                                        , H.td
                                            []
                                            (text_property
                                                ui
                                                { id = rprefix_id "definition"
                                                , label = ""
                                                , help = Nothing
                                                , settings = rsettings |> S.atField "definition"
                                                , setter = rset
                                                }
                                            )
                                        , H.td [] 
                                            [ ui.button "danger xs"
                                             [ HE.onClick <| set_rulesets <| LE.removeAt i rulesets ]
                                             [ ui.icon "remove"
                                             , H.text "Delete this ruleset"
                                             ]
                                            ]
                                        ]
                                ))
                            ]
                        ]
                    , [ ui.button "primary"
                        [ HE.onClick add_ruleset
                        ]
                        [ ui.icon "add"
                        , H.text "Add a ruleset"
                        ]
                      ]
                    ]
                , attributes = []
                }

        functions_tab =
            let
                functions = S.getters.list (S.atField "functions" question.settings)

                set_functions = S.setList qset identity (S.atField "functions" question.settings) 

                add_function = AddFunction |> UpdateQuestion

                remove_function i = set_functions <| LE.removeAt i functions

                function_tabs = functions |> List.indexedMap (\i function ->
                    let
                        fsettings = S.at [S.field "functions", S.index i] question.settings
                        fcomputed = S.at [S.field "functions", S.index i] question.computed

                        ffield k = S.atField k fsettings

                        function_field o = 
                            labelled_field
                                ui
                                { id = fprefix_id o.id
                                , label = o.label
                                , help = Nothing
                                , settings = ffield o.id
                                , setter = qset
                                }

                        name = S.getters.string (ffield "name")

                        fprefix_id id = "function-" ++ (fi i) ++ "-" ++ id

                        parameters = S.getters.list (S.atField "parameters" fsettings)

                        set_parameters = S.setList qset identity (S.atField "parameters" fsettings)

                        add_parameter = set_parameters <| parameters++[JE.null]

                        remove_parameter pi = set_parameters <| LE.removeAt pi parameters

                        type_options = 
                            (("?", "anything")::(List.map (\t -> (t,t)) model.jme_types))
                            |> LE.unique
                            |> List.sort

                        fview =
                            { contents = 
                                [ H.fieldset [HA.class "vertical"] <| List.concat
                                    [ [ ui.button "danger"
                                        [ HE.onClick <| remove_function i ]
                                        [ ui.icon "remove"
                                        , H.text "Delete this function"
                                        ]
                                      ]
                                    , function_field
                                        { id = "name"
                                        , label = "Name"
                                        }
                                        text_property
                                    , visibleIf (parameters /= [])
                                        [ H.table
                                            [ HA.class "parameters" ]
                                            [ H.caption [] [H.text "Parameters"]
                                            , H.thead []
                                                [ H.tr []
                                                    [ H.th [] [H.text "Name"]
                                                    , H.th [] [H.text "Type"]
                                                    , H.th [] []
                                                    ]
                                                ]
                                            , H.tbody [] (parameters |> List.indexedMap (\pi parameter ->
                                                let
                                                    psettings = S.at [S.field "parameters", S.index pi] fsettings
                                                    pcomputed = S.at [S.field "parameters", S.index pi] fcomputed

                                                    pprefix_id id = fprefix_id <| "parameter-"++(fi pi)++"-"++id

                                                    type_ = S.getters.string (S.atField "type" psettings)

                                                    is_custom_type =
                                                        S.get
                                                            JD.bool
                                                            (not <| List.member type_ <| List.map first type_options)
                                                            (S.atField "type" pcomputed)
                                                in
                                                    H.tr []
                                                        [ H.td []
                                                            (text_property
                                                                ui
                                                                { id = pprefix_id "name"
                                                                , label = "Name"
                                                                , help = Nothing
                                                                , settings = S.atField "name" psettings
                                                                , setter = qset
                                                                }
                                                            )
                                                        , H.td [] <| List.concat
                                                            [ (select_or_custom_property is_custom_type
                                                                ((type_options |> List.map (\(t,l) -> (Just t,l)))++[(Nothing, "custom")])
                                                                []
                                                                ui
                                                                { id = pprefix_id "type"
                                                                , label = "Type"
                                                                , help = Nothing
                                                                , settings = S.atField "type" psettings
                                                                , setter = ChangeQuestionSetting CustomisableFinalSetting >> UpdateQuestion
                                                                }
                                                              )
                                                            , visibleIf is_custom_type
                                                                (text_property
                                                                    ui
                                                                    { id = pprefix_id "customType"
                                                                    , label = "Custom type"
                                                                    , help = Nothing
                                                                    , settings = S.atField "customType" psettings
                                                                    , setter = qset
                                                                    }
                                                                )
                                                            ]
                                                        , H.td []
                                                            [ ui.button "danger xs"
                                                                [ HE.onClick <| remove_parameter pi ]
                                                                [ ui.icon "remove"
                                                                , H.text "Delete this parameter"
                                                                ]
                                                            ]
                                                        ]
                                                ))
                                            ]
                                        ]
                                    , [ ui.button "default"
                                        [ HE.onClick add_parameter ]
                                        [ ui.icon "add"
                                        , H.text "Add a parameter"
                                        ]
                                      ]
                                    , function_field
                                        { id = "outtype"
                                        , label = "Output type"
                                        }
                                        (select_property (type_options))
                                    , function_field
                                        { id = "language"
                                        , label = "Language"
                                        }
                                        (select_property 
                                            [ ("jme", "JME")
                                            , ("javascript", "JavaScript")
                                            ]
                                        )
                                    , function_field
                                        { id = "definition"
                                        , label = "Definition"
                                        }
                                        code_property
                                    ]
                                ]
                            , attributes = []
                            }
                    in
                        { id = function_tab_id i
                        , label = SimpleLabel <| if String.trim name /= "" then name else "Unnamed function"
                        , icon = Nothing
                        , view = fview
                        }
                    )

                functions_tabber =
                    { name = "functions"
                    , allow_empty = True
                    , tabs = function_tabs
                    }
            in
                { contents = 
                    [ H.nav
                        [ HA.id "functions" ]
                        [ H.h2 [] [ H.text "Functions" ]
                        , view_tablist functions_tabber [HA.class "vertical"]
                        , ui.button "primary"
                            [ HE.onClick add_function ]
                            [ ui.icon "add"
                            , H.text "Add a function"
                            ]
                        ]
                    , view_tabpanel functions_tabber
                    ]
                , attributes = [ HA.class "tabbed-sidebar" ]
                }

        preamble_tab =
            { contents = [] -- TODO
            , attributes = []
            }

        extensions_tabber =
            { name = "parts"
            , allow_empty = True
            , tabs = 
                [ { id = "extensions"
                  , label = SimpleLabel "Extensions"
                  , icon = Nothing
                  , view = extensions_tab
                  }
                , { id = "constants"
                  , label = SimpleLabel "Constants"
                  , icon = Nothing
                  , view = constants_tab
                  }
                , { id = "rulesets"
                  , label = SimpleLabel "Rulesets"
                  , icon = Nothing
                  , view = rulesets_tab
                  }
                , { id = "functions"
                  , label = SimpleLabel "Functions"
                  , icon = Nothing
                  , view = functions_tab
                  }
                , { id = "preamble"
                  , label = SimpleLabel "Preamble"
                  , icon = Nothing
                  , view = preamble_tab
                  }
                ]
            }

        extensions_scripts_tab : TabView Msg
        extensions_scripts_tab = 
            { contents = 
                [ H.nav
                    []
                    [ view_tablist extensions_tabber []
                    ]
                , view_tabpanel extensions_tabber
                ]
            , attributes = []
            }
        


        view_tablist : Tabber Msg -> List (H.Attribute Msg) -> Html Msg
        view_tablist = Tabber.view_tablist ui UpdateTab model.tab_state

        view_tabpanel : Tabber Msg -> Html Msg
        view_tabpanel = Tabber.view_tabpanel ui model.tab_state

        icon = ui.icon

        saving_class = case model.saving of
            Saved _ -> "saved"
            Changed -> "changed"
            Saving _ -> "saving"

        ready_to_download = Ok () -- TODO
    in
        H.main_
            [ HA.id "loaded-content" ]
            [ H.header
                []
                [ H.ol
                    [ HA.id "location"
                    , HA.class "list-inline"
                    ]
                    ((H.li 
                        [ HA.class "project" ]
                        [ icon "project"
                        , H.a
                            [ HA.href model.project.url ]
                            [ H.text model.project.name ]
                        ]
                     )
                     :: (model.project.breadcrumbs |> List.map (\folder -> H.li [ HA.class "folder" ] [ H.a [HA.href folder.url] [H.text folder.name] ]))
                    )
                , H.h1
                    []
                    [ icon "question"
                    , mathjax_span (S.getters.string (qfield "name"))
                    ]
                , H.hr [] []
                , H.span
                    [ HA.class saving_class
                    , HA.id "saving"
                    ]
                    [ H.text <| case model.saving of
                        Saved _ -> "Saved"
                        Changed -> "Unsaved changes"
                        Saving _ -> "Saving..."
                    ]
                , ui.button ""
                    [ HA.disabled <| not <| History.can_undo model.history
                    , HE.onClick Undo
                    ]
                    [ ui.icon "undo"
                    , H.text "Undo"
                    ]
                , ui.button ""
                    [ HA.disabled <| not <| History.can_redo model.history
                    , HA.type_ "button"
                    , HE.onClick Redo
                    ]
                    [ ui.icon "redo"
                    , H.text "Redo"
                    ]
                ]
            , H.nav
                [ HA.id "tabs"]
                (( H.a
                    [ HA.class "btn success"
                    , HA.href model.preview.url
                    , HA.target model.preview.target
                    , HA.title "Run this question in a new window"
                    ]
                    [ icon "play"
                    , H.text " Run"
                    ]
                )
                ::(ui.dropdown
                    "organisation" 
                    [ H.text "Organisation"
                    ]
                    [ H.li 
                        [] 
                        [ H.a
                            [ HA.class "warning"
                            , HA.href model.urls.copy
                            , HA.target "_blank"
                            ]
                            [ icon "copy"
                            , H.text "Make a copy"
                            ]
                        ]
                    , H.li 
                        [] 
                        [ H.a
                            [ HA.class "danger"
                            , HA.href model.urls.delete
                            ]
                            [ icon "remove"
                            , H.text "Delete"
                            ]
                        ]
                    , H.hr [] []
                    , H.li 
                        [] 
                        [ H.a
                            [ HA.class "add-to-queue"
                            , HA.href "#"
                            , HA.attribute "data-question-id" (fi model.pk)
                            ]
                            [ icon "list"
                            , H.text "Add to a queue"
                            ]
                        ]
                    , H.li 
                        [] 
                        [ H.a
                            [ HA.class "add-to-queue"
                            , HA.href "#"
                            , HA.attribute "data-question-id" (fi model.pk)
                            ]
                            [ icon "basket"
                            , H.text "Add to your basket"
                            ]
                        ]
                    ]
                )
                ++(ui.dropdown
                    "download" 
                    [ icon "download"
                    , H.text "Download"
                    ]
                    [ case ready_to_download of
                        Ok _ ->
                            H.li
                                [ HA.class "alert success" ]
                                [ icon "ok"
                                , H.text "This question is ready to download."
                                ]
                        Err err ->
                            H.li
                                [ HA.class "alert danger" ]
                                [ icon "danger"
                                , H.text "This question might need some attention: "
                                , err
                                ]
                    , H.li
                        []
                        [ H.a
                            [ HA.href <| model.urls.download ++ "?scorm=true&token="++model.share.view
                            ]
                            [ icon "package"
                            , H.text "SCORM package"
                            ]
                        ]
                    , H.li
                        []
                        [ H.a
                            [ HA.href <| model.urls.download ++ "?token="++model.share.view
                            ]
                            [ icon "package"
                            , H.text "standalone .zip (no SCORM)"
                            ]
                        ]
                    , H.li
                        []
                        [ H.a
                            [ HA.href <| model.urls.source ++ "?token="++model.share.view
                            ]
                            [ icon "file"
                            , H.text "source"
                            ]
                        ]
                    ]
                )
                ++[ view_tablist main_tabber []
                ]
                )
            , view_tabpanel main_tabber
            ]


subscriptions : Model -> Sub Msg
subscriptions _ = Sub.batch
    [ answer_numbas AnswerNumbas ]
