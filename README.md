# UnicodeMath, a formal math language for us and them

Under construction ...

http://math.chapman.edu/~jipsen/unicodemath

Unicode contains a large number of mathematical symbols, making it suitable for a human **and** computer readable mathematical language that aims to be as close to standard mathematics as possible. UnicodeMath is a linear format (with _, ^ for sub- and superscripts), and Unicode characters correspond to standard LaTeX equivalents. Simple bidirectional textual conversions exist between UnicodeMath and a controlled subset of LaTeX.

### 240 useful Unicode math characters

¬ ∨ ∧ ⟹ ⟸ ⟺ ∀ ∃ ∄ ◊ □ ⊥ ⊤ ⊢ ⊬ ⊩ ⊨ ⊭ ∈ ∉ ∋ ∌ ∅ ℘ ⊂ ⊄ ⊆ ⊈ ⊊ ⊃ ⊅ ⊇ ⊉ ⊋ ∩ ∪ ⊎ ∁ ⋂ ⋃ ⨄ ℵ ℶ ∞

⋅ ∘ • ÷ ∸ ⨪ ∓ ± ⊙ ⊖ ⊕ ⊘ ⦸ ⊓ ⊔ ⨿ × ⋉ ⋊ ⋈ ◃ ▹ ⩃ ⩂ ⊽ ⊼ ≀ ℑ ℜ √ ∛ ∜ ⟨ ⟩ ⌈ ⌉ ⌊ ⌋ ⟦ ⟧ … ⋰ ⋯ ⋱ ∴

≈ ≅ ≡ ≤ ≰ ≥ ≱ ≦ ≧ ≪ ≫ ≠ ≯ ≮ ∣ ∤ ≺ ⊀ ⪯ ≻ ⊁ ⪰ ∥ ∦ ∝ ∼ ⊏ ⊑ ⊐ ⊒ ∠ ⦜ ✓ ♣ ♢ ♡ ♠ † ° ℓ € ♭ ♯ ⌢ ⌣ ħ ↯ ∎

⨁ ⨂ ⨀ ⨅ ⨆ ★ ⨉ ⨃ ⋁ ⋀ ∫ ∬ ∭ ∮ ∯ ∰ ∂ ∇ ∑ ∏ ∐ ↓ ↑ ↕ ⇓ ⇑ ⇕ ↪ ↣ ↠ ↦ ↤ → ← ↔ ⇒ ⇐ ⇔ 𝔹 ℂ 𝔽 ℕ ℙ ℚ ℝ 𝕋 ℤ

α β χ δ Δ γ Γ ϵ ɛ η κ λ Λ μ ν ω Ω ϕ φ Φ π Π ψ Ψ ρ σ Σ τ θ ϑ Θ υ ξ Ξ ζ 𝔸 𝐀 𝔄 𝕬 𝐴 𝑨 𝖠 𝗔 𝘈 𝘼 𝒜 𝓐 𝙰

There are thousands more unicode math characters, but the above 5 lines probably cover over 90% of all use cases.

Most programming languages and computer algebra system languages were designed before Unicode became widely available. UnicodeMath aims to be a universal pseudocode that can be reliably translated to many different programming languages and other formal languages, used for example in theorem provers or computer algebra systems. It uses a large number of infix symbols, usually with their standard mathematical meaning (if there is one), and has various dialects that cater to different mathematical notational preferences.

Examples below are given in the standard (default) dialect, and variations are discussed later.

All valid UnicodeMath expressions can be parsed into an abstract syntax tree (AST) from which the expression can be recovered (possibly with minor whitespace changes). Other dialects and translations are derived from the AST.

UnicodeMath is based on standard conventions for mathematical symbols and operations. The syntax is agnostic about foundations (whether it is based on set theory, type theory, etc.) but there are different sorts of symbols, and to parse strings correctly requires handling a symbols fixity and binding power. Each symbol and expression is either a variable, constant, term, atomic formula, set formula or formula.

