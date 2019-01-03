// LaTeXparse.js: a Parser for Simplified LaTeX
// Peter Jipsen, Version of 2010-10-21, math.chapman.edu/~jipsen/LaTeX

// Based on Douglas Crockford's Top Down Operator Precedence
// In turn based on Vaughn Pratt's 1973 top down parsing algorithm
// http://javascript.crockford.com/tdop/index.html

// nud = null denotation
// led = left denotation
// bp  = binding power

String.prototype.tokens = function () {
    var c;                      // The current character.
    var from;                   // The index of the start of the token.
    var i = 0;                  // The index of the current character.
    var length = this.length;
    var n;                      // The number value.
    var str;                    // The string value.
    var result = [];            // An array to hold the results.

    var make = function (typ, sym) {
// Make a token object.
        return {
            typ: typ,
            sym: sym,
            from: from,
            to: i
        };
    };
// Begin tokenization. If the source string is empty, return nothing.
    if (!this) {
        return;
    }
// Loop through this text, one character at a time.
    c = this.charAt(i);
    while (c) {
        from = i;
// Ignore whitespace.
        if (c <= ' ') {
            i += 1;
            c = this.charAt(i);
// name.
        } else if (c >= 'a' && c <= 'z') {
            str = c;
            i += 1;
            result.push(make(null, str));
            c = this.charAt(i);
        } else if (c >= 'A' && c <= 'Z') {
            str = c;
            i += 1;
            result.push(make('set', str));
            c = this.charAt(i);
        } else if (c=='\\') {
            str = c;
            i += 1;
            c = this.charAt(i);
            if (c <= ' ') {
                i += 1;
                c = this.charAt(i);
	    } else if (c=='{' || c=='}') {// || c==' '){
                str += c;
                i += 1;
                c = this.charAt(i);
                result.push(make(null, str));
            } else {
                for (;;) {
                    c = this.charAt(i);
                    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')){
                        str += c;
                        i += 1;
                    } else {
                        break;
                    }
                }
                if (str=="\\mbox") {
		    str = "";
		    i += 1;
		    c = this.charAt(i);
                    while (c>=' ' && c!='}') {
			str += c;
			i += 1;
			c = this.charAt(i);
		    }
		    i += 1;
		    c = this.charAt(i);
		    result.push(make(null, '\\mbox'));
		} else if (str=="\\left") {
                    str += c;
		    i += 1;
		    c = this.charAt(i);
		} else if (str=="\\right") {
                    str += c;
		    i += 1;
		    c = this.charAt(i);
		}
                result.push(make(null, str));
	    }
// number.

// A number cannot start with a decimal point. It must start with a digit,
// possibly '0'.
        } else if (c >= '0' && c <= '9') {
            str = c;
            i += 1;
// Look for more digits.
            for (;;) {
                c = this.charAt(i);
                if (c < '0' || c > '9') {
                    break;
                }
                i += 1;
                str += c;
            }
// Look for a decimal fraction part.
            if (c === '.') {
                i += 1;
                str += c;
                for (;;) {
                    c = this.charAt(i);
                    if (c < '0' || c > '9') {
                        break;
                    }
                    i += 1;
                    str += c;
                }
            }
// Convert the string to a number. If it is finite, then it is a good token.
            n = +str;
            if (isFinite(n)) {
                result.push(make('number', str));
            } else {
                make('number', str).error("Bad number");
            }
// comment.
        } else if (c === '%') {
            do {
                i += 1;
                c = this.charAt(i);
	    }
	    while (c !== '\n' && c !== '\r' && c !== '');
// single-character operator
        } else {
            i += 1;
            result.push(make(null, c));
            c = this.charAt(i);
        }
    }
    return result;
};

