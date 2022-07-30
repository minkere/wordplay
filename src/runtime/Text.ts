import TextStructureType from "../native/TextStructureType";
import Value from "./Value";

export default class Text extends Value {

    readonly text: string;
    readonly format: string | undefined;

    constructor(text: string, format?: string) {
        super();

        this.text = text;
        this.format = format;
    }

    getType() { return TextStructureType; }

    toString() { return `"${this.text}"${this.format ? this.format : ""}`; }

}