* variable symbols are single latin letters (u,v,w,x,y,z) with possible subscripts (u_0,u_1,…,z_0,z_1,…)
* constant symbols, the default sort for all LaTeX symbols not assigned to other sorts (a,b,…,α,β,…,∅,∞,0,1,…)
* prefix/infix/postfix/mixfix function symbols with standard precedence (+,−,⋅,/,∪,∩,√,ln,sin,…)
* terms built from function symbols applied to variables, constants and terms
* prefix/infix relation symbols with lower precedence than function symbols (∈,=,≤,<,≥,>,…)
* atomic formulas built from relation symbols applied to terms
* prefix/infix logical symbols with lower precedence than relation symbols (¬ ,or, and, ⟹, ⟺, ∃, ∀, …)
* formulas built from logical symbols applied to atomic formulas and formulas
* metalogical symbols and large operator symbols that combine mathematical expressions from several of the above sorts (⊢,⊨,⋁,⋀,⋃,⋂,∑,∏,lim,∫,…)

A subset of the variable, constant, function and relation symbols are considered to range over the set-sort (meaning they take sets as inputs and/or produce a set as output). Sort-checking consists of ensuring that such sort constraints are observed, as well as that the above sorts are respected (e.g. a function symbol cannot take a formula as argument).

Standard mathematical notation makes liberal use of invisible "\cdot" and function application by juxtaposition (i.e., when two symbols are adjacent with the symbol on the left neither prefix nor infix and the symbols on the right neither infix nor postfix). The parser always treats this situation as a binary operation, and the sorts of the arguments are used to determine if this binary operation is function application or \cdot.
 
Infix symbols that are usually considered associative (+,⋅,=) have variable arity and chain over a list of arguments (rather than having left or right associated parse trees).

Many symbols are overloaded, but sorts are used to disambiguate these situations. Each symbol has a default sort, but its sort can be changed dynamically.

The abstract syntax tree contains the symbol (sym:string), sort (typ:string) and arguments (arg, arg2, arg3), where the latter three are either a tree or a list of trees.

### Examples of valid UnicodeMath expressions from discrete mathematics

* 𝔹 = {𝐓, 𝐅}
* ℕ = {0,1,2,…} (or ℕ = {1,2,3,…})
* A ⊆ B ⟺ ∀x(x ∈ A ⟹ x ∈ B)
* A = B ⟺ ∀x(x ∈ A ⟺ x ∈ B) ⟺ A ⊆ B and B ⊆ A
* A ⊂ B ⟺ A ⊆ B and A ≠ B
* ∅ = {}
* ∀x(x ∉ ∅)
* {1,2,2,1} = {1,2}
* P : A → 𝔹
* y ∈ {x ∣ P(x)} ⟺ P(y)
* {f(x) ∣ P(x)} = {y ∣ ∃x (y=f(x) and P(x))}
* ∃x∈A P(x) ⟺ ∃x (x∈A and P(x))
* ∀x∈A P(x) ⟺ ∀x (x∈A ⟹ P(x))
* 𝒫(A) = {S ∣ S ⊆ A}
* x ∈ {a_1,…,a_n} ⟺ ∃i (x=a_i and 1≤i≤n)
* {a_1,…,a_{n+1}} = {a_1,…,a_n} ∪ {a_{n+1}}
* (a,b) = (c,d) ⟺ a=c and b=d
* A × B = {(a, b) ∣ a ∈ A and b ∈ B}
* (a_1,…,a_n) = (b_1,…,b_n) ⟺ ∀i (1≤i≤n ⟹ a_i = b_i)
* A_1 × ⋯ × A_n = {(a_1,…,a_n) ∣ a_i ∈ A_i for all i ∈ {1,…,n}}
* A^n = {(a_1,…,a_n) ∣ a_i ∈ A for all i ∈ {1,…,n}} = A × ⋯ × A
* A ∪ B = {x ∣ x ∈ A or x ∈ B} and ⋃_{i∈I} A_i = {x ∣ x ∈ A_i for some i ∈ I}
* A ∩ B = {x ∣ x ∈ A and x ∈ B}
* A − B = {x ∣ x ∈ A and x ∉ B}
* A ⊕ B = {x ∣ x ∈ A∪B and x ∉ A∩B}
* f : A → B ⟺ ∀x∈A, ∃!y∈B, f(x)=y
* f : ℝ → ℝ and S ⊆ ℝ
* f[S] = {f(x) ∣ x ∈ S}
* f is increasing ⟺ (a < b ⟹ f(a) ≤ f(b))
* (a,b] = {x ∣ a < x ≤ b}
* ⌊_⌋ : ℝ → ℤ
* ⌊x⌋ = n ⟺ n ∈ ℤ and n ≤ x < n+1
* |x| = −x if x < 0 else x
* x = a/b ⟺ bx = a and b ≠ 0
* (f+g)(x) = f(x) + g(x)
* (fg)(x) = f(x)g(x)
* (f/g)(x) = f(x)/g(x) if g(x) ≠ 0
* (f∘g)(x) = f(g(x))
* id_A : A → A and ∀x, id_A(x) = x
* graph(f) = {(x,y) ∣ f(x) = y}