var make_parse = function () {
    var symbol_table = {};
    var token;
    var tokens;
    var token_nr;

    var advance = function (id) {
        var a, o, t, v;
        if (id && token.sym !== id) {
            token.error("Expected '" + id + "'.");
        }
        if (token_nr >= tokens.length) {
            token = symbol_table["(end)"];
            return;
        }
        t = tokens[token_nr];
        token_nr += 1;
        v = t.sym;
        a = t.typ;
        if (!a||a === "set") {
            o = symbol_table[v];
            if (!o) {
                constant(v);
                o = symbol_table[v];
            }
        } else if (a ===  "number") {
            o = symbol_table["(literal)"];
            a = "term";
        } else {
            t.error("Unexpected token.");
        }
        token = Object.create(o);
        token.error = parseerror;
        token.from  = t.from;
        token.to    = t.to;
        token.sym = v;
        if (a) token.typ = a;
        token.bp = o.lbp;
        token.toLaTeX = function() {return this.sym.charAt(0)=="\\" ? this.sym+" " : this.sym};
    };

    var expression = function (rbp, nbl) {
        var left, newleft;
        var t = token;
        advance();
        left = t.nud();
        while (rbp<token.lbp || token.lbp==0 && !nbl && rbp<72) {
            if (token.lbp==0 && !nbl && rbp<72) {
		t = Object.create(symbol_table["\\,"]);
		t.sym = "\\,";
                t.bp = 72;
		t.error = parseerror;
		t.typ = "term";
		newleft = t.led(left, true);
                if (left.sym == "\\,") {
		    left.arg.push(newleft.arg[1]);
		} else left = newleft;
	    }
	    if (rbp<token.lbp) {
		t = token;
		advance();
		left = t.led(left, nbl);
	    }
        }
        return left;
    };

    var original_symbol = {
        nud: function () {
            this.error("Undefined.");
        },
        led: function (left) {
            this.error("Missing operator.");
        }
    };

    var symbol = function (id, bp, typ, vsym) {
        var s = symbol_table[id];
        bp = bp || 0;
        if (s) {
            if (bp >= s.lbp) {
                s.lbp = bp;
            }
        } else {
            s = Object.create(original_symbol);
            s.sym = id;
            if (typ) s.typ = typ;
            if (vsym) s.vsym = vsym;
            s.lbp = bp;
	    s.error = parseerror;
            symbol_table[id] = s;
        }
        return s;
    };

    var constant = function (s, v, typ, vsym) {
        var x = symbol(s, 0, typ, vsym);
        x.nud = function () {
            var s = symbol_table[this.sym];
            this.sym = s.sym
            if (s.typ) this.typ = s.typ;
            if (s.vsym) this.vsym = s.vsym;
            return this;
        };
        x.sym = v?v:s;
    };

    var constants = function (a, typ, vsym) {
        for (var i in a) constant(a[i], a[i], typ, vsym);
    };

    var infix = function (id, bp, led) {
        var s = symbol(id, bp);
        s.led = led || function (left, nbl) {
            this.arg = left;
            this.arg2 = expression(bp, nbl);
            if (bp<=35) this.typ = this.arg.typ=="formula"&&this.arg2.typ=="formula"?"formula":"error";
            else if (this.typ=="set") this.typ=this.arg.typ=="set"&&this.arg2.typ=="set"?"set":"error";
	    else { //check if all are term or func or null
		if (this.arg.typ) {
		    if (this.arg.typ=="formula"||this.arg.typ=="set") this.typ = "error";
		    else if (this.arg.typ=="function") this.typ = "function";
		}else if (this.arg2.typ) {
		    if (this.arg2.typ=="formula"||this.arg2.typ=="set") this.typ = "error";
		    else if (this.arg2.typ=="function") this.typ = "function";
		}
		if (this.typ != "error") {
		    if (bp<=40) this.typ = "formula";
		    else if (this.typ!="function") this.typ = "term";
		}
	    }
	    this.toLaTeX = function(){
		if (this.sym=="\\choose")
                    return "{"+this.arg.toLaTeX()+"\\choose "+this.arg2.toLaTeX()+"}";
                return wrapLaTeX(this.arg,this)+this.sym+
		(this.sym.charAt(0)=="\\"?" ":"")+wrapLaTeX(this.arg2,this)};
            return this;
        };
    };

    var infixr = function (id, bp, led) {
        var s = symbol(id, bp);
        s.led = led || function (left, nbl) {
            this.arg = left;
            this.arg2 = expression(bp - 1, nbl);
            if (bp<=35) this.typ = this.arg.typ=="formula"&&this.arg2.typ=="formula"?"formula":"error";
            else if (this.typ=="set") this.typ=this.arg.typ=="set"&&this.arg2.typ=="set"?"set":"error";
	    else { //check if all are term or func or null
		if (this.arg.typ) {
		    if (this.arg.typ=="formula"||this.arg.typ=="set") this.typ = "error";
		    else if (this.arg.typ=="function") this.typ = "function";
		}else if (this.arg2.typ) {
		    if (this.arg2.typ=="formula"||this.arg2.typ=="set") this.typ = "error";
		    else if (this.arg2.typ=="function") this.typ = "function";
		}
		if (this.typ != "error") {
		    if (bp<=40) this.typ = "formula";
		    else if (this.typ!="function") this.typ = "term";
		}
	    }
	    this.toLaTeX = function(){
		if (this.sym=="^" || this.sym=="_")
                    return wrapLaTeX(this.arg,this,true)+this.sym+wrapLaTeX(this.arg2,this,true,true);
                return wrapLaTeX(this.arg,this)+this.sym+
                (this.sym.charAt(0)=="\\"?" ":"")+wrapLaTeX(this.arg2,this);
            };
            return this;
        };
    };

    var checkall = function (a, typ) {
        for (var i in a) if (a[i].typ != typ) return false;
        return true;
    };

    var infixchain = function (id, bp, led) {
        var s = symbol(id, bp);
        s.led = led || function (left, nbl) {
            var a = [left];
            if (token.sym !== "(end)") {
                while (true) {
                    a.push(expression(bp, nbl));
                    if (token.sym !== id) {
                        break;
                    }
                    advance(id);
                }
            }
            this.arg = a;
            if (bp<=35) this.typ = checkall(a,"formula")?"formula":"error";
            else if (this.typ=="set") this.typ = checkall(a,"set")?"set":"error";
            else if (this.sym=="\\in") this.typ = checkall(a.slice(1),"set")?"formula":"error";
	    else { //check if all are term or func or null
		for (var i in a) {
		    if (a[i].typ) 
			if (a[i].typ=="formula"||a[i].typ=="set") {this.typ = "error"; break;}
			else if (a[i].typ=="function")
			    this.typ = this.sym=="\\,"&&a[a.length-1].typ!="function"?"term":"function";
		}
		if (this.typ != "error") {
		    if (bp<=40) this.typ = "formula";
		    else if (this.typ!="function") this.typ = "term";
		}
	    }
	    if (this.typ=="error")
		if (this.sym=="=") this.typ = checkall(a,"set")?"set":"error";
		else if (this.sym=="\\,") {
		    if (this.arg.length==2&&this.arg[0].typ=="function"&&this.arg[1].typ=="set")
			this.typ = "set";
		    else for (var i in a) if (a[i].sym=="\\mbox") {this.typ = "formula"; break;}
		}
	    this.toLaTeX = function(){
		var st = this.arg.length==0 ? this.sym : wrapLaTeX(this.arg[0],this);//,true);
                if (this.sym=="\\,") {
        	    for (var i=1; i<this.arg.length; i++) {
			if (this.arg[i-1].typ=="function" && this.arg[i-1].vsym) 
                            st += "("+this.arg[i].toLaTeX()+")";
			else if (i==this.arg.length-1 && this.arg[i].arg3) //prefixop
                            st += " "+this.arg[i].toLaTeX();
                        else st += " "+wrapLaTeX(this.arg[i],this,true);
		    }
                    return st;
		}
		for (var i=1; i<this.arg.length; i++) 
		    st += this.sym+(this.sym.charAt(0)=="\\"?" ":"")+wrapLaTeX(this.arg[i],this,true);
		return st;
            };
            return this;
        };
    };

    var postfix = function (id, bp, led) {
        var s = symbol(id, bp);
        s.led = led || function (left) {
            this.arg = left;
            this.bp = bp;
            if (left.typ) this.typ = left.typ;
            if (left.vsym) this.vsym = left.vsym;
            this.toLaTeX = function(){return wrapLaTeX(this.arg,this)+this.sym};
            return this;
        };
    };

    var prefix = function (id, bp, nud) {
        var s = symbol(id);
        s.nud = nud || function () {
            this.arg = expression(bp);
            this.bp = bp;
            this.typ = this.sym=="\\mathbb"||this.sym=="\\mathcal"?"set":
                       this.arg.typ=="term"?"term":"error";
            if (this.sym=="\\mathcal"&&this.arg.sym=="P") {
		this.typ = "function";
		this.vsym = true;
	    }
            this.toLaTeX = function(){return this.sym+" "+wrapLaTeX(this.arg,this)};
            return this;
        };
    };

    var prefixLaTeX = function (id) {
        var s = symbol(id);
        s.nud = function () {
            this.arg = expression(100);
            this.bp = 100;
            this.typ = this.arg.typ?this.arg.typ:"formula";
            this.toLaTeX = function(){return this.sym+"{"+this.arg.toLaTeX()+"}"};
            return this;
        };
    };

    var prefixop = function (id, bp, nud) {
        var s = symbol(id);
        s.nud = nud || function () {
            if (token.sym === "_") {
                advance("_");
                this.arg = expression(75, true);
            }
            if (token.sym === "^") {
                advance("^");
                this.arg2 = expression(bp, true);
            }
            this.arg3 = expression(bp);
            this.bp = bp;
            this.typ = (!this.arg||this.arg.typ=="formula"||!this.arg.typ)&&
                       (!this.arg2||this.arg2.typ=="term"||!this.arg2.typ)&&
                       (this.arg3.typ==this.typ||!this.arg3.typ)?this.typ:"error";
            this.toLaTeX = function(){
                return this.sym+(this.arg?"_{"+this.arg.toLaTeX()+"}":"")+
		(this.arg2?"^"+wrapLaTeX(this.arg2,this,false,true):" ")+
		wrapLaTeX(this.arg3,this);
            };
            return this;
        };
    };

    symbol("(end)", -1);
    symbol("|", -1);
    symbol(")", -1);
    symbol("]", -1);
    symbol("}", -1);
    symbol("\\rfloor", -1);
    symbol("\\rceil", -1);
    symbol("\\right)", -1);
    symbol("\\}", -1);
    symbol("(literal)").nud = function() {return this;};
    constants(["f","g","F","G"], "function", true);
    constants(["L"], "term");
    constants(["\\sin","\\cos","\\tan","\\cot","\\sec","\\csc","\\ln","\\log","\\gcd","\\lcm","\\det"], "function");
    constants(["\\cap","\\cup","\\setminus","\\bigcup","\\bigcap","\\subset","\\subseteq","\\supset","\\supseteq"], "set");
    constants(["\\bigvee","\\bigwedge","\\lor","\\land","\\neg","\\iff"], "formula", true);

    isMetaLogical = function(s) {return s.bp <20};
    infixr("\\vdash", 10);
    infixr("\\models", 10);
    infix("\\mid", 15);
    infix(":", 15);

    //logical symbols
    isLogical = function(s) {return 20<=s.bp && s.bp<39};
    infixr("\\to", 20);
    infixr("\\implies", 20);
    infixr("\\Rightarrow", 20);
    infixr("\\iff", 20);
    infixr("\\Leftrightarrow", 20);
    infixr("\\equiv", 20);
    infixchain("\\land", 30);
    infixchain("\\lor", 30);
    prefix("\\neg", 35);

    //relation symbols
    isRelation = function(s) {return 40<=s.bp && s.bp<49};
    infixchain("\\in", 40);
    infixchain("=", 40);
    infixchain("\\ne", 40);
    infixchain("\\approx", 40);
    infixchain("\\cong", 40);
    infixchain("<", 40);
    infixchain("\\le", 40);
    infixchain(">", 40);
    infixchain("\\ge", 40);
    infix("|", 37, function (left, nbl) {
            //if (nbl) return left;
            this.arg = left;
            this.arg2 = expression(37, nbl);
            if (token.sym == "|") {
		advance();
		var t = Object.create(symbol_table["\\,"]);
		var right = Object.create(symbol_table["|"]);
                right.sym = "|";
		t.sym = "\\,";
		t.bp = 72;
		t.error = right.error = parseerror;
                right.bp = 80;
                right.arg = this.arg2;
		right.typ = right.arg.typ=="term"||right.arg.typ=="set"||!right.arg.typ?"term":"error";
                right.toLaTeX = function(){return "|"+this.arg.toLaTeX()+"|"};
		t.typ = left.typ=="term"&&right.typ=="term"?"term":"error";
                t.arg = [left, right];
	        t.toLaTeX = function(){
		    var st = this.arg.length==0 ? this.sym : wrapLaTeX(this.arg[0],this,true);
        	    for (var i=1; i<this.arg.length; i++) {
			if (this.arg[i-1].typ=="function" && this.arg[i-1].vsym) 
                            st += "("+this.arg[i].toLaTeX()+")";
			else if (i==this.arg.length-1 && this.arg[i].arg3) //prefixop
                            st += " "+this.arg[i].toLaTeX();
                        else st += " "+wrapLaTeX(this.arg[i],this,true);
		    }
                    return st;
		}
                return t;
	    }
            this.typ = (this.arg.typ=="term"||!this.arg.typ)&&(this.arg2.typ=="term"||!this.arg2.typ)?
		"formula":"error";
	    this.toLaTeX = function(){
                return wrapLaTeX(this.arg,this)+this.sym+wrapLaTeX(this.arg2,this)};
            return this;
	});
    infixr("R", 40); //relation symbol
    infixchain("\\subset", 40);
    infixchain("\\subseteq", 40);
    infixchain("\\supset", 40);
    infixchain("\\supseteq", 40);
    infixchain(",", 45);

    //function symbols
    isFunction = function(s) {return 50<=s.bp};
    infixchain("\\setminus", 50);
    infixchain("\\cup", 50);
    infixchain("\\cap", 50);
    infixchain("\\vee", 50);
    infixchain("\\wedge", 50);
    infixchain("+", 50);
    infix("-", 50);
    infix("\\pm", 50);
    infixchain("\\times", 60);
    infixchain("\\cdot", 60);
    infixchain("\\circ", 60);
    infix("/", 60);
    infix("\\div", 60);
    infix("\\mod", 60);
    infix("\\choose", 60);
    infixchain("\\,", 72);
    infixr("^", 75);
    infixr("_", 77);

    prefix("-", 70, function () {
	    if (token.sym=="}") {
		this.toLaTeX = function(){return this.sym};
		return this;
            }
            try {
                this.arg = expression(70);
            } catch(e) {
                if (e.name=="SyntaxError") {
		    this.toLaTeX = function(){return this.sym};
		    return this;
		}
	    }
            this.bp = 70;
            this.toLaTeX = function(){return this.sym+" "+wrapLaTeX(this.arg,this)};
            return this;
        });
    prefix("+", 70, function () {
	    if (token.sym=="}") {
		this.toLaTeX = function(){return this.sym};
		return this;
            }
            try {
                this.arg = expression(70);
            } catch(e) {
                if (e.name=="SyntaxError") {
		    this.toLaTeX = function(){return this.sym};
		    return this;
		}
	    }
            this.bp = 70;
            this.toLaTeX = function(){return this.sym+" "+wrapLaTeX(this.arg,this)};
            return this;
        });
    prefix("\\pm", 70);
    prefix("\\mathbb", 100);
    prefix("\\mathbf", 100);
    prefix("\\mathcal", 100);
    prefixLaTeX("\\mbox");
    prefixLaTeX("\\underline");
    postfix("'", 100);

    prefixop("\\sum", 50);
    prefixop("\\prod", 60);
    prefixop("\\bigvee", 40);
    prefixop("\\bigwedge", 40);
    prefixop("\\bigcup", 60);
    prefixop("\\bigcap", 60);

    prefix("\\forall", 35, function () {
	    this.arg = expression(35, true);
        this.arg2 = expression(35);
        this.typ = (this.arg.typ=="formula"||!this.arg.typ)&&(this.arg2.typ=="formula"||!this.arg2.typ)?"formula":"error";
        this.bp = 35;
        this.toLaTeX = function() {
            if (this.arg2.sym=="\\forall" || this.arg2.sym=="\\exists")
                return "\\ \\forall "+this.arg.toLaTeX()+this.arg2.toLaTeX();
	    return "\\ \\forall "+this.arg.toLaTeX()+"("+this.arg2.toLaTeX()+")";
        };
        return this;
    });

    prefix("\\exists", 35, function () {
	    this.arg = expression(35, true);
	    this.arg2 = expression(35);
        this.typ = (this.arg.typ=="formula"||!this.arg.typ)&&(this.arg2.typ=="formula"||!this.arg2.typ)?"formula":"error";
        this.bp = 35;
        this.toLaTeX = function() {
            if (this.arg2.sym=="\\forall" || this.arg2.sym=="\\exists")
                return "\\ \\exists "+this.arg.toLaTeX()+this.arg2.toLaTeX();
	    return "\\ \\exists "+this.arg.toLaTeX()+"("+this.arg2.toLaTeX()+")";
        };
        return this;
    });

    prefix("\\frac", 72, function () {
        this.arg = expression(100, true);
        this.arg2 = expression(100, true);
        this.typ = (this.arg.typ=="term"||!this.arg.typ)&&(this.arg2.typ=="term"||!this.arg2.typ)?"term":"error";
        this.bp = 72;
        this.toLaTeX = function(){return "\\frac{"+this.arg.toLaTeX()+"}{"+this.arg2.toLaTeX()+"}"};
        return this;
    });

    prefix("\\sqrt", 100, function () {
        if (token.sym=="[") {
            advance("[");
	    this.arg2 = expression(40);
            advance("]");
        }
        this.arg = expression(100);
        this.typ = (this.arg.typ=="term"||!this.arg.typ)&&(!this.arg2||this.arg2.typ=="term"||!this.arg2.typ)?"term":"error";
        this.bp = 100;
        this.toLaTeX = function(){
            return "\\sqrt"+(this.arg2?"["+this.arg2.toLaTeX()+"]":"")+"{"+this.arg.toLaTeX()+"}";
        };
        return this;
    });

    prefix("\\lim", 55, function () {
        advance("_");
        this.arg = expression(55, true);
        this.arg2 = expression(55);
        this.typ = (this.arg.sym=="\\to")&&(this.arg2.typ=="term"||!this.arg2.typ)?"term":"error";
        this.bp = 75;
        this.toLaTeX = function(){
            return "\\lim_{"+this.arg.toLaTeX()+"}"+this.arg2.toLaTeX();
        };
        return this;
    });

    prefix("|", 80, function () {
        this.arg = expression(45);
        advance("|");
        this.typ = this.arg.typ=="term"||this.arg.typ=="set"||!this.arg.typ?"term":"error";
        this.bp = 80;
        this.toLaTeX = function(){return "|"+this.arg.toLaTeX()+"|"};
        return this;
    });

    prefix("(", 0, function () {
        var e = expression(0);
        advance(")");
        return e;
    });

    prefix("\\left(", 0, function () {
        var e = expression(0);
        advance("\\right)");
        return e;
    });

    prefix("{", 0, function () {
        var e = expression(0);
        advance("}");
        return e;
    });

    prefix("[", 100, function () {
        this.arg = expression(45);
        advance("]");
        this.typ = this.arg.typ=="term"||this.arg.typ=="set"||!this.arg.typ?"term":"error";
        this.bp = 80;
        this.toLaTeX = function(){return "["+this.arg.toLaTeX()+"]"};
        return this;
    });

    prefix("\\lfloor", 80, function () {
        this.arg = expression(45);
        advance("\\rfloor");
        this.typ = this.arg.typ=="term"||!this.arg.typ?"term":"error";
        this.bp = 80;
        this.toLaTeX = function(){return "\\lfloor "+this.arg.toLaTeX()+"\\rfloor "};
        return this;
    });

    prefix("\\lceil", 80, function () {
        this.arg = expression(45);
        advance("\\rceil");
        this.typ = this.arg.typ=="term"?"term"||!this.arg.typ:"error";
        this.bp = 80;
        this.toLaTeX = function(){return "\\lceil "+this.arg.toLaTeX()+"\\rceil "};
        return this;
    });

    prefix("\\{", 38, function () {
        var a = [];
        if (token.sym !== "\\}") {
            a.push(expression(38,true));
            if (token.sym == "|" || token.sym == ":" || token.sym == "\\mid") {
                advance();
                this.arg = a[0];
                this.arg2 = expression(10);
            } else if (token.sym == ",") {
                advance(",");
                while (true) {
                    a.push(expression(0));
                    if (token.sym !== ",") {
                        break;
                    }
                    advance(",");
                }
                this.arg = a;
            } else this.arg = a;
        } else this.arg = a;
        advance("\\}");
        this.typ = "set";
        this.bp = 60;
        this.toLaTeX = function(){
            if (this.arg2) return "\\{"+this.arg.toLaTeX()+"\\mid "+this.arg2.toLaTeX()+"\\}";
            var st = this.arg.length==0 ? "" : this.arg[0].toLaTeX();
	    for (var i=1; i<this.arg.length; i++) st += ", "+this.arg[i].toLaTeX();
            return "\\{"+st+"\\}"
        };
        return this;
    });

    var wrapLaTeX = function (subt, t, infix_r, brace) {
	//alert(subt.sym+":::"+subt.arg);
	if (subt.bp > t.bp || subt.bp == t.bp && !infix_r || !subt.arg || //subt.arg3 ||
            subt.arg && subt.arg.length==0 || subt.sym == t.sym && t.arg.length==1) 
            return subt.toLaTeX();
	if (brace) return "{"+subt.toLaTeX()+"}";
        return '\\left('+subt.toLaTeX()+'\\right)';
    };

    return function (source) {
        tokens = source.tokens();
        //st="";for (var i in tokens)st+=tokens[i].sym+" ";
        token_nr = 0;
        advance();
        var s = expression(0);
        return s;
    };
};


