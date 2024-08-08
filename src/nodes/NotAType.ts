import type Type from './Type';
import UnknownType from './UnknownType';
import type Expression from './Expression';
import type Context from './Context';
import NodeRef from '../locale/NodeRef';
import type Locales from '../locale/Locales';
import type { TemplateInput } from '../locale/Locales';

export class NotAType extends UnknownType<Expression> {
    readonly given: Type;
    readonly expected: Type;
    constructor(access: Expression, given: Type, expected: Type) {
        super(access, expected);
        this.given = given;
        this.expected = expected;
    }

    getReason(locales: Locales, context: Context) {
        return locales.concretize(
            (l) => l.node.NotAType.description,
            new NodeRef(this.expected, locales, context),
        );
    }

    getDescriptionInputs(locales: Locales, context: Context): TemplateInput[] {
        return [new NodeRef(this.expected, locales, context)];
    }
}
