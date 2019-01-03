# Python program to parse UnicodeMath/LaTeX formulas producing a typechecked JSON AST

# usage: python um2json.py

# Terms are read using Vaughn Pratt's top-down parsing algorithm
# modified by Peter Jipsen 2019-01-02
# distributed under LGPL 3 or later

"""
x \cdot y  --> A.op["cdot"][x][y]
t(x_1,\ldots,x_n) --> A.op["t"][x_1][x_2]...[x_n]
p \And q --> p and q
p \Or q --> p or q
\Not p --> not p
p \Imp q --> (not p) or q
p \Iff q --> p == q
p \Xor q --> p != q
\forall x,y,z p(x,y,z) --> all(p(x,y,z) for x in As for y in As for z in As)
\exists x,y,z p(x,y,z) --> any(p(x,y,z) for x in As for y in As for z in As)
\Gamma = \{p,q,r\} --> Gamma = [p,q,r]
\cdot = \{0=0\cdot0=1\cdot0,1=0\cdot1=1\cdot1,...,2=2\cdot2\} --> cdot = [[0,1,...],[0,...],...,[...,2]] default = -1
A = \Alg(n,ops) --> A = Alg(n,ops)
A \models \Gamma --> models(A, Gamma)
Gamma \vdash \Delta --> proves(Gamma,Delta)

"""

import re, sys, glob

def is_postfix(t):
    return hasattr(t,'leftd') and len(t.arg)==1

def ltx(t):
    st = t.id.replace('_','\\_')
    st = st.replace('^','\\string^')
    st = st.replace('$','\\$')
    st = st[0].lower()+st[1:]
#    if len(st)>1 and letter(st[0]) and (letter(st[1]) or st[1]=='\\'):
#        return "\\mbox{"+st+"}"
    if '0'<=st[-1]<='9':
        m = re.match('(.*?)([0-9]+$)',st)
        st = m.group(1)
        st2 = m.group(2)
        if st=="": return st2
        if st[-1]=="_": st = st[:-2]
        if len(st)>1: st = "\\mbox{"+st+"}"
        #else: st = st.lower()
        return st+"_{"+st2+"}" if len(st2)>1 else st+"_"+st2
    else:
        return "\\mbox{"+st+"}" if len(st)>1 else st.lower()

def wrap(subt, t): 
    # decide when to add parentheses during printing of terms
    return str(subt) if subt.lbp < t.lbp or subt.arg==[] or \
        (subt.id==t.id and subt.lbp==t.lbp) or \
        (not hasattr(subt,'leftd') or not hasattr(t,'leftd')) or \
        (is_postfix(subt) and is_postfix(t)) else "( "+str(subt)+" )"

def wrap2(subt, t):
  #if subt.id=='k' and t.id=='join' or t.id=='meet': print subt.lbp, t.lbp
  return str(subt) if subt.lbp < t.lbp or subt.arg==[] \
        or (not hasattr(subt,'leftd') and subt.lbp==1200) \
        else "( "+str(subt)+" )"

def wrap3(subt, t): 
  return str(subt) if subt.arg==[] or not hasattr(subt,'leftd') or \
    subt.id not in ['@', '&', '|', '=>', '<=', '<=>'] else "( "+str(subt)+" )"

def letter(c): return 'a'<=c<='z' or 'A'<=c<='Z'
def alpha_numeric(c): return 'a'<=c<='z' or 'A'<=c<='Z' or '0'<=c<='9' or c=='_'

class symbol_base(object):
    arg = []
    def __repr__(self): 
        if   len(self.arg) == 0: return ltx(self)
        elif len(self.arg) == 2 and not letter(self.id[0]) and self.id[0]!='$':
         return wrap(self.arg[0], self)+" "+self.id+" "+wrap(self.arg[1], self)
        else:
         return ltx(self)+"("+",".join([wrap(x, self) for x in self.arg])+")"

