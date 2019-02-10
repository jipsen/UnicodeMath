/* Modified for Unicode input by Peter Jipsen, jipsen@chapman.edu, 2019-2-4 
   Loosely based on auto.js which reuses code from Nicholas C. Zakas' textfield 
   autocomplete example at http://oak.cs.ucla.edu/cs144/projects/javascript/suggest1.html */

function MathInput(id) {
    this.provider = new SymbolNames();
    this.tbox = document.getElementById(id);
    var obj = this;
    pdate = new Date();
    obj.tbox.onkeyup = function (evt) {
        if (!evt) {evt = window.event;}
        ndate = new Date();
        if (ndate.getTime() > pdate.getTime() + 200) {
            obj.handleKeyUp(evt);
            pdate = ndate;
        }
    };
}

MathInput.prototype.handleKeyUp = function (evt) {
    var kc = evt.keyCode;
    if (!((kc != 16 && kc < 32) || (kc >= 33 && kc <= 46) || (kc >= 112 && kc <= 123) || 
        (kc == 65 && evt.ctrlKey) || (kc == 90 && evt.ctrlKey))) {
        this.provider.searchSymbols(this)
    }
};

MathInput.prototype.selectRange = function (beg, len) {
    if (this.tbox.createTextRange) { //IE
        var rng = this.tbox.createTextRange();
        rng.moveStart("character", beg);
        rng.moveEnd("character", len);
        rng.select();
    } else if (this.tbox.setSelectionRange) {
        this.tbox.setSelectionRange(beg, len);
    }
    this.tbox.focus();
};

SymbolNames.prototype.searchSymbols = function (obj) {
    var b = obj.tbox.selectionStart;
    var e = obj.tbox.selectionEnd;
    var st = obj.tbox.value;
    var p = st.slice(0, b).lastIndexOf('\\');
    if (p >= 0 && p+1 < b && !(/\W/.test(st.slice(p+1,b-1)))) { // \W = any non-word char
        var bl = (st.slice(b-1, b)==" ")                        // blank typed at end of symbol name
        if (bl || !(/\W/.test(st.slice(b-1, b)))) {
            var stValue = st.slice(p+1, bl?b-1:b);
            for (var i=0; i < this.symbols.length && this.symbols[i].indexOf(stValue) != 0; i++) {}
            if (i < this.symbols.length) {
                var name = bl?this.symbols[i].slice(-1):this.symbols[i];
                b = obj.tbox.selectionStart;
                e = obj.tbox.selectionEnd;
                st = obj.tbox.value;
                p = st.slice(0,b).lastIndexOf('\\');
                if (st.slice(b-1, b)==" ") {
                    obj.tbox.value = st.slice(0,p) + name.slice(-1) + st.slice(e);
                    obj.selectRange(p+1, p+1); //place cursor after character
                } else {
                    obj.tbox.value = st.slice(0,b) + name.slice(b-p-1) + st.slice(e);
                    obj.selectRange(b, e+name.length-b+p+1); //highlight name completion
                }
            }
        }
    }
};