* ∀x>0 (x^ax^b=x^{a+b})
* ∀x,y>0 ((xy)^a=x^ay^a)
* |x+y| ≤ |x|+|y|
* |xy| = |x||y|
* a∣b ⟺ ∃c∈ℤ (ac = b)
* \lim_{x→a}f(x) = L ⟺ ∀ε>0 ∃δ>0 ∀x(0 < |x−a| < δ ⟹ |f(x)−L| < ε)
* d/dx(f(x)) = \lim_{h→0}(f(x+h)−f(x))/h
* ∫_a^b f(x)dx = \lim_{n→∞}∑_{i=1}^n f(x_i^*)(b−a)/n
* ∏_{i=1}^{n+1}a_i = (∏_{i=1}^n a_i)a_{n+1}
* ∑_{i=1}^n i = n(n+1)/2
* ∀x∈A P  
or 2xy+z sin(x+1)(x+2) ∀x,y∈A (P)  
or sin2⋅|x⋅y| or ∃x A  
or B = \{x∣x ∈ A or x∈B\}  
or 1+23 ∈ (⋁_{i=1}^m i) + sin x_12 = \{1,2\}+1 ∩ {2}-{1}  
or [1,2]+2=1  
or 1+1 = 2  
or x_2|q^2  

### Notational ambiguities in basic mathematics

* sin^n x = (sin x)^n if n>1 but sin^{-1}x = arcsin x
* sin2x = sin 2x = sin(2⋅x) but sin2 x = sin(2)⋅x
* f^{n+1} = f^n ∘ f if n≥1
* y = f^{-1}(x) if x = f(y) and f is one-to-one
* y = x^{-1} if xy = x^0 = the multiplicative identity element
* (x,y) = ⟨x,y⟩ or (x,y) = \{z ∈ ℝ ∣ x<x<y\}
* 1/2x = 1/2 x = 1/2⋅x = (1/2)x but some tools interpret it as 1/(2x)

### The axioms of Zermelo-Fraenkel set theory with choice ZFC

In principle all of mathematics can be derived from these axioms
1. Extensionality:  ∀X,Y (X=Y ⟺ ∀z(z∈X ⟺ z∈Y))
2. Pairing:         ∀x,y ∃Z ∀z (z∈Z ⟺ z=x or z=y)
3. Union:           ∀X ∃Y ∀y (y∈Y ⟺ ∃Z(Z∈X and y∈Z))
4. Empty set:       ∃X ∀y (y ∉ X)      -- this set X is denoted by ∅
5. Infinity:        ∃X (∅ ∈ X and ∀x(x ∈ X ⟹ x ∪ {x} ∈ X))
6. Power set:       ∀X ∃Y ∀Z (Z∈Y ⟺ ∀z(z∈Z ⟹ z∈X))
7. Replacement:     ∀x∈X ∃!y P(x,y) ⟹ ∃Y ∀y (y∈Y ⟺ ∃x∈X P(x,y))
8. Regularity:      ∀X (X ≠ ∅ ⟹ ∃Y∈X (X∩Y = ∅))
9. Axiom of choice: ∀X (∅ ∉ X and ∀Y,Z∈X(Y≠Z ⟹ Y∩Z = ∅) ⟹ ∃Y ∀Z∈X ∃!z∈Z (z ∈ Y))

* ∀ = for all, ∃! = there exists a unique, P is any formula that does not contain Y
* z ∈ X∪Y ⟺ z∈X or z∈Y,  z ∈ X∩Y ⟺ z∈X and z∈Y

* ∀n∈ℕ ∃p∈ℙ (n < p ≤ 2n)