if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

// Transform a token object into an exception object and throw it.
parseerror = function (message, t) {
    t = t || this;
    t.name = "SyntaxError";
    t.message = message;
    throw t;
};
/*
typeerror = function (message, t) {
    t = t || this;
    t.name = "TypeError";
    t.message = message;
    throw t;
};
*/
    var parse = make_parse();

    function goparse(source) {
        var string, tree;
        try {
            tree = parse(source);
            string = JSON.stringify(tree, ['key', 'name', 'message',
		   'sym', 'bp', 'typ', 'vsym', 'arg', 'arg2', 'arg3'], 4);
        } catch (e) {
            if (e.name=="SyntaxError") {
                string = JSON.stringify(e, ['name', 'message', 'from', 'to',
		    'key', 'sym', 'bp', 'typ', 'vsym', 'arg', 'arg2', 'arg3'], 4);
            } else throw e;
        }
        document.getElementById('OUTPUT').innerHTML = string
            .replace(/&/g, '&amp;')
            .replace(/[<]/g, '&lt;');
        if (tree) return tree.toLaTeX();
        return "undefined"
    }

    function syntaxcheck(source) {
        var tree;
        try {
            tree = parse(source);
            if (tree.typ=="error") return "\\underline{\\underline{"+tree.toLaTeX()+"}}";
            return tree.toLaTeX();
        } catch (e) {
            if (e.name=="SyntaxError") {
                return "\\underline{"+source+"}";
            } else throw e;
        }
    }


