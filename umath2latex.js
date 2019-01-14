// umath2latex.js: a Parser for UnicodeMath to a latex string
// Peter Jipsen, Version of 2019-01-10, math.chapman.edu/~jipsen/UnicodeMath

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
    var str_tokens = ["or","ln","and","lim","sin","cos","tan","cot","sec","csc","log","gcd","lcm","det"];

    var make = function (typ, sym) { // Make a token object.
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
        } else if (str_tokens.indexOf(this.slice(i,i+3)) != -1) {
            str = this.slice(i,i+3);
            i += 3;
            result.push(make(null, str));
            c = this.charAt(i);
        } else if (str_tokens.indexOf(this.slice(i,i+2)) != -1) {
            str = this.slice(i,i+2);
            i += 2;
            result.push(make(null, str));
            c = this.charAt(i);
        } else if (c >= 'a' && c <= 'z') {
            str = c;
            i += 1;
            result.push(make(null, str));
            c = this.charAt(i);
        } else if (c >= 'A' && c <= 'Z') {
            str = c;
            i += 1;
            result.push(make('set', str)); //remove this
            c = this.charAt(i);
        } else if (c=='\\') {  // read LaTeX style names, but remove for UnicodeMath
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
                if (str=="\\mbox") { //remove this
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
		        }
                result.push(make(null, str));
	        }
