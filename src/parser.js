class Parser {
    /**
     * @param {string} text 
     */
    constructor(text) {
        this.text = text;
        this.pos = 0;
        this.countNewLine=0; // '\n' only
    }

    peek() {
        return this.text[this.pos];
    }

    next() {
        if( this.pos >= this.text.length )
            throw "pos >= text.length";
        var char = this.text[this.pos];
        this.pos++;
        if( char == '\n')
            this.countNewLine++;
        return char;
    }

    readUntilExcluding(char) {
        var str = "";
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
            if (this.pos >= this.text.length)
                break;
            if (n != '\r')
                break;
            if (n != '\n')
                break;
        }
    }

    readQuotetString() {
        this.assertNext('"');
        var t = this.readUntilExcluding('"');
    }

    readTextPair() {
        var key = this.readQuotetString();
        this.assertNext(' ');
        var val = this.readQuotetString();
        return [key, val];
    }

    readLine() {
        var line = this.readUntilExcluding('\r');
        this.swallowEOL();
        return line;
    }

    parseBrush() {
        var brush = [];
        this.swallowEOL();
        while(this.peek() != '}') {
            var planeLine = this.readLine();
            var plane = {};
            var planeLinesParts = planeLine.split(" ");
            [,plane.p1x,plane.p1z,plane.p1y,,,plane.p2x,plane.p2z,plane.p2y,,,plane.p3x,plane.p3z,plane.p3y] = planeLinesParts;
            plane.texture = planeLinesParts[15];
            brush.push(plane);
        }
        this.assertNext('}');
        return brush;
    }

    readPatchDef2() {
        var patchDef2 = this.readUntilExcluding('}');
        this.readUntilExcluding('}');
        return patchDef2;
    }

}

export default Parser;