function obj2str(obj, obj_name) {
  var result = ""
  for (var i in obj)
    result += i + " = " + obj[i] + "; "
  return result
}

function equalExpr(p,q) {
if (p==null || q==null || p.sym==null || q.sym==null) {
  document.write(obj2str(p),obj2str(q),"*******equalExpr*******");
  return false;
}
  if (p.sym!=q.sym) return false;
  if (p.arg.length!=q.arg.length) return false;
  if (p.arg.length==0) return true;
  for (var i=0; i<p.arg.length; i++)
    if (!equalExpr(p.arg[i],q.arg[i])) return false;
  return true;
}

function clone(t) {
  var b=[];
  for (var i=0; i<t.arg.length; i++)
    b[i]=clone(t.arg[i]);
  return new Expr(t.symbol,b,0);
}

// a substitution is a list of terms with sub[i] to replace vari[i]
function appl(t,sub) {
  if (t.symbol.vari || t.symbol.formulavari) 
    if (sub[t.symbol.index]==null) 
      return clone(currentSubstitution[t.symbol.index]);
    else return clone(sub[t.symbol.index]);
  var a=[];
  for (var i=0; i<t.arg.length; i++)
    a[i]=appl(t.arg[i],sub);
  return new Expr(t.symbol,a,0);
}

