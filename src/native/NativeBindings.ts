import Alias from "../nodes/Alias";
import type NativeInterface from "./NativeInterface";
import FunctionDefinition from "../nodes/FunctionDefinition";
import NativeExpression from "./NativeExpression";
import type Context from "../nodes/Context";
import type Type from "../nodes/Type";
import ConversionDefinition from "../nodes/ConversionDefinition";
import Text from "../runtime/Text";
import List from "../runtime/List";
import MapValue from "../runtime/MapValue";
import SetValue from "../runtime/SetValue";
import type Documentation from "../nodes/Documentation";
import TypeVariable from "../nodes/TypeVariable";
import Bind from "../nodes/Bind";
import Value from "../runtime/Value";
import NameType from "../nodes/NameType";
import ListType from "../nodes/ListType";
import type Evaluation from "../runtime/Evaluation";
import FunctionType from "../nodes/FunctionType";
import NativeHOFListTranslate from "./NativeHOFListTranslate";
import NativeHOFListFilter from "./NativeHOFListFilter";
import NativeHOFListAll from "./NativeHOFListAll";
import BooleanType from "../nodes/BooleanType";
import NativeHOFListUntil from "./NativeHOFListUntil";
import NativeHOFListFind from "./NativeHOFListFind";
import UnionType from "../nodes/UnionType";
import NoneType from "../nodes/NoneType";
import NativeHOFListCombine from "./NativeHOFListCombine";
import NativeHOFSetFilter from "./NativeHOFSetFilter";
import NativeHOFMapFilter from "./NativeHOFMapFilter";
import NativeHOFMapTranslate from "./NativeHOFMapTranslate";
import MeasurementType from "../nodes/MeasurementType";
import TextType from "../nodes/TextType";
import SetType from "../nodes/SetType";
import MapType from "../nodes/MapType";
import StructureDefinition from "../nodes/StructureDefinition";
import Block from "../nodes/Block";
import { BOOLEAN_NATIVE_TYPE_NAME, LIST_NATIVE_TYPE_NAME, LIST_TYPE_VAR_NAME, MAP_KEY_TYPE_VAR_NAME, MAP_NATIVE_TYPE_NAME, MAP_VALUE_TYPE_VAR_NAME, MEASUREMENT_NATIVE_TYPE_NAME, NONE_NATIVE_TYPE_NME, SET_NATIVE_TYPE_NAME, SET_TYPE_VAR_NAME, TEXT_NATIVE_TYPE_NAME } from "./NativeConstants";
import AnyType from "../nodes/AnyType";
import TypeException from "../runtime/TypeException";
import type Bool from "../runtime/Bool";
import type None from "../runtime/None";
import type Measurement from "../runtime/Measurement";

class NativeBindings implements NativeInterface {

    readonly functionsByType: Record<string, Record<string, FunctionDefinition>> = {};
    readonly conversionsByType: Record<string, ConversionDefinition[]> = {};
    readonly structureDefinitionsByName: Record<string, StructureDefinition> = {};

    addFunction(
        kind: string,
        fun: FunctionDefinition
    ) {

        if(!(kind in this.functionsByType))
            this.functionsByType[kind] = {};

        fun.aliases.forEach(a => {
            const name = a.getName();
            if(name !== undefined)
                this.functionsByType[kind][name] = fun
        });

    }

    addNativeFunction(
        kind: string, 
        docs: Documentation[], 
        aliases: Alias[], 
        typeVars: TypeVariable[], 
        inputs: Bind[], 
        output: Type,
        evaluator: (evaluator: Evaluation) => Value) {
        
        this.addFunction(kind, new FunctionDefinition(
            docs, aliases, typeVars, inputs,
            new NativeExpression(output, evaluator),
            output
        ));

    }

    addConversion(kind: string, docs: Documentation[], type: string, expected: Type, fun: Function) {

        if(!(kind in this.conversionsByType))
            this.conversionsByType[kind] = [];

        this.conversionsByType[kind].push(
            new ConversionDefinition(
                docs, type,
                new NativeExpression(
                    type,
                    evaluation => {
                        const val = evaluation.getContext();
                        if(val instanceof Value && val.getType().constructor === expected.constructor) return fun.call(undefined, val);
                        else return new TypeException(evaluation.getEvaluator(), expected, val); 
                    }
                )
            )
        );
    }

