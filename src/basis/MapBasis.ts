import Bind from '@nodes/Bind';
import Block, { BlockKind } from '@nodes/Block';
import BooleanType from '@nodes/BooleanType';
import FunctionType from '@nodes/FunctionType';
import MapType from '@nodes/MapType';
import StructureDefinition from '@nodes/StructureDefinition';
import List from '@runtime/List';
import Text from '@runtime/Text';
import Map from '@runtime/Map';
import Set from '@runtime/Set';
import { createBasisConversion, createBasisFunction } from './Basis';
import Bool from '@runtime/Bool';
import TypeVariables from '@nodes/TypeVariables';
import { getDocLocales } from '@locale/getDocLocales';
import { getNameLocales } from '@locale/getNameLocales';
import TypeVariable from '@nodes/TypeVariable';
import type Evaluation from '@runtime/Evaluation';
import type Value from '@runtime/Value';
import type Expression from '../nodes/Expression';
import type Locale from '../locale/Locale';
import { createFunction, createInputs } from '../locale/Locale';
import { Iteration } from './Iteration';

export default function bootstrapMap(locales: Locale[]) {
    const KeyTypeVariableNames = getNameLocales(
        locales,
        (locale) => locale.basis.Map.key
    );
    const KeyTypeVariable = new TypeVariable(KeyTypeVariableNames);
    const ValueTypeVariableNames = getNameLocales(
        locales,
        (locale) => locale.basis.Map.value
    );
    const ValueTypeVariable = new TypeVariable(ValueTypeVariableNames);

    const TranslateTypeVariable = new TypeVariable(
        getNameLocales(locales, (locale) => locale.basis.Map.result)
    );

    const equalsFunctionValueNames = getNameLocales(
        locales,
        (locale) => locale.basis.Map.function.equals.inputs[0].names
    );
    const notEqualsFunctionValueNames = getNameLocales(
        locales,
        (locale) => locale.basis.Map.function.notequals.inputs[0].names
    );

    const setFunctionKeyNames = getNameLocales(
        locales,
        (locale) => locale.basis.Map.function.set.inputs[0].names
    );

    const setFunctionValueNames = getNameLocales(
        locales,
        (locale) => locale.basis.Map.function.set.inputs[1].names
    );

    const unsetFunctionKeyNames = getNameLocales(
        locales,
        (locale) => locale.basis.Map.function.unset.inputs[0].names
    );

    const removeFunctionValueNames = getNameLocales(
        locales,
        (locale) => locale.basis.Map.function.remove.inputs[0].names
    );

    return StructureDefinition.make(
        getDocLocales(locales, (locale) => locale.basis.Map.doc),
        getNameLocales(locales, (locale) => locale.basis.Map.name),
        // No interfaces
        [],
        // One type variable
        TypeVariables.make([KeyTypeVariable, ValueTypeVariable]),
        // No inputs
        [],
        // Include all of the functions defined above.
        new Block(
            [
                createBasisFunction(
                    getDocLocales(
                        locales,
                        (locale) => locale.basis.Map.function.equals.doc
                    ),
                    getNameLocales(
                        locales,
                        (locale) => locale.basis.Map.function.equals.names
                    ),
                    undefined,
                    [
                        Bind.make(
                            getDocLocales(
                                locales,
                                (t) => t.basis.Map.function.equals.inputs[0].doc
                            ),
                            equalsFunctionValueNames,
                            MapType.make()
                        ),
                    ],
                    BooleanType.make(),
                    (requestor, evaluation) => {
                        const map = evaluation?.getClosure();
                        const other = evaluation.resolve(
                            equalsFunctionValueNames
                        );
                        return !(map instanceof Map && other instanceof Map)
                            ? evaluation.getValueOrTypeException(
                                  requestor,
                                  MapType.make(),
                                  other
                              )
                            : new Bool(requestor, map.isEqualTo(other));
                    }
                ),
                createBasisFunction(
                    getDocLocales(
                        locales,
                        (locale) => locale.basis.Map.function.notequals.doc
                    ),
                    getNameLocales(
                        locales,
                        (locale) => locale.basis.Map.function.notequals.names
                    ),
                    undefined,
                    [
                        Bind.make(
                            getDocLocales(
                                locales,
                                (t) =>
                                    t.basis.Map.function.notequals.inputs[0].doc
                            ),
                            notEqualsFunctionValueNames,
                            MapType.make()
                        ),
                    ],
                    BooleanType.make(),
                    (requestor, evaluation) => {
                        const map = evaluation?.getClosure();
                        const other = evaluation.resolve(
                            notEqualsFunctionValueNames
                        );
                        return !(map instanceof Map && other instanceof Map)
                            ? evaluation.getValueOrTypeException(
                                  requestor,
                                  MapType.make(),
                                  other
                              )
                            : new Bool(requestor, !map.isEqualTo(other));
                    }
                ),
                createBasisFunction(
                    getDocLocales(
                        locales,
                        (locale) => locale.basis.Map.function.set.doc
                    ),
                    getNameLocales(
                        locales,
                        (locale) => locale.basis.Map.function.set.names
                    ),
                    undefined,
                    [
                        Bind.make(
                            getDocLocales(
                                locales,
                                (locale) =>
                                    locale.basis.Map.function.set.inputs[0].doc
                            ),
                            setFunctionKeyNames,
                            KeyTypeVariable.getReference()
                        ),
                        Bind.make(
                            getDocLocales(
                                locales,
                                (locale) =>
                                    locale.basis.Map.function.set.inputs[1].doc
                            ),
                            setFunctionValueNames,
                            ValueTypeVariable.getReference()
                        ),
                    ],
                    MapType.make(),
                    (requestor, evaluation) => {
                        const map: Evaluation | Value | undefined =
                            evaluation.getClosure();
                        const key = evaluation.resolve(setFunctionKeyNames);
                        const value = evaluation.resolve(setFunctionValueNames);
                        if (
                            map instanceof Map &&
                            key !== undefined &&
                            value !== undefined
                        )
                            return map.set(requestor, key, value);
                        else
                            return evaluation.getValueOrTypeException(
                                requestor,
                                MapType.make(),
                                map
                            );
                    }
                ),
                createBasisFunction(
                    getDocLocales(
                        locales,
                        (locale) => locale.basis.Map.function.unset.doc
                    ),
                    getNameLocales(
                        locales,
                        (locale) => locale.basis.Map.function.unset.names
                    ),
                    undefined,
                    [
                        Bind.make(
                            getDocLocales(
                                locales,
                                (locale) =>
                                    locale.basis.Map.function.unset.inputs[0]
                                        .doc
                            ),
                            unsetFunctionKeyNames,
                            KeyTypeVariable.getReference()
                        ),
                    ],
                    MapType.make(),
                    (requestor, evaluation) => {
                        const map = evaluation.getClosure();
                        const key = evaluation.resolve(unsetFunctionKeyNames);
                        if (map instanceof Map && key !== undefined)
                            return map.unset(requestor, key);
                        else
                            return evaluation.getValueOrTypeException(
                                requestor,
                                MapType.make(),
                                map
                            );
                    }
                ),
                createBasisFunction(
                    getDocLocales(
                        locales,
                        (locale) => locale.basis.Map.function.remove.doc
                    ),
                    getNameLocales(
                        locales,
                        (locale) => locale.basis.Map.function.remove.names
                    ),
                    undefined,
                    [
                        Bind.make(
                            getDocLocales(
                                locales,
                                (t) => t.basis.Map.function.remove.inputs[0].doc
                            ),
                            removeFunctionValueNames,
                            ValueTypeVariable.getReference()
                        ),
                    ],
                    MapType.make(),
                    (requestor, evaluation) => {
                        const map = evaluation.getClosure();
                        const value = evaluation.resolve(
                            removeFunctionValueNames
                        );
                        if (map instanceof Map && value !== undefined)
                            return map.remove(requestor, value);
                        else
                            return evaluation.getValueOrTypeException(
                                requestor,
                                MapType.make(),
                                map
                            );
                    }
                ),
                createFunction(
                    locales,
                    (locale) => locale.basis.Map.function.filter,
                    undefined,
                    createInputs(
                        locales,
                        (l) => l.basis.Map.function.filter.inputs,
                        [
                            FunctionType.make(
                                undefined,
                                createInputs(
                                    locales,
                                    (locale) =>
                                        locale.basis.Map.function.filter
                                            .checker,
                                    [
                                        KeyTypeVariable.getReference(),
                                        ValueTypeVariable.getReference(),
                                        MapType.make(
                                            KeyTypeVariable.getReference(),
                                            ValueTypeVariable.getReference()
                                        ),
                                    ]
                                ),
                                BooleanType.make()
                            ),
                        ]
                    ),
                    MapType.make(
                        KeyTypeVariable.getReference(),
                        ValueTypeVariable.getReference()
                    ),
                    new Iteration<{
                        index: number;
                        map: Map;
                        filtered: [Value, Value][];
                    }>(
                        MapType.make(
                            KeyTypeVariable.getReference(),
                            ValueTypeVariable.getReference()
                        ),
                        // Start with an index of one, the list we're translating, and an empty translated list.
                        (evaluator) => {
                            return {
                                index: 0,
                                map: evaluator.getCurrentClosure() as Map,
                                filtered: [],
                            };
                        },
                        // If we're past the end, stop. Otherwise, evaluate the translator function on the next value.
                        (evaluator, info, expr) =>
                            info.index >= info.map.values.length
                                ? false
                                : expr.evaluateFunctionInput(evaluator, 0, [
                                      info.map.values[info.index][0],
                                      info.map.values[info.index][1],
                                      info.map,
                                  ]),
                        // Save the translated value and increment the index.
                        (evaluator, info, expression) => {
                            const include = evaluator.popValue(expression);
                            if (!(include instanceof Bool))
                                return evaluator.getValueOrTypeException(
                                    expression,
                                    BooleanType.make(),
                                    include
                                );
                            if (include.bool)
                                info.filtered.push(info.map.values[info.index]);
                            info.index = info.index + 1;
                            return undefined;
                        },
                        // Create the translated list.
                        (evaluator, info, expression) =>
                            new Map(expression, info.filtered)
                    )
                ),
                createFunction(
                    locales,
                    (locale) => locale.basis.Map.function.translate,
                    TypeVariables.make([TranslateTypeVariable]),
                    createInputs(
                        locales,
                        (t) => t.basis.Map.function.translate.inputs,
                        [
                            FunctionType.make(
                                undefined,
                                createInputs(
                                    locales,
                                    (locale) =>
                                        locale.basis.Map.function.translate
                                            .translator,
                                    [
                                        KeyTypeVariable.getReference(),
                                        ValueTypeVariable.getReference(),

                                        MapType.make(
                                            KeyTypeVariable.getReference(),
                                            ValueTypeVariable.getReference()
                                        ),
                                    ]
                                ),
                                TranslateTypeVariable.getReference()
                            ),
                        ]
                    ),
                    MapType.make(
                        KeyTypeVariable.getReference(),
                        TranslateTypeVariable.getReference()
                    ),
                    new Iteration<{
                        index: number;
                        map: Map;
                        translated: [Value, Value][];
                    }>(
                        MapType.make(
                            KeyTypeVariable.getReference(),
                            TranslateTypeVariable.getReference()
                        ),
                        // Start with an index of one, the list we're translating, and an empty translated list.
                        (evaluator) => {
                            return {
                                index: 0,
                                map: evaluator.getCurrentClosure() as Map,
                                translated: [],
                            };
                        },
                        // If we're past the end, stop. Otherwise, evaluate the translator function on the next value.
                        (evaluator, info, expr) =>
                            info.index >= info.map.values.length
                                ? false
                                : expr.evaluateFunctionInput(evaluator, 0, [
                                      info.map.values[info.index][0],
                                      info.map.values[info.index][1],
                                      info.map,
                                  ]),
                        // Save the translated value and increment the index.
                        (evaluator, info, expression) => {
                            const newValue = evaluator.popValue(expression);
                            info.translated.push([
                                info.map.values[info.index][0],
                                newValue,
                            ]);
                            info.index = info.index + 1;
                            return undefined;
                        },
                        // Create the translated list.
                        (evaluator, info, expression) =>
                            new Map(expression, info.translated)
                    )
                ),
                createBasisConversion(
                    getDocLocales(
                        locales,
                        (locale) => locale.basis.Map.conversion.text
                    ),
                    '{:}',
                    "''",
                    (requestor: Expression, val: Map) =>
                        new Text(requestor, val.toString())
                ),
                createBasisConversion(
                    getDocLocales(
                        locales,
                        (locale) => locale.basis.Map.conversion.set
                    ),
                    '{:}',
                    '{}',
                    (requestor: Expression, val: Map) =>
                        new Set(requestor, val.getKeys())
                ),
                createBasisConversion(
                    getDocLocales(
                        locales,
                        (locale) => locale.basis.Map.conversion.list
                    ),
                    '{:}',
                    '[]',
                    (requestor: Expression, val: Map) =>
                        new List(requestor, val.getValues())
                ),
            ],
            BlockKind.Structure
        )
    );
}
