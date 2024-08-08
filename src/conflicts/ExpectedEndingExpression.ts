import type Block from '@nodes/Block';
import Conflict from './Conflict';
import type Locales from '../locale/Locales';

export class ExpectedEndingExpression extends Conflict {
    readonly block: Block;

    constructor(block: Block) {
        super(false);
        this.block = block;
    }

    getConflictingNodes() {
        return {
            primary: {
                node: this.block,
                explanation: (locales: Locales) =>
                    locales.concretize(
                        (l) => l.node.Block.conflict.ExpectedEndingExpression,
                    ),
            },
        };
    }
}
