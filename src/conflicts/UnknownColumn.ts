import type Expression from '@nodes/Expression';
import type TableType from '@nodes/TableType';
import Conflict from './Conflict';
import type Locales from '../locale/Locales';

export default class UnknownColumn extends Conflict {
    readonly type: TableType;
    readonly cell: Expression;

    constructor(type: TableType, cell: Expression) {
        super(false);
        this.type = type;
        this.cell = cell;
    }

    getConflictingNodes() {
        return {
            primary: {
                node: this.cell,
                explanation: (locales: Locales) =>
                    locales.concretize(
                        (l) => l.node.Row.conflict.UnknownColumn,
                    ),
            },
        };
    }
}
