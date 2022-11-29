import type Node from "../nodes/Node";
import Token from "../nodes/Token";
import Program from "../nodes/Program";
import type Conflict from "../conflicts/Conflict";
import { parseProgram, Tokens } from "../parser/Parser";
import { tokenize } from "../parser/Tokenizer";
import Evaluator from "../runtime/Evaluator";
import UnicodeString from "./UnicodeString";
import type Value from "../runtime/Value";
import StructureType from "../nodes/StructureType";
import type Structure from "../runtime/Structure";
import { createStructure } from "../runtime/Structure";
import Verse from "../native/Verse";
import Group from "../native/Group";
import Phrase from "../native/Phrase";
import List from "../runtime/List";
import Text from "../runtime/Text";
import Measurement from "../runtime/Measurement";
import type Project from "./Project";
import Context from "../nodes/Context";
import TokenType from "../nodes/TokenType";
import type StructureDefinition from "../nodes/StructureDefinition";
import Tree from "../nodes/Tree";
import type Names from "../nodes/Names";
import Unit from "../nodes/Unit";
import Dimension from "../nodes/Dimension";
import Style from "../native/Style";
import type Borrow from "../nodes/Borrow";
import type Translations from "../nodes/Translations";
import type LanguageCode from "../nodes/LanguageCode";
import Expression from "../nodes/Expression";
import FunctionDefinition from "../nodes/FunctionDefinition";
import Evaluate from "../nodes/Evaluate";
import HOF from "../native/HOF";
import FunctionDefinitionType from "../nodes/FunctionDefinitionType";
import type Bind from "../nodes/Bind";
import type Type from "../nodes/Type";
import type { TypeSet } from "../nodes/UnionType";
import type Step from "../runtime/Step";
import type Stream from "../runtime/Stream";
import type Transform from "../transforms/Transform";
import { WRITE_DOCS } from "../nodes/Translations";

/** A document representing executable Wordplay code and it's various metadata, such as conflicts, tokens, and evaulator. */
export default class Source extends Expression {

    readonly name: string;
    readonly code: UnicodeString;

    // Derived fields
    readonly program: Program;

    readonly evaluator: Evaluator;

    /** The Project sets this once it's added. */
    _project: Project | undefined;
    
    /** Functions to call when a source's evaluator has an update. */
    readonly observers: Set<() => void> = new Set();

    /** An index of token positions in the source file. */
    readonly tokenPositions: Map<Token, number> = new Map();

    /** A tree representing the source's program. */
    readonly tree: Tree;

    /** An index of Trees by Node, for fast retrieval of tree structure by a Node. */
    _index: Map<Node, Tree | undefined> = new Map();

    /** Indices of conflicts, overall and by node. */
    _conflicts: Conflict[] = [];
    readonly _primaryNodeConflicts: Map<Node, Conflict[]> = new Map();
    readonly _secondaryNodeConflicts: Map<Node, Conflict[]> = new Map();
    
    /** An index of expression dependencies, mapping an Expression to one or more Expressions that are affected if it changes value.  */
    readonly _expressionDependencies: Map<Expression | Value, Set<Expression>> = new Map();

    /** A mapping from function/structure definitions to all of their calls. */
    readonly _calls: Map<FunctionDefinition | StructureDefinition, Set<Evaluate>> = new Map();

    constructor(name: string, code: string | UnicodeString | Program, observers?: Set<() => void>) {

        super();

        this.name = name;

        if(code instanceof Program) {
            // Save the AST
            this.program = code;
        }
        else {
            // Generate the AST.
            this.program = parseProgram(new Tokens(tokenize(code instanceof UnicodeString ? code.getText() : code)));
        }

        // A facade for analyzing the tree.
        this.tree = new Tree(this.program);

        // Generate the text from the AST, which is responsible for pretty printing.
        this.code = new UnicodeString(this.program.toWordplay());

        // Create an index of the program's tokens.
        let index = 0;
        for(const token of this.program.nodes(n => n instanceof Token) as Token[]) {
            index += token.space.length;
            this.tokenPositions.set(token, index);
            index += token.text.getLength();
        }

        // Create an evaluator, listen to it's changes, and set up any given observers.
        this.evaluator = new Evaluator(this);
        this.evaluator.observe(this);
        if(observers !== undefined) this.observers = observers;

    }

