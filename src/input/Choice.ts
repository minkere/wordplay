import Stream from '@runtime/Stream';
import type Evaluator from '@runtime/Evaluator';
import StreamDefinition from '../nodes/StreamDefinition';
import { getDocLocales } from '../locale/getDocLocales';
import { getNameLocales } from '../locale/getNameLocales';
import TextType from '../nodes/TextType';
import Text from '../runtime/Text';
import StreamType from '../nodes/StreamType';
import createStreamEvaluator from './createStreamEvaluator';
import type Locale from '../locale/Locale';

/** A series of selected output, chosen by mouse or keyboard, allowing for programs that work for both mouse and keyboard. */
export default class Choice extends Stream<Text> {
    readonly evaluator: Evaluator;

    on: boolean = true;

    constructor(evaluator: Evaluator) {
        super(
            evaluator,
            evaluator.project.shares.input.choice,
            new Text(evaluator.getMain(), '')
        );

        this.evaluator = evaluator;
    }

    configure() {}

    record(name: string) {
        // Only add the event if it mateches the requirements.
        if (this.on) this.add(new Text(this.evaluator.getMain(), name));
    }

    start() {
        this.on = true;
    }
    stop() {
        this.on = false;
    }

    getType() {
        return StreamType.make(TextType.make());
    }
}

export function createChoiceDefinition(locales: Locale[]) {
    return StreamDefinition.make(
        getDocLocales(locales, (locale) => locale.input.Choice.doc),
        getNameLocales(locales, (locale) => locale.input.Choice.names),
        [],
        createStreamEvaluator(
            TextType.make(),
            Choice,
            (evaluation) => new Choice(evaluation.getEvaluator()),
            (stream) => stream.configure()
        ),
        TextType.make()
    );
}
