export class FakeTextDecoder extends TextDecoder {
    #encoding: string;

    constructor(label: string) {
        super("utf-16be");

        this.#encoding = label;
    }

    override get encoding() {
        return this.#encoding;
    }
}