    getGrammar() { 
        return [
            { name: "program", types:[ Program ] },
        ]; 
    }

    get(node: Node) { 
        // See if the cache has it.
        if(!this._index.has(node))
            this._index.set(node, this.tree.get(node));
        return this._index.get(node);    
    }

    getProject() { return this._project; }
    setProject(project: Project) { this._project = project; }

    hasName(name: string) { return this.name === name; }

    analyze() {

        const context = this.getContext();

        // Compute all of the conflicts in the program.
        this._conflicts = this.program.getAllConflicts(context);

        // Build conflict indices by going through each conflict, asking for the conflicting nodes
        // and adding to the conflict to each node's list of conflicts.
        this._conflicts.forEach(conflict => {
            const complicitNodes = conflict.getConflictingNodes();
            complicitNodes.primary.forEach(node => {
                let nodeConflicts = this._primaryNodeConflicts.get(node) ?? [];
                this._primaryNodeConflicts.set(node, [ ... nodeConflicts, conflict ]);
            });
            complicitNodes.secondary?.forEach(node => {
                let nodeConflicts = this._primaryNodeConflicts.get(node) ?? [];
                this._secondaryNodeConflicts.set(node, [ ... nodeConflicts, conflict ]);
            });
        });

        // Build an index of all calls.
        this.program.nodes().forEach(node => {
            // Find all Evaluates
            if(node instanceof Evaluate) {
                // Find the function called.
                const fun = node.getFunction(context);
                if(fun) {
                    // Add this evaluate to the function's list of calls.
                    const evaluates = this._calls.get(fun) ?? new Set();
                    evaluates.add(node);
                    this._calls.set(fun, evaluates);

                    // Is it a higher order function? Get the function input
                    // and add the Evaluate as a caller of the function input.
                    if(fun instanceof FunctionDefinition && fun.expression instanceof HOF) {
                        for(const input of node.inputs) {
                            const type = input.getTypeUnlessCycle(context);
                            if(type instanceof FunctionDefinitionType) {
                                const hofEvaluates = this._calls.get(type.fun) ?? new Set();
                                hofEvaluates.add(node);
                                this._calls.set(type.fun, hofEvaluates);
                            }
                        }
                    }
                }
            }
        });

        // Build the dependency graph by asking each expression node for its dependencies.
        this.nodes().forEach((expr) => {
            if(expr instanceof Expression) {
                for(const dependency of expr.getDependencies(context)) {
                    const set = this._expressionDependencies.get(dependency);
                    if(set)
                        set.add(expr);
                    else
                        this._expressionDependencies.set(dependency, new Set([ expr ]));
                }
            }
        });

    }

    getEvaluationsOf(def: FunctionDefinition | StructureDefinition) {
        return this._calls.get(def) ?? new Set();
    }

    getExpressionsAffectedBy(expression: Value | Expression): Set<Expression> {
        return this._expressionDependencies.get(expression) ?? new Set();
    }

    /** Returns a path from a borrow in this program this to this, if one exists. */
    getCycle(context: Context, path: Source[] = []): [ Borrow,  Source[] ] | undefined {

        // Visit this source.
        path.push(this);

        // We need a project to do this.
        const project = this.getProject();
        if(project === undefined) return;

        // Visit each borrow in the source's program to see if there's a path back here.
        for(const borrow of this.program.borrows) {

            // Find the definition.
            const name = borrow.name?.getText();
            if(name) {
                // Does another program in the project define it?
                const [ , source ] = project.getDefinition(this, name) ?? [];
                if(source) {
                    // If we found a cycle, return the path.
                    if(path.includes(source))
                        return [ borrow, path ];
                    // Otherwise, continue searching for a cycle.
                    const cycle = source.getCycle(context, path.slice());
                    // If we found one, pass it up the call stack, but pass up this borrow instead
                    if(cycle)
                        return [ borrow, cycle[1] ];
                }

            }
        }

        // We made it without detecting a cycle; return undefined.
        return;

    }
    
    getContext() {
        return new Context(this, this.evaluator.getShares());
    }