asso(⋅) = ((x⋅y)⋅z = x⋅(y⋅z))  
SemigroupAx(⋅) = asso(⋅)  
Sgrp = Category(SemigroupAx(⋅))  

comm(⋅) = (x⋅y = y⋅x)  
CSemigroupAx(⋅) = SemigroupAx(⋅) and comm(⋅)  
CSgrp = Category(CSemigroupAx(⋅))  

idem(⋅) = (x⋅x = x)  
SemilatticeAx(⋅) = CSemigroupAx(⋅) and idem(⋅)  
Slat = Category(SemilatticeAx(⋅))  

abso(∨,∧) = ((x∨y)∧x = x)  
LatticeAx(∨,∧) = SemilatticeAx(∨) and SemilatticeAx(∧) and abso(∨,∧) and abso(∧,∨)  
Lat = Category(LatticeAx(∨,∧))
* 𝐋 = ⟨L,∨,∧⟩ \text{ is a lattice if } 𝐋 ⊨ Lattice(∨,∧)

iden(⋅,e) = (x⋅e = x = e⋅x)  
MonoidAx(⋅,e) = SemigroupAx(⋅) and iden(⋅,e)  
Mon = Category(MonoidAx(⋅,e))  

GroupAx(⋅,^{-1},e) = MonoidAx(⋅,e) and x⋅x^{-1} = e  
Grp = Category(GroupAx(∨,∧))

AbGroupAx(+,-,0) = GroupAx(+,-,0) and comm(+)  
AbGrp = Category(AbGroupAx(∨,∧))

distr_l(⋅,+) = (x⋅(y+z) = x⋅y + x⋅z)  
distr_r(⋅,+) = ((x+y)⋅z = x⋅z + y⋅z)  
RingAx(+,-,0,⋅) = AbGroupAx(+,-,0) and SemigroupAx(⋅) and dist_l(⋅,+) and dist_r(⋅,+)  
Rng = Category(RingAx(+,-,0,⋅))

CRingAx(+,-,0,⋅) = RingAx(+,-,0,⋅) and comm(⋅)  
CRng = Category(CRingAx(+,-,0,⋅))

URingAx(+,-,0,⋅,1) = RingAx(+,-,0,⋅) and iden(⋅,1)  
URng = Category(URingAx(+,-,0,⋅,1))

CURingAx(+,-,0,⋅,1) = URingAx(+,-,0,⋅,1) and comm(⋅)  
CURng = Category(CURingAx(+,-,0,⋅,1))

FieldAx(+,-,0,⋅,1) = CURingAx(+,-,0,⋅,1) and x≠0 ⟹ ∃y x⋅y=1 and 0≠1  
Fld = Category(FieldAx(+,-,0,⋅,1))

Math fonts A
* 𝔸 BbbA
* 𝐀 mbfA
* 𝔄 mfrakA, 𝕬 mbffrakA
* 𝐴 mitA, 𝑨 mbfitA
* 𝖠 msansA, 𝗔 mbfsansA, 𝘈 mitsansA, 𝘼 mbfitsansA
* 𝒜 mscrA, 𝓐 mbfscrA
* 𝙰 mttA

Greek alphabet
* α alpha
* β beta
* χ chi
* δ delta, Δ Delta
* γ gamma, Γ Gamma
* ϵ epsilon, ɛ varepsilon
* η eta
* κ kappa
* λ lambda, Λ Lambda
* μ mu
* ν nu
* ω omega, Ω Omega
* ϕ phi, φ varphi, Φ Phi
* π pi, Π Pi
* ψ psi, Ψ Psi
* ρ rho
* σ sigma, Σ Sigma
* τ tau
* θ theta, ϑ vartheta, Θ Theta
* υ upsilon
* ξ xi, Ξ Xi
* ζ zeta

Logic symbols
* ¬ neg, ∨ vee, ∧ wedge
* ⟹ Longrightarrow, ⟸ Longleftarrow
* ⟺ Longleftrightarrow
* ∀ forall, ∃ exists, ∄ nexists
* ◊ lozenge, □ square
* ⊢ vdash, ⊬ nvdash, ⊩ Vdash
* ⊨ vDash, ⊭ nvDash, ⊧ models
* ↯ downzigzagarrow
* ∴ therefore, ∎ QED

