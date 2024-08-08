import type This from '@nodes/This';
import Conflict from './Conflict';
import type Locales from '../locale/Locales';

export class MisplacedThis extends Conflict {
    readonly dis: This;
    constructor(dis: This) {
        super(false);
        this.dis = dis;
    }

    getConflictingNodes() {
        return {
            primary: {
                node: this.dis,
                explanation: (locales: Locales) =>
                    locales.concretize(
                        (l) => l.node.This.conflict.MisplacedThis,
                    ),
            },
        };
    }
}
