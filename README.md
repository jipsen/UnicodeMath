# UnicodeMath, a formal math language for us and them

Unicode contains a large number of mathematical symbols, making it suitable for a human **and** computer readable mathematical language that aims to be as close to standard mathematics as possible. UnicodeMath is a linear format (with ^, _ for super- and subscripts), and Unicode characters correspond to standard LaTeX equivalents. Simple bidirectional textual conversions exist between UnicodeMath and a controlled subset of LaTeX.

Most programming languages and computer algebra system languages were designed before Unicode became widely available. UnicodeMath aims to be a universal pseudocode that can be reliably translated to many different programming languages and other formal languages, used for example in theorem provers or computer algebra systems. It uses a large number of infix symbols, usually with their standard mathematical meaning, and has various dialects that cater to different mathematical notational preferences.

Examples below are given in the standard (default) dialect, and variations are discussed later.

All valid UnicodeMath expressions can be parsed into an abstract syntax tree (AST) from which the expression can be recovered (possibly with minor whitespace changes). Other dialects and translations are derived from the AST.

UnicodeMath is based on standard conventions for mathematical symbols and operations. The types for symbols and expressions are:

* variable symbols single latin letters (u,v,w,x,y,z) with possible subscripts (u_0,u_1,…,z_0,z_1,…)
* constant symbols, the default type for all LaTeX symbols not assigned to other types (a,b,…,α,β,…,∅,∞,0,1,…)
* prefix/infix/postfix/mixfix function symbols with standard precedence (+,−,⋅,/,∪,∩,√,ln,sin,…)
* terms built from function symbols applied to variables, constants and terms
* prefix/infix relation symbols with lower precedence than function symbols (∈,=,≤,<,≥,>,…)
* atomic formulas built from relation symbols applied to terms
* prefix/infix logical symbols with lower precedence than relation symbols (¬,∨,∧,→,↔,∃,∀,…)
* formulas built from logical symbols applied to atomic formulas and formulas
* metalogical symbols and large operator symbols that combine mathematical expressions from several of the above types (⊢,⊨,⋁,⋀,⋃,⋂,∑,∏,lim,∫,…)

A subset of the variable, constant, function and relation symbols are considered to range over the set type (meaning they take sets as inputs and produce a set as output). Type checking consists of ensuring that such type constraints are observed, as well as that the above types are respected (e.g. a function symbol cannot take a formula as argument).

Standard mathematical notation makes liberal use of invisible "\cdot" and function application by juxtaposition (i.e., when two symbols are adjacent with the symbol on the left neither prefix nor infix and the symbols on the right neither infix nor postfix). The parser always treats this situation as a binary operation, and the types of the arguments are used to determine if this binary operation is function application or \cdot.
 
Infix symbols that are usually considered associative (+,⋅,=) have variable arity and chain over a list of arguments (rather than having left or right associated parse trees).

Many symbols are overloaded, but types are used to disambigute these situations. Each symbol has a default type, but its type can be changed dynamically.

The abstract syntax tree contains the symbol (sym:string), type (typ:string) and arguments (arg, arg2, arg3), where the latter three are either a tree or a list of trees.