    addStructure(kind: string, structure: StructureDefinition) {

        // Cache the parents of the nodes, "crystalizing" it.
        // This means there should be no future changes to the native structure definition.
        structure.cacheParents();
        this.structureDefinitionsByName[kind] = structure;
    }
    
    getConversion(kind: string, context: Context, type: Type): ConversionDefinition | undefined {
        if(!(kind in this.conversionsByType)) return undefined;
        return this.conversionsByType[kind].find(c => c.convertsType(type, context));
    }
    
    getFunction(kind: string, name: string): FunctionDefinition | undefined {
        if(!(kind in this.functionsByType)) return undefined;
        return this.functionsByType[kind][name];
    }

    getStructureDefinition(kind: string): StructureDefinition | undefined {
        return this.structureDefinitionsByName[kind];
    }

}

const Native = new NativeBindings();

// TODO Documentation
Native.addNativeFunction(TEXT_NATIVE_TYPE_NAME, [], [ new Alias("length", "eng") ], [], [], new MeasurementType(),
    evaluation => {
        const text = evaluation.getContext();
        if(text instanceof Text) return text.length();
        else return new TypeException(evaluation.getEvaluator(), new TextType(), text);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("add", "eng") ], [], 
    [
        new Bind([], undefined, [ new Alias("value", "eng"), ], new NameType(LIST_TYPE_VAR_NAME))
    ],
    new ListType(new NameType(LIST_TYPE_VAR_NAME)),
    evaluation => {
        const list = evaluation.getContext();
        const value = evaluation.resolve('value');
        if(list instanceof List && value !== undefined) return list.add(value);
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("length", "eng") ], [], [], new MeasurementType(),
    evaluation => {
        const list = evaluation.getContext();
        if(list instanceof List) return list.length();
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("random", "eng") ], [], [], new NameType(LIST_TYPE_VAR_NAME),
    evaluation => {
        const list = evaluation.getContext();
        if(list instanceof List) return list.random();
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("first", "eng") ], [], [], new NameType(LIST_TYPE_VAR_NAME),
    evaluation => {
        const list = evaluation.getContext();
        if(list instanceof List) return list.first();
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("has", "eng") ], [], 
    [ new Bind([], undefined, [ new Alias("value", "eng"), ], new NameType(LIST_TYPE_VAR_NAME)) ], 
    new BooleanType(),
    evaluation => {
        const list = evaluation.getContext();
        const value = evaluation.resolve("value");
        if(list instanceof List && value !== undefined) return list.has(value);
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("join", "eng") ], [], 
    [
        new Bind([], undefined, [ new Alias("separator", "eng"), ], new TextType())
    ], new TextType(),
    evaluation => {
        const list = evaluation.getContext();
        const separator = evaluation.resolve("separator");
        if(list instanceof List && separator instanceof Text) return list.join(separator);
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("last", "eng") ], [], [], new NameType(LIST_TYPE_VAR_NAME),
    evaluation => {
        const list = evaluation.getContext();
        if(list instanceof List) return list.last();
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("sansFirst", "eng") ], [], [], new ListType(new NameType(LIST_TYPE_VAR_NAME)),
    evaluation => {
        const list = evaluation.getContext();
        if(list instanceof List) return list.sansFirst();
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("sansLast", "eng") ], [], [], new ListType(new NameType(LIST_TYPE_VAR_NAME)),
    evaluation => {
        const list = evaluation.getContext();
        if(list instanceof List) return list.sansLast();
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("sans", "eng") ], [], 
    [
        new Bind([], undefined, [ new Alias("value", "eng"), ], new NameType(LIST_TYPE_VAR_NAME))
    ], 
    new ListType(new NameType(LIST_TYPE_VAR_NAME)),
    evaluation => {
        const list = evaluation.getContext();
        const value = evaluation.resolve("value");
        if(list instanceof List && value !== undefined) return list.sans(value);
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("sansAll", "eng") ], [], 
    [
        new Bind([], undefined, [ new Alias("value", "eng") ], new NameType(LIST_TYPE_VAR_NAME))
    ], 
    new ListType(new NameType(LIST_TYPE_VAR_NAME)),
    evaluation => {
        const list = evaluation.getContext();
        const value = evaluation.resolve("value");
        if(list instanceof List && value !== undefined) return list.sansAll(value);
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
Native.addNativeFunction(LIST_NATIVE_TYPE_NAME, [], [ new Alias("reverse", "eng") ], [], [], new ListType(new NameType(LIST_TYPE_VAR_NAME)),
    evaluation => {
        const list = evaluation.getContext();
        if(list instanceof List) return list.reverse();
        else return new TypeException(evaluation.getEvaluator(), new ListType(), list);
    }
);

// TODO Documentation
const listTranslateHOFType = new FunctionType([ 
    new Bind(
        [],
        undefined,
        [ new Alias("value", "eng") ],
        new NameType(LIST_TYPE_VAR_NAME)
    )
], new AnyType());

Native.addFunction(LIST_NATIVE_TYPE_NAME, new FunctionDefinition(
    [], 
    [ new Alias("translate", "eng") ], 
    [], 
    [
        new Bind([], undefined, [ new Alias("translator", "eng")], listTranslateHOFType)
    ],
    new NativeHOFListTranslate(listTranslateHOFType),
    new ListType(new NameType(LIST_TYPE_VAR_NAME))
));

// TODO Documentation
const listFilterHOFType = new FunctionType([ 
    new Bind(
        [], 
        undefined, 
        [ new Alias("value", "eng") ],
        new NameType(LIST_TYPE_VAR_NAME)
    )
], new BooleanType());

Native.addFunction(LIST_NATIVE_TYPE_NAME, new FunctionDefinition(
    [], 
    [ new Alias("filter", "eng") ], 
    [], 
    [
        new Bind([], undefined, [ new Alias("include", "eng")], listFilterHOFType)
    ],
    new NativeHOFListFilter(listFilterHOFType),
    new ListType(new NameType(LIST_TYPE_VAR_NAME))
));

// TODO Documentation
const listAllHOFType = new FunctionType([ 
    new Bind(
        [],
        undefined,
        [ new Alias("value", "eng") ],
        new NameType(LIST_TYPE_VAR_NAME)
    )
], new BooleanType());

Native.addFunction(LIST_NATIVE_TYPE_NAME, new FunctionDefinition(
    [], 
    [ new Alias("all", "eng") ], 
    [], 
    [
        new Bind([], undefined, [ new Alias("matcher", "eng")], listAllHOFType)
    ],
    new NativeHOFListAll(listAllHOFType),
    new BooleanType()
));

// TODO Documentation
const listUntilHOFType = new FunctionType([ 
    new Bind(
        [],
        undefined,
        [ new Alias("value", "eng") ],
        new BooleanType(),
    )
], new NameType(LIST_TYPE_VAR_NAME));

Native.addFunction(LIST_NATIVE_TYPE_NAME, new FunctionDefinition(
    [], 
    [ new Alias("until", "eng") ], 
    [], 
    [
        new Bind([], undefined, [ new Alias("checker", "eng")], listUntilHOFType)
    ],
    new NativeHOFListUntil(listUntilHOFType),
    new ListType(new NameType(LIST_TYPE_VAR_NAME))
));

// TODO Documentation
const listFindHOFType = new FunctionType([ 
    new Bind(
        [],
        undefined,
        [ new Alias("value", "eng") ],
        new BooleanType()
    )
], new NameType(LIST_TYPE_VAR_NAME));

Native.addFunction(LIST_NATIVE_TYPE_NAME, new FunctionDefinition(
    [], 
    [ new Alias("find", "eng") ], 
    [], 
    [
        new Bind([], undefined, [ new Alias("checker", "eng")], listFindHOFType)
    ],
    new NativeHOFListFind(listFindHOFType),
    new UnionType(new NameType(LIST_TYPE_VAR_NAME), new NoneType([ new Alias("notfound", "eng")]))
));

// TODO Documentation
const listCombineHOFType = new FunctionType([ 
    new Bind(
        [],
        undefined,
        [ new Alias("combination", "eng") ],
        new NameType(LIST_TYPE_VAR_NAME)
    ),
    new Bind(
        [],
        undefined,
        [ new Alias("next", "eng") ],
        new NameType(LIST_TYPE_VAR_NAME)
    )
], new NameType(LIST_TYPE_VAR_NAME));

Native.addFunction(LIST_NATIVE_TYPE_NAME, new FunctionDefinition(
    [], 
    [ new Alias("combine", "eng") ], 
    [], 
    [
        new Bind([], undefined, [ new Alias("initial", "eng")]),
        new Bind([], undefined, [ new Alias("combiner", "eng")], listCombineHOFType)
    ],
    new NativeHOFListCombine(listCombineHOFType),
    new ListType(new NameType(LIST_TYPE_VAR_NAME))
));

// TODO Documentation
Native.addNativeFunction(
    SET_NATIVE_TYPE_NAME, 
    [], 
    [ new Alias("add", "eng") ], 
    [], 
    [ new Bind([], undefined, [ new Alias("value", "eng") ], new NameType(SET_TYPE_VAR_NAME) ) ], 
    new SetType(undefined, undefined, new NameType(SET_TYPE_VAR_NAME)),
    evaluation => {
            const set = evaluation?.getContext();
            const element = evaluation.resolve("value");
            if(set instanceof SetValue && element !== undefined) return set.add(element);
            else return new TypeException(evaluation.getEvaluator(), new SetType(), set);
        }
);

// TODO Documentation
Native.addNativeFunction(
    SET_NATIVE_TYPE_NAME, 
    [], 
    [ new Alias("remove", "eng") ],
    [], 
    [ new Bind([], undefined, [ new Alias("value", "eng") ], new NameType(SET_TYPE_VAR_NAME) ) ], 
    new SetType(undefined, undefined, new NameType(SET_TYPE_VAR_NAME)),
    evaluation => {
        const set = evaluation.getContext();
        const element = evaluation.resolve("value");
        if(set instanceof SetValue && element !== undefined) return set.remove(element);
        else return new TypeException(evaluation.getEvaluator(), new SetType(), set);
    }
);

// TODO Documentation
Native.addNativeFunction(
    SET_NATIVE_TYPE_NAME, 
    [], 
    [ new Alias("union", "eng") ],
    [], 
    [ new Bind([], undefined, [ new Alias("set", "eng") ], new SetType(undefined, undefined, new NameType(SET_TYPE_VAR_NAME)) ) ],
    new SetType(undefined, undefined, new NameType(SET_TYPE_VAR_NAME)),
    evaluation => {
        const set = evaluation.getContext();
        const newSet = evaluation.resolve("set");
        if(set instanceof SetValue && newSet instanceof SetValue) return set.union(newSet);
        else return new TypeException(evaluation.getEvaluator(), new SetType(), set);
    }
);

// TODO Documentation
Native.addNativeFunction(SET_NATIVE_TYPE_NAME, [], [ new Alias("intersection", "eng") ], [], [ new Bind([], undefined, [ new Alias("set", "eng") ] ) ], new SetType(undefined, undefined, new NameType(SET_TYPE_VAR_NAME)),
    evaluation => {
        const set = evaluation.getContext();
        const newSet = evaluation.resolve("set");
        if(set instanceof SetValue && newSet instanceof SetValue) return set.intersection(newSet);
        else return new TypeException(evaluation.getEvaluator(), new SetType(), set);
    }
);

// TODO Documentation
Native.addNativeFunction(SET_NATIVE_TYPE_NAME, [], [ new Alias("difference", "eng") ], [], [ new Bind([], undefined, [ new Alias("set", "eng") ] ) ], new SetType(undefined, undefined, new NameType(SET_TYPE_VAR_NAME)),
    evaluation => {
        const set = evaluation.getContext();
        const newSet = evaluation.resolve("set");
        if(set instanceof SetValue && newSet instanceof SetValue) return set.difference(newSet);
        else return new TypeException(evaluation.getEvaluator(), new SetType(), set);
    }
);

// TODO Documentation
const setFilterHOFType = new FunctionType([ 
    new Bind(
        [],
        undefined,
        [ new Alias("value", "eng") ],
        new BooleanType()
    )
], new NameType(SET_TYPE_VAR_NAME));

Native.addFunction(SET_NATIVE_TYPE_NAME, new FunctionDefinition(
    [], 
    [ new Alias("filter", "eng") ], 
    [], 
    [
        new Bind([], undefined, [ new Alias("checker", "eng")], setFilterHOFType)
    ],
    new NativeHOFSetFilter(setFilterHOFType),
    new SetType(undefined, undefined, new NameType(SET_TYPE_VAR_NAME))
));

// TODO Documentation
Native.addNativeFunction(MAP_NATIVE_TYPE_NAME, [], [ new Alias("set", "eng") ], [], 
    [ 
        new Bind([], undefined, [ new Alias("key", "eng") ], new NameType("K") ),
        new Bind([], undefined, [ new Alias("value", "eng") ], new NameType("V") )
    ],
    new MapType(),
    evaluation => {
        const map = evaluation.getContext();
        const key = evaluation.resolve("key");
        const value = evaluation.resolve("value");
        if(map instanceof MapValue && key !== undefined && value !== undefined) return map.set(key, value);
        else return new TypeException(evaluation.getEvaluator(), new MapType(), map);
    }
);

// TODO Documentation
Native.addNativeFunction(MAP_NATIVE_TYPE_NAME, [], [ new Alias("unset", "eng") ], [], 
    [ 
        new Bind([], undefined, [ new Alias("key", "eng") ], new NameType("K") )
    ],
    new MapType(),
    evaluation => {
        const map = evaluation.getContext();
        const key = evaluation.resolve("key");
        if(map instanceof MapValue && key !== undefined) return map.unset(key);
        else return new TypeException(evaluation.getEvaluator(), new MapType(), map);
    }
);

// TODO Documentation
Native.addNativeFunction(MAP_NATIVE_TYPE_NAME, [], [ new Alias("remove", "eng") ], [], 
    [ 
        new Bind([], undefined, [ new Alias("value", "eng") ], new NameType("V") )
    ],
    new MapType(),
    evaluation => {
        const map = evaluation.getContext();
        const value = evaluation.resolve("value");
        if(map instanceof MapValue && value !== undefined) return map.remove(value);
        else return new TypeException(evaluation.getEvaluator(), new MapType(), map);
    }
);

// TODO Documentation
const mapFilterHOFType = new FunctionType([ 
    new Bind(
        [],
        undefined,
        [ new Alias("key", "eng") ],
        new NameType(MAP_KEY_TYPE_VAR_NAME)
    ),
    new Bind(
        [],
        undefined,
        [ new Alias("value", "eng") ],
        new NameType(MAP_VALUE_TYPE_VAR_NAME)
    )
], new BooleanType());

Native.addFunction(MAP_NATIVE_TYPE_NAME, new FunctionDefinition(
    [], 
    [ new Alias("filter", "eng") ], 
    [], 
    [
        new Bind([], undefined, [ new Alias("checker", "eng")], mapFilterHOFType)
    ],
    new NativeHOFMapFilter(mapFilterHOFType),
    new MapType(undefined, undefined, new NameType(MAP_KEY_TYPE_VAR_NAME), undefined, new NameType(MAP_VALUE_TYPE_VAR_NAME))
));

// TODO Documentation
const mapTranslateHOFType = new FunctionType([ 
    new Bind(
        [],
        undefined,
        [ new Alias("key", "eng") ],
        new NameType(MAP_KEY_TYPE_VAR_NAME)
    ),
    new Bind(
        [],
        undefined,
        [ new Alias("value", "eng") ],
        new NameType(MAP_VALUE_TYPE_VAR_NAME)
    )
], new NameType(MAP_VALUE_TYPE_VAR_NAME));

Native.addFunction(MAP_NATIVE_TYPE_NAME, new FunctionDefinition(
    [], 
    [ new Alias("translate", "eng") ], 
    [], 
    [
        new Bind([], undefined, [ new Alias("translator", "eng")], mapTranslateHOFType)
    ],
    new NativeHOFMapTranslate(mapTranslateHOFType),
    new MapType(undefined, undefined, new NameType(MAP_KEY_TYPE_VAR_NAME), undefined, new NameType(MAP_VALUE_TYPE_VAR_NAME))
));

// TODO Documentation
Native.addConversion(LIST_NATIVE_TYPE_NAME, [],  "''", new ListType(), (val: List) => new Text(val.toString())),
// TODO Documentation
Native.addConversion(LIST_NATIVE_TYPE_NAME, [],  "{}", new ListType(), (val: List) => new SetValue(val.getValues())),

// TODO Documentation
Native.addConversion(SET_NATIVE_TYPE_NAME, [], "''", new SetType(), (val: SetValue) => new Text(val.toString()));
// TODO Documentation
Native.addConversion(SET_NATIVE_TYPE_NAME, [], "[]", new SetType(), (val: SetValue) => new List(val.values));

// TODO Documentation
Native.addConversion(MAP_NATIVE_TYPE_NAME, [], "''", new MapType(), (val: MapValue) => new Text(val.toString()));
// TODO Documentation
Native.addConversion(MAP_NATIVE_TYPE_NAME, [], "{}", new MapType(), (val: MapValue) => new SetValue(val.getKeys()));
// TODO Documentation
Native.addConversion(MAP_NATIVE_TYPE_NAME, [], "[]", new MapType(), (val: MapValue) => new List(val.getValues()));

// TODO Documentation
Native.addConversion(BOOLEAN_NATIVE_TYPE_NAME, [], "''", new BooleanType(), (val: Bool) => new Text(val.toString()));

// TODO Documentation
Native.addConversion(NONE_NATIVE_TYPE_NME, [], "''", new NoneType([]), (val: None) => new Text(val.toString()));

// TODO Documentation
Native.addConversion(TEXT_NATIVE_TYPE_NAME, [], '[""]', new TextType(), (val: Text) => new List(val.text.split("").map(c => new Text(c))));

// TODO Documentation
Native.addConversion(MEASUREMENT_NATIVE_TYPE_NAME, [], "''", new MeasurementType(), (val: Measurement) => new Text(val.toString()));

Native.addStructure(LIST_NATIVE_TYPE_NAME, new StructureDefinition(
    // TODO Localized documentation
    [],
    [],
    // No interfaces
    [],
    // One type variable
    [ new TypeVariable(LIST_TYPE_VAR_NAME)],
    // No inputs
    [],
    // Include all of the functions defined above.
    new Block([], [ ...Object.values(Native.functionsByType[LIST_NATIVE_TYPE_NAME] ?? {}), ...Native.conversionsByType[LIST_NATIVE_TYPE_NAME]], true)
));

Native.addStructure(SET_NATIVE_TYPE_NAME, new StructureDefinition(
    // TODO Localized documentation
    [],
    [],
    // No interfaces
    [],
    // One type variable
    [ new TypeVariable(SET_TYPE_VAR_NAME)],
    // No inputs
    [],
    // Include all of the functions defined above.
    new Block([], [ ...Object.values(Native.functionsByType[SET_NATIVE_TYPE_NAME] ?? {}), ...Native.conversionsByType[SET_NATIVE_TYPE_NAME]], true)
));

Native.addStructure(MAP_NATIVE_TYPE_NAME, new StructureDefinition(
    // TODO Localized documentation
    [],
    [],
    // No interfaces
    [],
    // One type variable
    [ new TypeVariable(MAP_KEY_TYPE_VAR_NAME), new TypeVariable(MAP_VALUE_TYPE_VAR_NAME)],
    // No inputs
    [],
    // Include all of the functions defined above.
    new Block([], [ ...Object.values(Native.functionsByType[MAP_NATIVE_TYPE_NAME] ?? {}), ...Native.conversionsByType[MAP_NATIVE_TYPE_NAME]], true)
));

Native.addStructure(BOOLEAN_NATIVE_TYPE_NAME, new StructureDefinition(
    // TODO Localized documentation
    [],[], [], [], [],
    new Block([], [ ...Object.values(Native.functionsByType[BOOLEAN_NATIVE_TYPE_NAME] ?? {}), ...Native.conversionsByType[BOOLEAN_NATIVE_TYPE_NAME]], true)
));

Native.addStructure(MEASUREMENT_NATIVE_TYPE_NAME, new StructureDefinition(
    // TODO Localized documentation
    [],[], [], [], [],
    new Block([], [ ...Object.values(Native.functionsByType[MEASUREMENT_NATIVE_TYPE_NAME] ?? {}), ...Native.conversionsByType[MEASUREMENT_NATIVE_TYPE_NAME]], true)
));

Native.addStructure(TEXT_NATIVE_TYPE_NAME, new StructureDefinition(
    // TODO Localized documentation
    [],[], [], [], [],
    new Block([], [ ...Object.values(Native.functionsByType[TEXT_NATIVE_TYPE_NAME] ?? {}), ...Native.conversionsByType[TEXT_NATIVE_TYPE_NAME]], true)
));

Native.addStructure(NONE_NATIVE_TYPE_NME, new StructureDefinition(
    // TODO Localized documentation
    [],[], [], [], [],
    new Block([], [ ...Object.values(Native.functionsByType[NONE_NATIVE_TYPE_NME] ?? {}), ...Native.conversionsByType[NONE_NATIVE_TYPE_NME]], true)
));

export default Native;