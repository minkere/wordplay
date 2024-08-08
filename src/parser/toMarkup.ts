import type Spaces from './Spaces';
import type Markup from '../nodes/Markup';
import { DOCS_SYMBOL } from './Symbols';
import { toTokens } from './toTokens';
import parseDoc from './parseDoc';
import { withoutAnnotations } from '@locale/LocaleText';

export function toMarkup(template: string): [Markup, Spaces] {
    // Replace out of date markers before parsing
    const tokens = toTokens(
        (template.startsWith(DOCS_SYMBOL) ? '' : DOCS_SYMBOL) +
            withoutAnnotations(template) +
            (template.endsWith(DOCS_SYMBOL) ? '' : DOCS_SYMBOL),
    );
    return [parseDoc(tokens).markup, tokens.getSpaces()];
}