substList=[];
premsList=[];

function match(q,t,sub) {
// Find substitution such that q==sub(t); return true if found.
//displayExprList(sub);
  if (t.symbol.vari)
    if (sub[t.symbol.index]==null) {
      if (q.symbol.conn || q.symbol.pred || q.symbol.formulavari) return false;
      sub[t.symbol.index]=q;
      if (substList.length<defaultSubstitution.length)
        add(substList,t.symbol.index);
      return true;
    } else 
      return equalExpr(sub[t.symbol.index],q);
  if (t.symbol.formulavari) {
    if (sub[t.symbol.index]==null) {
      if (!q.symbol.formulavari && !q.symbol.conn && !q.symbol.pred) 
        return false;
      sub[t.symbol.index]=q;
      if (substList.length<defaultSubstitution.length)
        add(substList,t.symbol.index);
      return true;
    } else 
      return equalExpr(sub[t.symbol.index],q);
  }
  if (t.symbol.name!=q.symbol.name) return false;
  if (t.arg.length!=q.arg.length) return false;
  for (var i=0; i<t.arg.length; i++)
    if (!match(q.arg[i],t.arg[i],sub)) return false;
  return true;
}

function allrewrites(q, stq, ind, s, t, ri, fw, li, subexpr) {
// Find all subst such that subst[i](s) is a subterm of q 
// and replace this subterm by subst[i](t)
  var sub=[];
  if (match(stq.arg[ind],s,sub)) {
    var temp=stq.arg[ind];
    stq.arg[ind]=appl(t,sub);
    add(li,{expr:clone(q.arg[0]),apply:true,rule:ri,forward:fw,
            pos:[],subst:sub});
    stq.arg[ind]=temp;
  }
//  if (subexpr) // match subexpr if not leq or implies   *************
//modified so that it always matches, but for leq or implies still generate
//monotonicity requirement and add to proof obligations 2003/5/15
    for (var i=0; i<stq.arg[ind].arg.length; i++) 
      allrewrites(q,stq.arg[ind],i,s,t,ri,fw,li,subexpr);
}