    getName() { return this.name; }
    getNames() { return [ this.name ]; }
    getCode() { return this.code; }

    getEvaluator() { return this.evaluator; }

    observe(observer: () => void) { 
        this.observers.add(observer);
    }

    ignore(observer: () => void) { 
        this.observers.delete(observer);
    }

    stepped() {
        this.observers.forEach(observer => observer());
    }

    ended() {
        this.observers.forEach(observer => observer());
    }

    getVerse() {         
        const value = this.evaluator.getLatestResult();
        return this.valueToVerse(value);
    }

    style(font: string, size: number) {
        const bindings = new Map<Names, Value>();
        bindings.set(Style.inputs[0].names, new Text(this.program, font));
        bindings.set(Style.inputs[1].names, new Measurement(this.program, size, new Unit(undefined, [ new Dimension("pt")])));
        return createStructure(this.evaluator, Style, bindings);
    }


    phrase(text: string | Text, size: number=12, font: string="Noto Sans", ): Structure {
        const bindings = new Map<Names, Value>();
        bindings.set(Phrase.inputs[0].names, text instanceof Text ? text : new Text(this.program, text));
        bindings.set(Phrase.inputs[1].names, this.style(font, size));
        return createStructure(this.evaluator, Phrase as StructureDefinition, bindings);
    }

    group(...phrases: Structure[]) {
        return createStructure(this.evaluator, Group as StructureDefinition, new Map().set(Group.inputs[1].names, new List(this.program, phrases)));
    }

    verse(group: Structure) {
        return createStructure(this.evaluator, Verse as StructureDefinition, new Map().set(Verse.inputs[0].names, group));
    }

    valueToVerse(value: Value | undefined): Structure {

        // If the content is a Verse, just show it as is.
        if(value === undefined)
            return this.verse(this.group(this.phrase("...", 20)))

        const contentType = value.getType(this.evaluator.getContext());
        if(contentType instanceof StructureType && contentType.structure === Verse)
            return value as Structure;
        else if(contentType instanceof StructureType && contentType.structure === Group)
            return this.verse(value as Structure);
        else if(contentType instanceof StructureType && contentType.structure === Phrase)
            return this.verse(this.group( value as Structure ));
        else if(value instanceof Text || typeof value === "string")
            return this.verse(this.group(this.phrase(value, 12)));
        else
            return this.verse(this.group(this.phrase(value.toString(), 12)));

    }

    cleanup() {
        this.evaluator.stop();
    }
    
    withPreviousGraphemeReplaced(char: string, position: number) {
        const newCode = this.code.withPreviousGraphemeReplaced(char, position);
        return newCode === undefined ? undefined : new Source(this.name, newCode, this.observers);
    }

    withGraphemesAt(char: string, position: number) {
        const newCode = this.code.withGraphemesAt(char, position);
        return newCode == undefined ? undefined : new Source(this.name, newCode, this.observers);
    }

    withoutGraphemeAt(position: number) {
        const newCode = this.code.withoutGraphemeAt(position);
        return newCode == undefined ? undefined : new Source(this.name, newCode, this.observers);
    }

    withoutGraphemesBetween(start: number, endExclusive: number) {
        const newCode = this.code.withoutGraphemesBetween(start, endExclusive);
        return newCode == undefined ? undefined : new Source(this.name, newCode, this.observers);
    }

    withCode(code: string) {
        return new Source(this.name, new UnicodeString(code), this.observers);
    }

    withProgram(program: Program) {
        return new Source(this.name, program, this.observers);
    }

    replace() {
        return new Source(this.name, this.program, this.observers) as this;
    }

    getTokenTextPosition(token: Token) {
        const index = this.tokenPositions.get(token);
        if(index === undefined) 
            throw Error(`No index for ${token.toWordplay()}; it must not be in this source, which means there's a defect somewhere.`);
        return index;
    }

    getTokenSpacePosition(token: Token) { return this.getTokenTextPosition(token) - token.space.length; }
    getTokenLastPosition(token: Token) { return this.getTokenTextPosition(token) + token.getTextLength(); }

