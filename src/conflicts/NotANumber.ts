import type NumberLiteral from '@nodes/NumberLiteral';
import Conflict from './Conflict';
import type Locales from '../locale/Locales';

export class NotANumber extends Conflict {
    readonly measurement: NumberLiteral;

    constructor(measurement: NumberLiteral) {
        super(false);
        this.measurement = measurement;
    }

    getConflictingNodes() {
        return {
            primary: {
                node: this.measurement,
                explanation: (locales: Locales) =>
                    locales.concretize(
                        (l) => l.node.NumberLiteral.conflict.NotANumber,
                    ),
            },
        };
    }
}
