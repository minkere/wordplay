import type Language from '@nodes/Language';
import type Token from '@nodes/Token';
import Conflict from './Conflict';
import type Locales from '../locale/Locales';

export default class UnknownLanguage extends Conflict {
    readonly language: Language;
    readonly code: Token;

    constructor(language: Language, code: Token) {
        super(true);
        this.language = language;
        this.code = code;
    }

    getConflictingNodes() {
        return {
            primary: {
                node: this.language,
                explanation: (locales: Locales) =>
                    locales.concretize(
                        (l) => l.node.Language.conflict.UnknownLanguage,
                    ),
            },
        };
    }
}