function oneStepEq(q,ru,ri,above) { 
// q focus expr, ru rule applied, side above/below
// return list of expressions after substitution, with rule
  var li=[];
  var nq=new Expr(minus,[q],0);
  var iffeq=ru.symbol==eq || ru.symbol==iffSymbol;
  if (iffeq || above)
    allrewrites(nq,nq,0,ru.arg[0],ru.arg[1],ri,true,li,iffeq);
  if (iffeq || !above)
    allrewrites(nq,nq,0,ru.arg[1],ru.arg[0],ri,false,li,iffeq);
  return li;
}

function matchConj(te,conj,sub,sl,li) {
// updates sub while looking for match of all conjuncts in te
// updates list of matching formulas, and substitution
  if (conj.symbol!=andSymbol) {
    for (var i=0; i<te.length; i++) {
      if (match(te[i].expr,conj,sub))
        add(li,{subst:sub.slice(0,sub.length),
          premises:premsList.concat([te[i].index])});
      if (substList.length>sl) {
        for (var j=sl; j<substList.length; j++)
          sub[substList[j]]=null;
        substList.length=sl;
      }
    }
  } else
    for (var i=0; i<te.length; i++) {
      if (match(te[i].expr,conj.arg[1],sub)) {
        add(premsList,te[i].index);
        matchConj(te,conj.arg[0],sub,substList.length,li);
        premsList.length--;
      }
      if (substList.length>sl) {
        for (var j=sl; j<substList.length; j++)
          sub[substList[j]]=null;
        substList.length=sl;
      }
    }
}

