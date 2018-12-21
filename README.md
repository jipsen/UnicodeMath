# UnicodeMath, a formal math language for us and them

Unicode contains a large number of mathematical symbols, making it suitable for a human **and** computer readable mathematical language that aims to be as close to standard mathematics as possible. UnicodeMath is a linear format (with ^, _ for super- and subscripts), and Unicode characters correspond to standard LaTeX equivalents. Simple bidirectional textual conversions exist between UnicodeMath and a controlled subset of LaTeX.

Most programming languages and computer algebra system languages were designed before Unicode became widely available. UnicodeMath aims to be a universal pseudocode that can be reliably translated to many different programming languages and other formal languages, used for example in theorem provers or computer algebra systems. It uses a large number of infix symbols, usually with their standard mathematical meaning, and has various dialects that cater to different mathematical notational preferences.

Examples below are given in the standard (default) dialect, and variations are discussed later.

All valid UnicodeMath expressions can be parsed into an abstract syntax tree (AST) from which the expression can be recovered (possibly with minor whitespace changes). Other dialects and translations are derived from the AST.
