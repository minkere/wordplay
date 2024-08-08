import type Bind from '@nodes/Bind';
import Conflict from './Conflict';
import type Locales from '../locale/Locales';

export class MissingShareLanguages extends Conflict {
    readonly share: Bind;

    constructor(share: Bind) {
        super(false);
        this.share = share;
    }

    getConflictingNodes() {
        return {
            primary: {
                node: this.share,
                explanation: (locales: Locales) =>
                    locales.concretize(
                        (l) => l.node.Bind.conflict.MissingShareLanguages,
                    ),
            },
        };
    }
}