    getTokenAt(position: number, includingWhitespace: boolean = true) {
        // This could be faster with binary search, but let's not prematurely optimize.
        for(const [token, index] of this.tokenPositions) {
            if(position >= index - (includingWhitespace ? token.space.length : 0) && (position < index + token.getTextLength() || token.is(TokenType.END)))
                return token;
        }
        return undefined;
    }

    getTokenWithSpaceAt(position: number) {
        // This could be faster with binary search, but let's not prematurely optimize.
        for(const [token] of this.tokenPositions)
            if(this.tokenSpaceContains(token, position))
                return token;
        return undefined;
    }

    tokenSpaceContains(token: Token, position: number) {
        const index = this.getTokenTextPosition(token);
        return position >= index - token.space.length && position <= index;     
    }

    getNextToken(token: Token, direction: -1 | 1): Token | undefined {

        const tokens = this.program.nodes(n => n instanceof Token) as Token[];
        const index = tokens.indexOf(token);

        if(direction < 0 && index <= 0) return undefined;
        if(direction > 0 && index >= tokens.length - 1) return undefined;
        return tokens[index + direction];

    }

    getNodeFirstPosition(node: Node) {
        const firstToken = this.getFirstToken(node);
        return firstToken === undefined ? undefined : this.getTokenTextPosition(firstToken);
    }

    getNodeLastPosition(node: Node) {
        const lastToken = this.getLastToken(node);
        return lastToken === undefined ? undefined : this.getTokenLastPosition(lastToken);
    }

    getFirstToken(node: Node): Token | undefined {
        let next = node;
        do {
            if(next instanceof Token) return next;
            next = next.getChildren()[0];
        } while(next !== undefined);
        return undefined;
    }

    getLastToken(node: Node): Token | undefined {
        let next = node;
        do {
            if(next instanceof Token) return next;
            const children = next.getChildren();
            next = children[children.length - 1];
        } while(next !== undefined);
        return undefined;
    }

    isEmptyLine(position: number) {

        // Only offer suggestions on empty newlines.
        // An empty line is one for which every character before and after until the next new line is only a space or tab
        let current = position;
        let empty = true;
        let next: string | undefined;
        do {
            current--;
            next = this.code.at(current);
        } while(next !== undefined && (next === " " || next === "\t"));
        if(next !== "\n") empty = false;
        else {
            current = position;
            do {
                next = this.code.at(current);
                current++;
            } while(next !== undefined && (next === " " || next === "\t"));
            if(next !== "\n" && next !== undefined) empty = false;    
        }
        return empty;

    }

    getPrimaryConflicts() { return this._primaryNodeConflicts; }
    getSecondaryConflicts() { return this._secondaryNodeConflicts; }

    /** Given a node N, and the set of conflicts C in the program, determines the subset of C in which the given N is complicit. */
    getPrimaryConflictsInvolvingNode(node: Node) {
        return this._primaryNodeConflicts.get(node);
    }
    getSecondaryConflictsInvolvingNode(node: Node) {
        return this._secondaryNodeConflicts.get(node);
    }

    getDescriptions(): Translations {
        return {
            eng: this.name,
            "😀": this.name
        }
    }

    getTranslation(_: LanguageCode[]) {
        return this.name;
    }

    getType(context: Context) { return this.getTypeUnlessCycle(context); }
    getTypeUnlessCycle(context: Context) { return this.program.getTypeUnlessCycle(context); }

    computeType(context: Context): Type { return this.program.getTypeUnlessCycle(context); }
    getDependencies(_: Context): (Expression | Stream)[] { return [ this.program ]; }
    evaluateTypeSet(_: Bind, __: TypeSet, current: TypeSet): TypeSet { return current; }
    compile(): Step[] { return []; }
    evaluate(): Value | undefined { return undefined; }
    getStartExplanations(): Translations { return WRITE_DOCS; }
    getFinishExplanations(): Translations { return WRITE_DOCS; }
    computeConflicts(): void | Conflict[] { return []; }
    getChildReplacement(): Transform[] | undefined { return undefined; }
    getInsertionBefore(): Transform[] | undefined { return undefined; }
    getInsertionAfter(): Transform[] | undefined { return undefined; }
    getChildRemoval(): Transform | undefined { return undefined; }

}