function oneStepForward(te,ru,ri) { 
// te = true expr, ru rule applied
// return list of expressions after substitution, with rule
  var li=[];
  var sub=[];
  var concli=[];
  substList=[];
  premsList=[];
  matchConj(te,ru.arg[0],sub,0,li);
  for (var i=0; i<li.length; i++)
    add(concli,{expr:appl(ru.arg[1],li[i].subst),apply:true,rule:ri,
            premises:li[i].premises,subst:li[i].subst});
  if (ru.symbol==iffSymbol) {
    li=[];
    sub=[];
    substList=[];
    premsList=[];
    matchConj(te,ru.arg[1],sub,0,li);
    for (var i=0; i<li.length; i++)
      add(concli,{expr:appl(ru.arg[0],li[i].subst),apply:true,rule:ri,
            premises:li[i].premises,subst:li[i].subst});
  }
  li=[];
  var exprli;
  for (var i=0; i<concli.length; i++)
    if (concli[i].expr.symbol==andSymbol) {
      exprli=conj2list(concli[i].expr,[]);
      for (var j=0; j<exprli.length; j++)
        add(li,{expr:exprli[j], apply:true, rule:ri, 
          premises:concli[i].premises, subst:concli[i].subst});
    } else add(li,concli[i]);
  return li;
}