def symbol(id, bp=1200): # identifier, binding power; LOWER binds stronger
    if id in symbol_table:
        s = symbol_table[id]    # look symbol up in table
        s.lbp = min(bp, s.lbp)  # update left binding power
    else:
        class s(symbol_base):   # create class for this symbol
            pass
        s.id = id
        s.lbp = bp
        s.nulld = lambda self: self
        symbol_table[id] = s
    return s

def advance(id=None):
    global token
    if id and token.id != id:
        raise SyntaxError("Expected "+id+" got "+token.id)
    token = next()

def nulld(self): # null denotation
    expr = expression()
    advance(")")
    return expr

def prefix(id, bp=0):
    global token
    def nulld(self): # null denotation
        global token
        if token.id not in ["(","["]:    
            self.arg = [] if token.id in [",",")",":","=","!=","@"] \
                else [expression(bp)]
            return self
        else:
            closedelim = ")" if token.id=="(" else "]"
            token = next()
            self.arg = []
            if token.id != ")":
                while 1:
                    self.arg.append(expression())
                    if token.id != ",":
                        break
                    advance(",")
            advance(closedelim)
            return self
    s = symbol(id, bp)
    s.nulld = nulld
    return s

def infix(id, bp, right=True):
    def leftd(self, left): # left denotation
        self.arg = [left]
        self.arg.append(expression(bp+(1 if right else 0)))
        return self
    s = symbol(id, bp)
    s.leftd = leftd
    return s

def preorinfix(id, bp, right=True):
    def leftd(self, left): # left denotation
        self.arg = [left]
        self.arg.append(expression(bp+(1 if right else 0)))
        return self
    def nulld(self): # null denotation
        global token
        self.arg = [expression(bp)]
        return self
    s = symbol(id, bp)
    s.leftd = leftd
    s.nulld = nulld
    return s

def plist(id, bp=0):
    global token
    def nulld(self): # null denotation
        global token
        self.arg = []
        if token.id != "]":
            while 1:
                self.arg.append(expression())
                if token.id != ",":
                    break
                advance(",")
        advance("]")
        return self
    s = symbol(id, bp)
    s.nulld = nulld
    return s

def postfix(id, bp):
    def leftd(self,left): # left denotation
        self.arg = [left]
        return self
    s = symbol(id, bp)
    s.leftd = leftd
    return s

def flat(t):
    if t.id!="|": return [t]
    else: return flat(t.arg[0])+flat(t.arg[1])

def rmneg(t):
    if t.id=="~": return t.arg[0]
    eq = symbol_table["="]()
    eq.arg = t.arg
    return eq

def expr2(st,arg):
    s = symbol_table[st]()
    if len(arg)==1: return arg[0]
    s.arg = [arg[0],expr2(st,arg[1:])]
    return s
        
def cnf2imp(t):
    if t.id!="|": return t
    ls = flat(t)
    co = [s for s in ls if s.id not in ["~","!="]]
    if len(co)==len(ls): return t
    if len(co)==0:
        co = ls[-1:]
        pr = [rmneg(s) for s in ls[:-1]]
    else: pr = [rmneg(s) for s in ls if s.id in ["~","!="]]
    return expr2("=>",[expr2("&",pr),expr2("|",co)])

symbol_table = {}

def display(x,st,st2):
    return wrap2(x.arg[0], x)+st+wrap2(x.arg[1], x) if len(x.arg)==2\
        else st if len(x.arg)==0\
        else "\\mbox{"+st2+"}("+str(x.arg[0])+")" if len(x.arg)==1\
        else wrap2(x.arg[0], x)+st+wrap2(x.arg[1], x)+"{=}"+wrap(x.arg[2],x)

def init_symbol_table():
    global symbol_table
    symbol_table = {}
    symbol("(").nulld = nulld
    symbol(")")
#    symbol("[").nulld = nulld
    plist("[").__repr__ = lambda x: "["+",".join([str(y) for y in x.arg])+"]"
    symbol("]")
    symbol(",")
    def fm(st): return lambda x: str(x.arg[2])+"\\qquad\\mbox{"+\
        st+"}("+ltx(x.arg[0])+","+ltx(x.arg[1])+")"