// number.
// A number cannot start with a decimal point. It must start with a digit, possibly '0'.
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
// single Unicode character operator
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
        if (!a || a === "set") {
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
        //console.log("calling t.nud "+t.sym+" rbp"+rbp+" toklbp"+token.lbp)
        left = t.nud();
        while (rbp<token.lbp || (token.lbp==0 && !nbl && rbp<72)) {
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

    var wrapLaTeX = function (subt, t, infix_r, brace) {
    	//console.log(subt.sym+":::"+subt.arg);
	    if (subt.bp > t.bp || !subt.arg || //subt.bp == t.bp && !infix_r || //subt.arg3 ||
            subt.arg && subt.arg.length==0 || subt.sym == t.sym && t.arg.length==1) 
            return subt.toLaTeX();
	    if (brace) return "{"+subt.toLaTeX()+"}";
        return '('+subt.toLaTeX()+')';  // removed \\left, \\right
    };

    var original_symbol = {
        nud: function () {
            this.error("Undefined null denotation: ");
        },
        led: function (left) {
            this.error("Missing operator.");
        }
    };

    var symbol = function (id, tex, bp, typ, vsym) {
        var s = symbol_table[id];
        bp = bp || 0;
        if (s) {
            if (bp >= s.lbp) {
                s.lbp = bp;
            }
        } else {
            s = Object.create(original_symbol);
            s.sym = id;
            s.tex = tex;
            if (typ) s.typ = typ;
            if (vsym) s.vsym = vsym;
            s.lbp = bp;
    	    s.error = parseerror;
            symbol_table[id] = s;
        }
        return s;
    };

    var constant = function (s, v, typ, vsym) {
        var x = symbol(s, s, 0, typ, vsym);
        x.nud = function () {
            var s = symbol_table[this.sym];
            this.sym = s.sym
            if (s.typ) this.typ = s.typ;
            if (s.vsym) this.vsym = s.vsym;
            if (this.typ=="function" && token.sym!="^") {
                this.arg = expression(100);
                this.bp = 100
                this.toLaTeX = function(){
                    if (this.arg) {
                        var st = wrapLaTeX(this.arg,this)
                        return this.tex+(st.charAt(0)=="("?"":"(")+st+(st.charAt(0)=="("?"":")")
                    } else return this.tex;
                };
            }
            return this;
        };
        x.sym = v?v:s;
    };

    var constants = function (a, typ, vsym) {
        for (var i in a) constant(a[i], a[i], typ, vsym);
    };

    var infix = function (id, tex, bp, led) {
        var s = symbol(id, tex, bp);
        s.led = led || function (left, nbl) {
            this.arg = left;
            this.arg2 = expression(bp, nbl);
            if (bp<=35) this.typ = this.arg.typ=="formula"&&this.arg2.typ=="formula"?"formula":"error";
            else if (this.typ=="set") this.typ=this.arg.typ=="set"&&this.arg2.typ=="set"?"set":"error";
	    else { //check if all are term or func or null
	    	if (this.arg.typ) {
		        if (this.arg.typ=="formula"||this.arg.typ=="set") this.typ = "error";
		        else if (this.arg.typ=="function") this.typ = "function";
	    	} else if (this.arg2.typ) {
		        if (this.arg2.typ=="formula"||this.arg2.typ=="set") this.typ = "error";
		        else if (this.arg2.typ=="function") this.typ = "function";
		    }
		    if (this.typ != "error") {
		        if (bp<=40) this.typ = "formula";
		        else if (this.typ!="function") this.typ = "term";
		    }
	    }
	    this.toLaTeX = function(){
        return wrapLaTeX(this.arg,this)+this.tex+
		    (this.tex.charAt(0)=="\\"?" ":"")+wrapLaTeX(this.arg2,this)};
            return this;
        };
    };

    var infixr = function (id, tex, bp, led) {
        var s = symbol(id, tex, bp);
        s.led = led || function (left, nbl) {
            this.arg = left;
            this.arg2 = expression(bp - 1, nbl);
            if (bp<=35) this.typ = this.arg.typ=="formula" && this.arg2.typ=="formula"?"formula":"error";
            else if (this.typ=="set") this.typ=this.arg.typ=="set" && this.arg2.typ=="set"?"set":"error";
	        else { //check if all are term or function or null
		        if (this.arg.typ) {
		            if (this.arg.typ=="formula" || this.arg.typ=="set") this.typ = "error";
		            else if (this.arg.typ=="function") this.typ = "function";
		        } else if (this.arg2.typ) {
		            if (this.arg2.typ=="formula" || this.arg2.typ=="set") this.typ = "error";
		            else if (this.arg2.typ=="function") this.typ = "function";
		        }
		        if (this.typ != "error") {
		            if (bp<=40) this.typ = "formula";
		            else if (this.typ!="function") this.typ = "term";
		        }
	        }
	        this.toLaTeX = function(){
	    	    if (this.sym=="^" || this.sym=="_")
                    return wrapLaTeX(this.arg,this,true)+this.tex+wrapLaTeX(this.arg2,this,true,true);
                return wrapLaTeX(this.arg,this)+(this.bp<50?" ":"")+this.tex+
                    (this.bp<50 || this.tex.charAt(0)=="\\" ? " " : "")+wrapLaTeX(this.arg2,this);
            };
            return this;
        };
    };

    var checkall = function (a, typ) {
        for (var i in a) if (a[i].typ != typ) return false;
        return true;
    };

    var infixchain = function (id, tex, bp, led) {
        var s = symbol(id, tex, bp);
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
            else if (this.sym=="∈") this.typ = checkall(a.slice(1),"set")?"formula":"error";
	        else { //check if all are term or func or null
                for (var i in a) {
                    if (a[i].typ) 
                        if (a[i].typ=="formula" || a[i].typ=="set") {this.typ = "error"; break;}
                        else if (a[i].typ=="function")
                            this.typ = this.sym=="\\," && a[a.length-1].typ!="function"?"term":"function";
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
                    var st = this.arg.length==0 ? this.tex : wrapLaTeX(this.arg[0],this);//,true);
                    if (this.sym=="\\,") {
                        for (var i=1; i<this.arg.length; i++) {
                            //if (this.arg[i-1].typ=="function" && this.arg[i-1].vsym) 
                            //    st += "("+this.arg[i].toLaTeX()+")";
                            if (i==this.arg.length-1 && this.arg[i].arg3) //prefixop
                                st += " "+this.arg[i].toLaTeX();
                            else st += wrapLaTeX(this.arg[i],this,true);  //deleted space after +=
                        }
                        return st;
                    }
                    var st1 = this.bp<50 && this.sym!="," ? " " : ""
                    var st2 = (this.bp<50 || this.tex.charAt(0)=="\\") && this.sym!="," ? " " : ""
                    for (var i=1; i<this.arg.length; i++) 
                        st += st1+this.tex+st2+wrapLaTeX(this.arg[i],this,true);
                    return st;
                };
            return this;
        };
    };

    var postfix = function (id, tex, bp, led) {
        var s = symbol(id, tex, bp);
        s.led = led || function (left) {
            this.arg = left;
            this.bp = bp;
            if (left.typ) this.typ = left.typ;
            if (left.vsym) this.vsym = left.vsym;
            this.toLaTeX = function(){return wrapLaTeX(this.arg,this)+this.tex};
            return this;
        };
    };

    var prefix = function (id, tex, bp, nud) {
        var s = symbol(id, tex);
        s.nud = nud || function () {
            this.arg = expression(bp);
            this.bp = bp;
            this.toLaTeX = function(){return this.tex+" "+wrapLaTeX(this.arg,this)};
            return this;
        };
    };

    var prefixop = function (id, tex, bp, nud) {
        var s = symbol(id, tex);
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
                return this.tex+(this.arg?"_"+wrapLaTeX(this.arg,this,false,true):"")+
                //"_{"+this.arg.toLaTeX()+"}":"")+
		        (this.arg2?"^"+wrapLaTeX(this.arg2,this,false,true):" ")+
		        wrapLaTeX(this.arg3,this);
            };
            return this;
        };
    };

    symbol("(end)", "", -1);
    symbol("|", "|", -1);
    symbol(")", ")", -1);
    symbol("]", "]", -1);
    symbol("}", "}", -1);
    symbol("⌋", "\\rfloor", -1);
    symbol("⌉", "\\rceil", -1);
    symbol("\\}", "\\}", -1);
    symbol("(literal)", "").nud = function() {return this;};
    constants(["f","g","F","G"], "function", true);
    constants(["L"], "term");
    constants(["sin","cos","tan","cot","sec","csc","ln","log","gcd","lcm","det"], "function");
    constants(["\\cap","\\cup","\\setminus","\\bigcup","\\bigcap","\\subset","\\subseteq","\\supset","\\supseteq"], "set");
    constants(["\\bigvee","\\bigwedge","\\lor","\\land","\\neg","\\iff"], "formula", true);

    isMetaLogical = function(s) {return s.bp <20};
    infixr("⊢", "\\vdash", 10);
    infixr("⊨", "\\models", 10);
    infix("∣", "\\mid", 15);
    infix(":", ":", 15);

    //logical symbols
    isLogical = function(s) {return 20<=s.bp && s.bp<39};
    infixr("⟹", "\\implies", 20);
    infixr("⟺", "\\iff", 20);
    infixchain("and", "\\land", 30);
    infixchain("or", "\\lor", 30);
    prefix("¬", "\\neg", 35);

    //relation symbols
    isRelation = function(s) {return 40<=s.bp && s.bp<49};
    infixchain("∈", "\\in", 40);
    infixchain("=", "=", 40);
    infixchain("≠", "\\ne", 40);
    infixchain("≈", "\\approx", 40);
    infixchain("≅", "\\cong", 40);
    infixchain("≡", "\\equiv", 40);
    infixchain("<", "<", 40);
    infixchain("≤", "\\le", 40);
    infixchain(">", ">", 40);
    infixchain("≥", "\\ge", 40);
    infixr("→", "\\to", 40);
    infix("|", "|", 37, function (left, nbl) {
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
                    var st = this.arg.length==0 ? this.tex : wrapLaTeX(this.arg[0],this,true);
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
        this.typ = (this.arg.typ=="term"||!this.arg.typ)&&(this.arg2.typ=="term"||!this.arg2.typ)?"formula":"error";
	    this.toLaTeX = function(){
            return wrapLaTeX(this.arg,this)+this.tex+wrapLaTeX(this.arg2,this)};
        return this;
	});
    infixr("R", "R", 40); //relation symbol
    infixchain("⊂", "\\subset", 40);
    infixchain("⊆", "\\subseteq", 40);
    infixchain("⊃", "\\supset", 40);
    infixchain("⊇", "\\supseteq", 40);
    infixchain(",", ",", 45);

    //function symbols
    isFunction = function(s) {return 50<=s.bp};
    infix("∖", "\\setminus", 50);
    infix("∪", "\\cup", 50);
    infix("∩", "\\cap", 50);
    infix("∨", "\\vee", 50);
    infix("∧", "\\wedge", 50);
    infix("+", "+", 50);
    infix("-", "-", 50);
    infix("±", "\\pm", 50);
    infix("×", "\\times", 60);
    infix("⋅", "\\cdot", 60);
    infix("∘", "\\circ", 60);
    infix("/", "/", 60);
    infix("div", "\\div", 60);
    infix("mod", "\\mod", 60);
    infixchain("\\,", "\\,", 72);
    infixr("^", "^", 75);
    infixr("_", "_", 77);

    prefix("-", "-", 70, function () {
	    if (token.sym=="}") {
    		this.toLaTeX = function(){return this.tex};
	    	return this;
        }
        try {
            this.arg = expression(70);
        } catch(e) {
            if (e.name=="SyntaxError") {
		        this.toLaTeX = function(){return this.tex};
	        	return this;
		    }
	    }
        this.bp = 70;
        this.toLaTeX = function(){return this.tex+wrapLaTeX(this.arg,this)};
        return this;
    });
    prefix("±", "\\pm", 70);
    postfix("'", "'", 100);

    prefixop("∑", "\\sum", 50);
    prefixop("∫", "\\int", 50);
    prefixop("∏", "\\prod", 60);
    prefixop("⋁", "\\bigvee", 40);
    prefixop("⋀", "\\bigwedge", 40);
    prefixop("⋃", "\\bigcup", 60);
    prefixop("⋂", "\\bigcap", 60);

    prefix("∀", "\\forall", 35, function () {
	    this.arg = expression(35, true);
        this.arg2 = expression(35);
        this.typ = (this.arg.typ=="formula"||!this.arg.typ)&&(this.arg2.typ=="formula"||!this.arg2.typ)?"formula":"error";
        this.bp = 35;
        this.toLaTeX = function() {
            if (this.arg2.sym=="\\forall" || this.arg2.sym=="\\exists")
                return "\\forall "+this.arg.toLaTeX()+this.arg2.toLaTeX();
	    return "\\forall "+this.arg.toLaTeX()+"("+this.arg2.toLaTeX()+")";
        };
        return this;
    });

    prefix("∃", "\\exists", 35, function () {
	    this.arg = expression(35, true);
	    this.arg2 = expression(35);
        this.typ = (this.arg.typ=="formula"||!this.arg.typ)&&(this.arg2.typ=="formula"||!this.arg2.typ)?"formula":"error";
        this.bp = 35;
        this.toLaTeX = function() {
            if (this.arg2.sym=="\\forall" || this.arg2.sym=="\\exists")
                return "\\exists "+this.arg.toLaTeX()+this.arg2.toLaTeX();
	    return "\\exists "+this.arg.toLaTeX()+"("+this.arg2.toLaTeX()+")";
        };
        return this;
    });

    prefix("√", "\\sqrt", 100, function () {
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

    prefix("lim", "\\lim", 55, function () {
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

    prefix("|", "|", 80, function () {
        this.arg = expression(45);
        advance("|");
        this.typ = this.arg.typ=="term"||this.arg.typ=="set"||!this.arg.typ?"term":"error";
        this.bp = 80;
        this.toLaTeX = function(){return "|"+this.arg.toLaTeX()+"|"};
        return this;
    });

    prefix("(", "(", 0, function () {
        var e = expression(0);
        advance(")");
        return e;
    });

    prefix("{", "{", 0, function () {
        var e = expression(0);
        advance("}");
        return e;
    });

    prefix("[", "[", 100, function () {
        this.arg = expression(45);
        advance("]");
        this.typ = this.arg.typ=="term"||this.arg.typ=="set"||!this.arg.typ?"term":"error";
        this.bp = 80;
        this.toLaTeX = function(){return "["+this.arg.toLaTeX()+"]"};
        return this;
    });

    prefix("\lfloor", "\\lfloor", 80, function () {
        this.arg = expression(45);
        advance("\rfloor");
        this.typ = this.arg.typ=="term"||!this.arg.typ?"term":"error";
        this.bp = 80;
        this.toLaTeX = function(){return "\\lfloor "+this.arg.toLaTeX()+"\\rfloor "};
        return this;
    });

    prefix("\lceil", "\\lceil", 80, function () {
        this.arg = expression(45);
        advance("\rceil");
        this.typ = this.arg.typ=="term"?"term"||!this.arg.typ:"error";
        this.bp = 80;
        this.toLaTeX = function(){return "\\lceil "+this.arg.toLaTeX()+"\\rceil "};
        return this;
    });

    prefix("\\{", "\\{", 38, function () {
        var a = [];
        if (token.sym !== "\\}") {
            a.push(expression(38,true));
            if (token.sym == "|" || token.sym == ":" || token.sym == "∣") {
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
            if (this.arg2) return "\\{"+this.arg.toLaTeX()+" \\mid "+this.arg2.toLaTeX()+"\\}";
            var st = this.arg.length==0 ? "" : this.arg[0].toLaTeX();
	    for (var i=1; i<this.arg.length; i++) st += ", "+this.arg[i].toLaTeX();
            return "\\{"+st+"\\}"
        };
        return this;
    });

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
    t.message = message+t.sym;
    throw t;
};

var parse = make_parse();

function prefixform(tree) {
    var st, ar, i
    st = tree.sym + "("
    if (tree.arg) {
        ar = tree.arg
        if (ar.length) {
            for (var i=0; i<ar.length-1; i++) st += prefixform(ar[i]) + ","
            st += prefixform(ar[ar.length-1])
        } else {
            st += prefixform(ar)
        }
    }
    if (tree.arg2) st += "," + prefixform(tree.arg2)
    if (tree.arg3) st += "," + prefixform(tree.arg3)
    return st.slice(-1)=="(" ? st.slice(0,-1) : st + ")"   //remove () on constants
}

function goparse(source) {
    var string, tree;
    tree = parse(source);
    if (tree) return tree;
    return "undefined"
}

process.stdin.on('data', function (data) {
    var tree
    arr = data.toString().split("\n")
    for (i in arr) {
        if (arr[i]!="") {
            tree = goparse(arr[i])
            console.log(arr[i]+"\n"+tree.toLaTeX()+"\n\n"+prefixform(tree)+"\n");
        }
    }
});


