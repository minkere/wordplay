import {
    BIND_SYMBOL,
    BORROW_SYMBOL,
    CHANGE_SYMBOL,
    COMMA_SYMBOL,
    CONVERT_SYMBOL,
    DIFFERENCE_SYMBOL,
    DOCS_SYMBOL,
    ETC_SYMBOL,
    EVAL_CLOSE_SYMBOL,
    EVAL_OPEN_SYMBOL,
    EXCEPTION_SYMBOL,
    EXPONENT_SYMBOL,
    FUNCTION_SYMBOL,
    INITIAL_SYMBOL,
    LANGUAGE_SYMBOL,
    LINK_SYMBOL,
    LIST_CLOSE_SYMBOL,
    LIST_OPEN_SYMBOL,
    MEASUREMENT_SYMBOL,
    NATIVE_SYMBOL,
    NEVER_SYMBOL,
    NONE_SYMBOL,
    OR_SYMBOL,
    PLACEHOLDER_SYMBOL,
    PREVIOUS_SYMBOL,
    PROPERTY_SYMBOL,
    QUESTION_SYMBOL,
    SET_CLOSE_SYMBOL,
    SET_OPEN_SYMBOL,
    SOURCE_SYMBOL,
    STREAM_SYMBOL,
    SUM_SYMBOL,
    TABLE_CLOSE_SYMBOL,
    TABLE_OPEN_SYMBOL,
    TYPE_CLOSE_SYMBOL,
    TYPE_OPEN_SYMBOL,
    TYPE_SYMBOL,
    UNKNOWN_SYMBOL,
    UNPARSABLE_SYMBOL,
} from '@parser/Symbols';
import type Glyph from './Glyph';

const GlyphSet = {
    // Parsing
    Unparsable: {
        symbols: UNPARSABLE_SYMBOL,
    },
    Source: {
        symbols: SOURCE_SYMBOL,
    },
    // Names
    Language: {
        symbols: LANGUAGE_SYMBOL,
    },
    Name: {
        symbols: COMMA_SYMBOL,
    },
    Reference: {
        symbols: PROPERTY_SYMBOL,
    },
    Bind: {
        symbols: BIND_SYMBOL,
    },
    This: {
        symbols: PROPERTY_SYMBOL,
    },
    Native: {
        symbols: NATIVE_SYMBOL,
    },
    Borrow: {
        symbols: BORROW_SYMBOL,
    },
    // Functions
    Function: {
        symbols: FUNCTION_SYMBOL,
    },
    Evaluate: {
        symbols: PLACEHOLDER_SYMBOL + EVAL_OPEN_SYMBOL + EVAL_CLOSE_SYMBOL,
    },
    Conditional: {
        symbols: QUESTION_SYMBOL,
    },
    Conversion: {
        symbols: CONVERT_SYMBOL,
    },
    Insert: {
        symbols: TABLE_OPEN_SYMBOL + SUM_SYMBOL,
    },
    Select: {
        symbols: TABLE_OPEN_SYMBOL + QUESTION_SYMBOL,
    },
    Update: {
        symbols: TABLE_OPEN_SYMBOL + BIND_SYMBOL,
    },
    Delete: {
        symbols: TABLE_OPEN_SYMBOL + DIFFERENCE_SYMBOL,
    },
    // Types
    Type: {
        symbols: TYPE_SYMBOL,
    },
    Bool: {
        symbols: QUESTION_SYMBOL,
    },
    None: {
        symbols: NONE_SYMBOL,
    },
    Measurement: {
        symbols: MEASUREMENT_SYMBOL,
    },
    List: {
        symbols: LIST_OPEN_SYMBOL + LIST_CLOSE_SYMBOL,
    },
    Set: {
        symbols: SET_OPEN_SYMBOL + SET_CLOSE_SYMBOL,
    },
    Table: {
        symbols: TABLE_OPEN_SYMBOL + TABLE_CLOSE_SYMBOL,
    },
    Dimension: {
        symbols: EXPONENT_SYMBOL,
    },
    Placeholder: {
        symbols: PLACEHOLDER_SYMBOL,
    },
    Never: {
        symbols: NEVER_SYMBOL,
    },
    Unknown: {
        symbols: UNKNOWN_SYMBOL,
    },
    Union: {
        symbols: OR_SYMBOL,
    },
    VariableType: {
        symbols: TYPE_OPEN_SYMBOL + TYPE_CLOSE_SYMBOL,
    },
    Exception: {
        symbols: EXCEPTION_SYMBOL,
    },
    // Input
    Stream: {
        symbols: STREAM_SYMBOL,
    },
    Previous: {
        symbols: PREVIOUS_SYMBOL,
    },
    Change: {
        symbols: CHANGE_SYMBOL,
    },
    Initial: {
        symbols: INITIAL_SYMBOL,
    },
    // Documentation
    Doc: {
        symbols: DOCS_SYMBOL,
    },
    Link: {
        symbols: LINK_SYMBOL,
    },
    Words: {
        symbols: ETC_SYMBOL,
    },
    Paragraph: {
        symbols: '¶',
    },
} as const;

// A little TypeScript hackery to type based on the keys of the literal above.
const Glyphs: Readonly<Record<keyof typeof GlyphSet, Readonly<Glyph>>> =
    GlyphSet;

export default Glyphs;