Set symbols
* ∈ in, ∉ notin
* ∋ ni, ∌ nni
* ∅ emptyset, ℘ wp
* ⊂ subset, ⊄ nsubset
* ⊆ subseteq, ⊈ nsubseteq, ⊊ subsetneq
* ⊃ supset, ⊅ nsupset
* ⊇ supseteq, ⊉ nsupseteq, ⊋ supsetneq
* ∩ cap, ∪ cup, ⊎ uplus
* ∖ setminus, ∁ complement
* ⋂ bigcap, ⋃ bigcup, ⨄ biguplus
* ℵ aleph, ℶ beth

Infix operations +, -, *, /, \, ^, _, ;
* ⩃ barcap, ⩂ barcup
* ⊽ barvee, ⊼ barwedge
* ⋅ cdot, ∘ circ, • bullet
* ÷ div, ∸ dotminus, ⨪ minusdot
* ∓ mp, ± pm
* ⊙ odot, ⊖ ominus, ⊕ oplus
* ⊘ oslash, ⦸ obslash
* ⊓ sqcap, ⊔ sqcup, ⨿ amalg
* × times, ⋉ ltimes, ⋊ rtimes, ⋈ bowtie
* ◃ triangleleft, ▹ triangleright
* ⅋ upand, ≀ wr

Functions cos, sin, tan, cot, csc, sec, log, exp
* ℑ Im, ℜ Re
* √ sqrt, ∛ cbrt, ∜ fourthroot

Infix relations =, <, >, |, :
* ≈ approx, ≅ cong, ≡ equiv
* ≤ le, leq, ≰ nleq, ≥ ge, geq, ≱ ngeq
* ≦ leqq, ≧ geqq
* ≪ ll, ≫ gg
* ≠ ne, neq
* ≯ ngtr, ≮ nless
* ∣ mid, ∤ nmid
* ≺ prec, ⊀ nprec
* ⪯ preceq, ⪯̸ npreceq
* ≻ succ, ⊁ nsucc
* ⪰ succeq, ⪰̸ nsucceq
* ∥ parallel, ∦ nparallel
* ∝ propto, ∼ sim
* ⊏ sqsubset, ⊑ sqsubseteq
* ⊐ sqsupset, ⊒ sqsupseteq

Operators lim, sup, inf, d/d, max, min
* ○ bigcirc, ⨀ bigodot
* ⨁ bigoplus, ⨂ bigotimes
* ⨅ bigsqcap, ⨆ bigsqcup
* ★ bigstar, ⨉ bigtimes, ⨃ bigcupdot
* ⋁ bigvee, ⋀ bigwedge
* ∫ int, ∬ iint, ∭ iiint, ⨌ iiiint
* ∮ oint, ∯ oiint, ∰ oiiint
* ∂ partial, ∇ del
* ∏ prod, ∑ sum, ∐ coprod

Arrows
* ↓ downarrow, ↑ uparrow, ↕ updownarrow
* ⇓ Downarrow, ⇑ Uparrow, ⇕ Updownarrow
* ↪ hookrightarrow, ↣ rightarrowtail, ↠ twoheadrightarrow
* ↦ mapsto, ↤ mapsfrom
* → to, rightarrow, ← leftarrow, ↔ leftrightarrow
* ⇒ Rightarrow, ⇐ Leftarrow, ⇔ Leftrightarrow

Brackets (, ), [, ], {, }
* ⟨ langle, ⟩ rangle
* ⌈ lceil, ⌉ rceil
* ⌊ lfloor, ⌋ rfloor
* ⟦ llbracket, ⟧ rrbracket

Other !, @, #, $, %, ?, ., ', `, ~
* ∠ angle, ⦜ Angle
* ⊥ bot, ⊤ top
*  ̆ breve,  ̌ check,  ̂ hat, %\vec does not work??
* ✓ checkmark
* ♣ clubsuit, ♢ diamondsuit, ♡ heartsuit, ♠ spadesuit
* † dagger
* ° degree
* … dots, ⋰ adots, ⋯ cdots, ⋱ ddots
* ℓ ell
* € euro
* ♭ flat, ♯ sharp
* ⌢ frown, ⌣ smile
* ħ hbar
* ∞ infty

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

