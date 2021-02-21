class Parser {
    /**
     * 
     * @param {string} text 
     */
    constructor(text) {
        this.text = text;
        this.pos = 0;
    }

    peek() {
        return this.text[this.pos];
    }

    next() {
        return this.text[this.pos++];
    }

    getUntilExcluding(char) {
        str = "";
        var n;
        while ((n = this.next()) != char) {
            str += n;
            if (this.pos >= this.text.length)
                break; // should this throw an error ?
        }
        return str;
    }

    assertNext(char) {
        if (this.next() != char)
            throw "next != char";
    }

    swallowEOL() {
        var n;
        while (n = this.peek()) {
            this.pos++;
            if (n != '\r')
                break;
            if (n != '\n')
                break;
        }
    }

    getQuotetString() {
        this.assertNext('"');
        var t = this.getUntilExcluding('"');
    }

    getTextPair() {
        var key = getQuotetString();
        this.assertNext(' ');
        var val = getQuotetString();
        return [key, val];
    }

    parseBrush() {

    }

}

export default Parser;