#x \cdot y  --> A.op["cdot"][x][y]
#t(x_1,\ldots,x_n) --> A.op["t"][x_1][x_2]...[x_n]
#p \And q --> p and q
#p \Or q --> p or q
#\Not p --> not p
#p \Imp q --> (not p) or q
#p \Iff q --> p == q
#p \Xor q --> p != q
#\forall x,y,z p(x,y,z) --> all(p(x,y,z) for x in As for y in As for z in As)
#\exists x,y,z p(x,y,z) --> any(p(x,y,z) for x in As for y in As for z in As)
#\Gamma = \{p,q,r\} --> Gamma = [p,q,r]
#\cdot = \{0=0\cdot0=1\cdot0,1=0\cdot1=1\cdot1,...,2=2\cdot2\} --> cdot = [[0,1,...],[0,...],...,[...,2]] default = -1
#A = \Alg(n,ops) --> A = Alg(n,ops)
#A \models \Gamma --> models(A, Gamma)
#Gamma \vdash \Delta --> proves(Gamma,Delta)

# \mt, \jn, \cdot, \ld, \rd, \ln, \rn, \circ, \dia, \box, \bdia, \bbox,
# \ltri, \rtri, \blt, \brt, \lar, \rar, 

    prefix("\\forall",400).__repr__ = lambda x: "all("+(",").\
            join([str(x) for x in x.arg])+")"   # universal quantifier
    prefix("\\exists",400).__repr__ = lambda x: "any("+(",").\
            join([str(x) for x in x.arg])+")"   # existential quantifier
    infix("\\ne", 405).__repr__ = lambda x: wrap(x.arg[0], x)+" != "+\
            wrap(x.arg[1], x)   # nonequality
    infix("=", 405).__repr__ = lambda x: wrap(x.arg[0], x)+" == "+\
            wrap(x.arg[1], x)   # equality
    infix("\\to", 440).__repr__ = lambda x: wrap2(x.arg[0],x)+" -> "+str(x.arg[1])
    prefix("\\neg",450).__repr__ = lambda x: "not "+wrap(x.arg[0], x) # negation
    infix("\\Or", 503).__repr__ = \
        lambda x: wrap(x.arg[0],x)+" or "+wrap(x.arg[1], x) #disjunction
    infix("\\And", 503).__repr__ = \
        lambda x: wrap(x.arg[0],x)+" and "+wrap(x.arg[1], x) #conjunction
    infix("\\Imp", 504).__repr__ = lambda x: wrap3(x.arg[0], x)+\
            " <= "+wrap3(x.arg[1], x)   # implication
    infix("\\BImp", 504).__repr__ = lambda x: wrap3(x.arg[0], x)+\
            " >= "+wrap3(x.arg[1], x)   # backward implication
    infix("\\Iff", 505).__repr__ = lambda x: wrap3(x.arg[0], x)+" == "+\
            wrap3(x.arg[1], x)   # bi-implication

    prefix("!",400).__repr__ = lambda x: "\\forall "+(",").\
            join([str(x) for x in x.arg])   # universal quantifier
    prefix("?",400).__repr__ = lambda x: "\\exists "+(",").\
            join([str(x) for x in x.arg])   # existential quantifier
    prefix("^",400).__repr__ = lambda x: "\\lambda "+(",").\
            join([str(x) for x in x.arg])   # lambda term constructor
    infix("=", 405)   # equality
    infix("!=", 405).__repr__ = lambda x: wrap(x.arg[0], x)+"\\ne "+\
            wrap(x.arg[1], x)   # nonequality
    infix(">", 440).__repr__ = lambda x: wrap2(x.arg[0],x)+"\\to "+str(x.arg[1])
    prefix("~",450).__repr__ = lambda x: "\\neg\\,"+wrap(x.arg[0], x) \
             if len(x.arg)==1 else "\\neg\\," # negation
    prefix("-",450).__repr__ = lambda x: "-"+wrap(x.arg[0], x)  # unary negative
    # infix symbol between quantifier/lambda variables and term
    # also between variable and typing term
    infix(":", 450).__repr__ = lambda x: str(x.arg[0])+"{:}\;"+wrap3(x.arg[1],x)
    # union type (right associative)
    preorinfix("+", 502).__repr__ = lambda x: "+"+wrap(x.arg[0],x)\
            if len(x.arg)==1 else str(x.arg[0])+" + "+wrap(x.arg[1], x)
    # product type (right associative)
    infix("*", 503).__repr__ = lambda x: str(x.arg[0])+"\\times "+wrap(x.arg[1], x)
    infix("/", 503).__repr__ = lambda x: str(x.arg[0])+"/"+wrap(x.arg[1], x)
    infix("|", 503).__repr__ = \
        lambda x: wrap(x.arg[0],x)+"\\mbox{ or }"+wrap(x.arg[1], x) #disjunction
    infix("&", 503).__repr__ = lambda x: wrap(x.arg[0],x)+"\\mbox{ and }"+\
            wrap(x.arg[1], x) if len(x.arg)==2 else "\\mbox{and}" #conjunction
    infix("=>", 504).__repr__ = lambda x: wrap3(x.arg[0], x)+\
            " \\ \\Rightarrow \\ "+wrap3(x.arg[1], x)   # implication
    infix("<=", 504).__repr__ = lambda x: wrap3(x.arg[0], x)+\
            " \\ \\Leftarrow \\ "+wrap3(x.arg[1], x)   # backward implication
    infix("<=>", 505).__repr__ = lambda x: wrap3(x.arg[0], x)+"\\iff "+\
            wrap3(x.arg[1], x)   # bi-implication