⋰ adots
ℵ aleph
α alpha
⨿ amalg
∠ angle
⦜ Angle
≈ approx
𝔸 BbbA
𝒜 mscrA
𝓐 mbfscrA
𝔄 mfrakA
𝕬 mbffrakA
𝙰 mttA
𝐀 mbfA
𝐴 mitA
𝑨 mbfitA
𝖠 msansA
𝗔 mbfsansA
𝘈 mitsansA
𝘼 mbfitsansA
⩃ barcap
⩂ barcup
⊽ barvee
⊼ barwedge
⋂ bigcap
○ bigcirc
⋃ bigcup
⨃ bigcupdot
⨀ bigodot
⨁ bigoplus
⨂ bigotimes
⨅ bigsqcap
⨆ bigsqcup
★ bigstar
⨉ bigtimes
⨄ biguplus
⋁ bigvee
⋀ bigwedge
⊥ bot
⋈ bowtie
̆ breve
• bullet
∩ cap
∛ cbrt
⋅ cdot
⋯ cdots
̌ check
✓ checkmark
χ chi
∘ circ
♣ clubsuit
∁ complement
≅ cong
∐ coprod
∪ cup
† dagger
⋱ ddots
° degree
∇ del
δ delta
♢ diamondsuit
÷ div
∸ dotminus
… dots
↓ downarrow
↯ downzigzagarrow
Δ Delta
⇓ Downarrow
ℓ ell
∅ emptyset
ϵ epsilon
ɛ varepsilon
≡ equiv
η eta
€ euro
∃ exists
♭ flat
∀ forall
∜ fourthroot
⌢ frown
γ gamma
≥ ge, geq
≧ geqq
≫ gg
Γ Gamma
̂ hat
ħ hbar
♡ heartsuit
↪ hookrightarrow
⨌ iiiint
∭ iiint
∬ iint
∫ int
∈ in
∞ infty
ℑ Im
κ kappa
λ lambda
⟨ langle
⌈ lceil
≤ le, leq
← leftarrow
≦ leqq
⌊ lfloor
≪ ll
⟦ llbracket
◊ lozenge
⋉ ltimes
Λ Lambda
⟸ Longleftarrow
⟺ Longleftrightarrow
↤ mapsfrom
↦ mapsto
∣ mid
⨪ minusdot
⊧ models
∓ mp
μ mu
≠ ne, neq
¬ neg
∄ nexists
≱ ngeq
≯ ngtr
∋ ni
≰ nleq
≮ nless
∤ nmid
∌ nni
∉ notin
∦ nparallel
⊀ nprec
⪯̸ npreceq
⊄ nsubset
⊈ nsubseteq
ν nu
⊬ nvdash
⦸ obslash
⊙ odot
∰ oiiint
∯ oiint
∮ oint
ω omega
⊖ ominus
⊕ oplus
⊘ oslash
Ω Omega
∥ parallel
∂ partial
ϕ phi
Φ Phi
π pi
± pm
≺ prec
⪯ preceq
∏ prod
∝ propto
ψ psi
Π Pi
Ψ Psi
∎ QED
⟩ rangle
⌉ rceil
⌋ rfloor
ρ rho
→ rightarrow, to
⟧ rrbracket
⋊ rtimes
ℜ Re
∖ setminus
♯ sharp
σ sigma
Σ Sigma
∼ sim
♠ spadesuit
⊓ sqcap
⊔ sqcup
√ sqrt
⊏ sqsubset
⊑ sqsubseteq
⊐ sqsupset
⊒ sqsupseteq
□ square
⊂ subset
⊆ subseteq
⊊ subsetneq
≻ succ
⪰ succeq
∑ sum
⊃ supset
⊇ supseteq
⊋ supsetneq
τ tau
∴ therefore
θ theta
Θ Theta
× times
⊤ top
◃ triangleleft
▹ triangleright
↠ twoheadrightarrow
⅋ upand
↑ uparrow
⊎ uplus
υ upsilon
⇑ Uparrow
⇕ Updownarrow
ɛ varepsilon
φ varphi
ϑ vartheta
⊢ vdash
⊩ Vdash
∨ vee
∧ wedge
℘ wp
≀ wr
ξ xi
Ξ Xi
ζ zeta