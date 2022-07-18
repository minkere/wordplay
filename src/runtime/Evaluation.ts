import type ConversionDefinition from "../nodes/ConversionDefinition";
import type FunctionDefinition from "../nodes/FunctionDefinition";
import Program from "../nodes/Program";
import type StructureDefinition from "../nodes/StructureDefinition";
import Type from "../nodes/Type";
import type Conversion from "./Conversion";
import type Evaluable from "./Evaluable";
import type Evaluator from "./Evaluator";
import Exception, { ExceptionType } from "./Exception";
import type Step from "./Step";
import Value from "./Value";

export default class Evaluation {

    /** The node that defined this program. */
    readonly #definition: Program | FunctionDefinition | StructureDefinition | ConversionDefinition;

    /** The node being evaluated. */
    readonly #node: Evaluable;

    /** A cache of the node's steps */
    readonly #steps: Step[];

    /** The evaluation in which this is being evaluated. */
    readonly #context: Evaluation | undefined;

    /** A dictionary of values bound to names */
    readonly #bindings: Map<string, Value>;

    /** This represents a stack of values returned by steps. */
    readonly #values: Value[] = [];

    /** A list of conversions in this context. */
    readonly #conversions: Conversion[] = [];

    /** The step to execute next */
    #step: number = 0;
    
    constructor(definition: Program | FunctionDefinition | StructureDefinition | ConversionDefinition, node: Evaluable, context?: Evaluation, bindings?: Map<string, Value>) {

        this.#definition = definition;
        this.#node = node;
        this.#context = context;

        // Cache the steps for the given node.
        this.#steps = node.compile();

        // Set up the bindings
        this.#bindings = bindings === undefined ? new Map() : bindings;

    }

    getDefinition() { return this.#definition; }
    getNode() { return this.#node; }

    /** Given an Evaluator, evaluate this node, and return true if it's done. 
     *  Undefined means that this will continue evaluating. A Value means it's done. */
    step(evaluator: Evaluator): Value | undefined {

        // If there are no more steps, return the value on the top of the stack.
        if(this.#step >= this.#steps.length) 
            return this.popValue();

        // Evaluate the next step.
        const result = this.#steps[this.#step].evaluate(evaluator);

        // If it's an exception, return it to the evaluator to halt the program.
        if(result instanceof Exception)
            return result;
        // If it's a value, add it to the top of the stack.
        else if(result instanceof Value)
            this.#values.unshift(result);

        // Move to the next step.
        this.#step++;

    }

    jump(distance: number) {
        this.#step += distance;  
    }

    pushValue(value: Value): void { 
        this.#values.unshift(value); 
    }

    popValue(): Value { 
        const value = this.#values.shift(); 
        return value === undefined ? new Exception(ExceptionType.EXPECTED_VALUE) : value;
    }

    /** Binds a value to a name in this evaluation. */
    bind(name: string, value: Value) {
        this.#bindings.set(name, value);
    }

    /** Resolves the given name in this evaluation or its context. */
    resolve(name: string): Value | undefined {
        return this.#bindings.has(name) ? this.#bindings.get(name) : 
            this.#context === undefined ? undefined : 
            this.#context.resolve(name);
    }

    /** Remember the given conversion for later. */
    addConversion(conversion: Conversion) {
        this.#conversions.push(conversion);
    }

    /** Find a conversion that matches the given type */
    getConversion(type: Type) {

        const program = this.getProgram();
        if(program === undefined) return undefined;
        return this.#conversions.find(c => c.definition.output instanceof Type && c.definition.output.isCompatible(program, type));

    }

    /** Finds the program that executed all of this in the evaluation context stack. */
    getProgram(): Program | undefined {
        
        return this.#definition instanceof Program ? this.#definition : 
            this.#context !== undefined ? this.#context.getProgram() : 
            undefined;

    }

    /** Allow the given aliases to be borrowed. */
    share(name: string) {

    }

}