#    infix("-->", 504)   # Gentzen arrow

    symbol("zero").__repr__ = lambda x: "0"
    prefix("negate",240).__repr__ = lambda x: "-"+wrap2(x.arg[0], x)
    prefix("minus",240).__repr__ = lambda x: "-"+wrap2(x.arg[0], x)
    prefix("plus",250).__repr__ = lambda x: display(x," + ","+")
    symbol("unit").__repr__ = lambda x: "1"
    prefix("inv",190).__repr__ = lambda x: wrap2(x.arg[0], x)+"^{-1}"\
            if len(x.arg)==1 else "\\mbox{inv}"
    prefix("star",190).__repr__ = lambda x: wrap2(x.arg[0], x)+"^*"\
            if len(x.arg)==1 else "\\mbox{star}"
    prefix("omega",190).__repr__ = lambda x: wrap2(x.arg[0], x)+"^\\omega"\
            if len(x.arg)==1 else "\\mbox{omega}"
    prefix("inverse",190).__repr__ = lambda x: wrap2(x.arg[0], x)+"'"
    prefix("mult",200).__repr__ = lambda x: display(x,"\\cdot ","\\mbox{mult}")
    prefix("multiply",200).__repr__ = \
            lambda x: wrap2(x.arg[0], x)+"\\cdot "+wrap2(x.arg[1], x)\
        if len(x.arg)==2 else "m("+str(x.arg[0])+","+str(x.arg[1])+ \
           ","+str(x.arg[2])+")" # ternary op in BOO001-0.ax
    prefix("less_than",350).__repr__ = \
            lambda x: wrap2(x.arg[0], x)+" < "+wrap2(x.arg[1], x)
    prefix("less_or_equal",350).__repr__ = \
            lambda x: wrap2(x.arg[0], x)+" \\leq "+wrap2(x.arg[1], x)
    prefix("leq",350).__repr__ = \
            lambda x: wrap2(x.arg[0], x)+" \\leq "+wrap2(x.arg[1], x)
    prefix("less_than_or_equal",350).__repr__ = \
            lambda x: wrap2(x.arg[0], x)+" \\leq "+wrap2(x.arg[1], x)
    prefix("minimum").__repr__ = \
            lambda x: "\\min("+str(x.arg[0])+","+str(x.arg[1])+")"
    prefix("absolute").__repr__ = \
            lambda x: "|"+str(x.arg[0])+"|"
    prefix("in_interval",350).__repr__ = lambda x: str(x.arg[1])+\
            " \\in ["+str(x.arg[0])+","+str(x.arg[2])+"]"
    symbol("Delta").__repr__ = lambda x: "\\delta"
    symbol("Epsilon").__repr__ = lambda x: "\\varepsilon"

    prefix("meet",300).__repr__ = lambda x: display(x,"\\wedge ","\\mbox{meet}")
    prefix("join",300).__repr__ = lambda x: display(x,"\\vee ","\\mbox{join}")
    prefix("complement").__repr__ = lambda x: wrap2(x.arg[0], x)+"'" \
        if len(x.arg)==1 else wrap(x.arg[0], x)+"'"+"{=}"+wrap(x.arg[1],x)\
           if len(x.arg)==2 else "\\mbox{complement}"
    prefix("nand",300).__repr__ = \
            lambda x: wrap2(x.arg[0], x)+"\\uparrow "+wrap2(x.arg[1], x)
    prefix("nor",300).__repr__ = \
            lambda x: wrap2(x.arg[0], x)+"\\downarrow "+wrap2(x.arg[1], x)
    prefix("subset",300).__repr__ = \
            lambda x:display(x,"\\subseteq ","\\mbox{subset}")
    prefix("difference",300).__repr__ = \
            lambda x:display(x,"\\setminus ","\\mbox{difference}")
    prefix("domain").__repr__ = lambda x: "\\text{dom}("+str(x.arg[0])+")"
    prefix("codomain").__repr__ = lambda x: "\\text{cod}("+str(x.arg[0])+")"
    prefix("compose",200).__repr__ = \
            lambda x: wrap2(x.arg[0], x)+"\\circ "+wrap2(x.arg[1], x)
    prefix("product",200).__repr__ = \
            lambda x: display(x,"\\cdot ","\\mbox{product}")
    prefix("sum",250).__repr__ = lambda x: display(x," + ","\\mbox{sum}")
    prefix("composition",200).__repr__ = lambda x: display(x,";","")
    prefix("converse",190).__repr__ = lambda x: wrap2(x.arg[0], x)+\
            "^\smallsmile" if len(x.arg)==1 else "\\mbox{conv}"
    symbol("one").__repr__ = lambda x: "1"
    symbol("top").__repr__ = lambda x: "\\top "
    
    symbol("(end)")