function SymbolNames() {
    this.symbols = [
'adots ⋰',
'aleph ℵ',
'alpha α',
'amalg ⨿',
'and ∧',
'angle ∠',
'Angle ⦜',
'approx ≈',
'barcap ⩃',
'barcup ⩂',
'barvee ⊽',
'barwedge ⊼',
'BbbA 𝔸',
'beta β',
'beth ℶ',
'bigcap ⋂',
'bigcup ⋃',
'bigodot ⨀',
'bigoplus ⨁',
'bigotimes ⨂',
'bigsqcap ⨅',
'bigsqcup ⨆',
'bigstar ★',
'bigtimes ⨉',
'biguplus ⨃',
'biguplus ⨄',
'bigvee ⋁',
'bigwedge ⋀',
'Booleans 𝔹',
'bot ⊥',
'bowtie ⋈',
'bullet •',
'cap ∩',
'cbrt ∛',
'cdot ⋅',
'cdots ⋯',
'checkmark ✓',
'chi χ',
'circ ∘',
'clubsuit ♣',
'complement ∁',
'Complex ℂ',
'cong ≅',
'coprod ∐',
'cup ∪',
'dagger †',
'ddots ⋱',
'degree °',
'del ∇',
'delta δ',
'Delta Δ',
'diamondsuit ♢',
'div ÷',
'dotminus ∸',
'downarrow ↓',
'Downarrow ⇓',
'downzigzagarrow ↯',
'ell ℓ',
'emptyset ∅',
'epsilon ϵ',
'equiv ≡',
'eta η',
'euro €',
'exists ∃',
'False 𝔽',
'flat ♭',
'forall ∀',
'fourthroot ∜',
'frown ⌢',
'Gamma Γ',
'gamma γ',
'ge ≥',
'geqq ≧',
'gg ≫',
'hbar ħ',
'heartsuit ♡',
'hookrightarrow ↪',
'iff ⟺',
'iiint ∭',
'iint ∬',
'Im ℑ',
'implies ⟹',
'in ∈',
'infty ∞',
'int ∫',
'Integers ℤ',
'kappa κ',
'lambda λ',
'Lambda Λ',
'land ∧',
'langle ⟨',
'lceil ⌈',
'ldots …',
'le ≤',
'leftarrow ←',
'Leftarrow ⇐',
'leftrightarrow ↔',
'Leftrightarrow ⇔',
'leqq ≦',
'lfloor ⌊',
'll ≪',
'llbracket ⟦',
'Longleftarrow ⟸',
'lor ∨',
'lozenge ◊',
'ltimes ⋉',
'mapsfrom ↤',
'mapsto ↦',
'mbfA 𝐀',
'mbffrakA 𝕬',
'mbfit 𝑨',
'mbfitsansA 𝘼',
'mbfsansA 𝗔',
'mbfscrA 𝓐',
'mfrakA 𝔄',
'mid ∣',
'minusdot ⨪',
'mitA 𝐴',
'mitsansA 𝘈',
'mp ∓',
'msansA 𝖠',
'mscrA 𝒜',
'mttA 𝙰',
'mu μ',
'Naturals ℕ',
'ne ≠',
'neg ¬',
'nexists ∄',
'nge ≱',
'ngtr ≯',
'ni ∋',
'nle ≰',
'nless ≮',
'nmid ∤',
'not ¬',
'notin ∉',
'notni ∌',
'nparallel ∦',
'nprec ⊀',
'nsubset ⊄',
'nsubseteq ⊈',
'nsucc ⊁',
'nsupset ⊅',
'nsupseteq ⊉',
'nu ν',
'nvdash ⊬',
'nvDash ⊭',
'obslash ⦸',
'odot ⊙',
'oiiint ∰',
'oiint ∯',
'oint ∮',
'Omega Ω',
'omega ω',
'ominus ⊖',
'oplus ⊕',
'or ∨',
'oslash ⊘',
'parallel ∥',
'partial ∂',
'Phi Φ',
'phi ϕ',
'Pi Π',
'pi π',
'pm ±',
'prec ≺',
'preceq ⪯',
'Primes ℙ',
'prod ∏',
'propto ∝',
'psi ψ',
'Psi Ψ',
'qed ∎',
'rangle ⟩',
'Rationals ℚ',
'rceil ⌉',
'Re ℜ',
'Reals ℝ',
'rfloor ⌋',
'rho ρ',
'rightarrow →',
'Rightarrow ⇒',
'rightarrowtail ↣',
'rrbracket ⟧',
'rtimes ⋊',
'sharp ♯',
'Sigma Σ',
'sigma σ',
'sim ∼',
'smile ⌣',
'spadesuit ♠',
'sqcap ⊓',
'sqcup ⊔',
'sqrt √',
'sqsubset ⊏',
'sqsubseteq ⊑',
'sqsupset ⊐',
'sqsupseteq ⊒',
'square □',
'sube ⊆',
'subset ⊂',
'subseteq ⊆',
'subsetneq ⊊',
'succ ≻',
'succeq ⪰',
'sum ∑',
'supe ⊇',
'supset ⊃',
'supseteq ⊇',
'supsetneq ⊋',
'tau τ',
'therefore ∴',
'theta θ',
'Theta Θ',
'times ×',
'to →',
'top ⊤',
'triangleleft ◃',
'triangleright ▹',
'True 𝕋',
'twoheadrightarrow ↠',
'uparrow ↑',
'Uparrow ⇑',
'updownarrow ↕',
'Updownarrow ⇕',
'uplus ⊎',
'upsilon υ',
'varepsilon ɛ',
'varphi φ',
'vartheta ϑ',
'vdash ⊢',
'vDash ⊨',
'Vdash ⊩',
'vee ∨',
'wedge ∧',
'wp ℘',
'wr ≀',
'Xi Ξ',
'xi ξ',
'zeta ζ',
];}