def tokenize(st):
    i = 0
    while i<len(st):
        tok = st[i]
        j = i+1
        if letter(tok) or tok=='$': #read consequtive letters, digits or _
            while j<len(st) and alpha_numeric(st[j]): j+=1
            tok = st[i:j]
            symbol(tok)
            if j<len(st) and st[j]=='(':
                prefix(tok, 1200 if tok in symbol_table else 0)
        elif tok in ['\'','"']: #read any string
            while j<len(st) and st[j]!=tok:
                if st[j]=='\\' and j<len(st)-1: j+=1
                j+=1
            j += 1
            tok = st[i:j]
            symbol(tok)
            if j<len(st) and st[j]=='(':
                prefix(tok, 1200 if tok in symbol_table else 0)
        elif "0"<=tok<="9": #read (decimal) number in scientific notation
            while j<len(st) and ('0'<=st[j]<='9' or st[j] in ['.','e','E','-']):
                j+=1
            tok = st[i:j]
            symbol(tok)
        elif tok not in ' (,)[]':
            while j<len(st) and not alpha_numeric(st[j]) and \
                  st[j] not in ' (,)[]': j+=1
            tok = st[i:j]
            if tok not in symbol_table: symbol(tok)
        i = j
        if tok!=' ':
            symb = symbol_table[tok]
            if not symb: #symb = symbol(tok)
                raise SyntaxError("Unknown operator")
#            print tok, 'ST', symbol_table.keys()
            yield symb()
    symb = symbol_table["(end)"]
    yield symb()

def expression(rbp=1200): # read an expression from token stream
    global token
    t = token
    token = next()
    left = t.nulld()
    while rbp > token.lbp:
        t = token
        token = next()
        left = t.leftd(left)
    return left

def parse(str):
    global token, next
    next = tokenize(str).next
    token = next()
    return expression()

def json(t):
    st = "{id:'"+t.id+"'"
    if len(t.arg)>0:
        st += ", arg:["
        for s in t.arg: st += json(s)+", "
        st = st[:-2]+"]"
    return st+"}"

def pre(t,sp=False):
    st = t.id
    if len(t.arg)>0:
        st += "("+(" " if sp else "")
        for s in t.arg: st += pre(s,sp)+","+(" " if sp else "")
        st = st[:(-2 if sp else -1)]+(" " if sp else "")+")"
    return st

init_symbol_table()

#print parse("fof(xora,axiom,(    ! [S1,S2] :      ( ! [Ax,C] :          ( status(Ax,C,S1)        <~> status(Ax,C,S2) )    <=> xora(S1,S2) ) ))")

sys.setrecursionlimit(10000)  #needed for long formulas

def latexsafe(st):
    st = re.sub('% *',' ',st) # uncomment
    st = st.replace('$','\\$')
    st = re.sub('(\\\\[a-zA-Z]+)','$\\1$',st)
    st = st.replace('_','\\_')
    st = st.replace('#','\\#')
    st = st.replace('&','\\&')
    st = st.replace('->','$\\to$')
    st = st.replace('<=','$\\leq$')
    st = st.replace('<','$<$')
    st = st.replace('>','$>$')
    st = st.replace('^','$\\wedge$')
    return st.replace(' v ',' $\\vee$ ')

def translate(fn,n=0):
    st = ""
    if n==0: n = len(fn)
    for fname in fn[0:n]:
#      if fname.split("/")[-1] not in ["SYO024^1.p"]:
        fh = open(fname)
        s = fh.read()
        fh.close()
        if len(s)<5000:
            prb = re.search('% *Problem *\: *(.*?)\n',s)
            if prb:
                prb = latexsafe(prb.group(1))
            else:
                prb = re.search('% *Axioms *\: *(.*?)\n',s)
                prb = latexsafe(prb.group(1)) if prb else ""
            dsc = re.search('% *English *\: *(.*?)% Refs',s,flags=re.S)
            dsc = latexsafe(dsc.group(1)) if dsc else ""
            pat = re.compile('^( *?)%(.*?)\n',re.M)
            s = pat.sub('',s) # remove comments
            pat = re.compile('\/\*(.*?)\*\/',re.S)
            s = pat.sub('',s) # remove long comments
            s = re.sub(' +',' ',s)
            s = re.sub('\. *?\n','.n.',s)
            s = s.replace('\n','')
            fs = s.split('.n.')[:-1]
            st += "\\textbf{"+latexsafe(fname.split("/")[-1])+"} "+prb\
                +"\n\n"+dsc+"\n\n"
            #print fname.split("/")[-1]
            c = 0; d = 0
            init_symbol_table()
            for f in fs:
                #print f
                st += "\n$"+str(parse(f))+"$\n"
            st += "\n\\medskip"
    return st

import subprocess

def process(domain):
    st = r"""\documentclass{amsart}
    \advance\textheight by 1.75in
    \advance\textwidth by 2in
    \advance\topmargin by -1in
    \advance\oddsidemargin by -1in
    \advance\evensidemargin by -1in
    \usepackage{amssymb}
    \parindent0pt
    \begin{document}
    """
    fn = sorted(glob.glob("/home/jipsen/public_html/tptp/TPTP-v6.4.0/Axioms/"+domain+"*.ax"))
    st += "{\\Huge\\bf "+domain+" axioms}\n\n\\ \n\n"+translate(fn)
    fn = sorted(glob.glob("/home/jipsen/public_html/tptp/TPTP-v6.4.0/Problems/"+domain+"/*.p"))
    st += "{\\Huge\\bf "+domain+" problems}\n\n\\ \n\n"+translate(fn)
    st += "\n\\end{document}"
    fh = open(domain+".tex","w")
    fh.write(st)
    fh.close()
    subprocess.call(["pdflatex",domain+".tex"])


# terms are evaluated in a partial algebra A = Alg(size=n, op={"cdot":infix2, "-":prefix1, "e":const, ...}, ...)
