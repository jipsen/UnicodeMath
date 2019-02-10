   /* Modified for Unicode input by Peter Jipsen, jipsen@chapman.edu, 2019-2-4 
    *
    * Copyright (c) 2013 Profoundis Labs Pvt. Ltd., and individual contributors.
    *
    * All rights reserved.
    */
    /*
    * Redistribution and use in source and binary forms, with or without modification,
    * are permitted provided that the following conditions are met:
    *
    *     1. Redistributions of source code must retain the above copyright notice,
    *        this list of conditions and the following disclaimer.
    *
    *     2. Redistributions in binary form must reproduce the above copyright
    *        notice, this list of conditions and the following disclaimer in the
    *        documentation and/or other materials provided with the distribution.
    *
    *     3. Neither the name of autojs nor the names of its contributors may be used
    *        to endorse or promote products derived from this software without
    *        specific prior written permission.
    *
    * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
    * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
    * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
    * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    *
    * reuses a lot of code from Nicholas C. Zakas textfield autocomplete example found here
    * http://oak.cs.ucla.edu/cs144/projects/javascript/suggest1.html
    *
    */
    
    /*
     * An autosuggest textbox control.
     */
    function AutoSuggestControl(id) {
        this.provider = new wordSuggestions();
        this.textbox = document.getElementById(id);
        this.init();
    }

    /**
     * Autosuggests one or more suggestions for what the user has typed.
     * If no suggestions are passed in, then no autosuggest occurs.
     */
    AutoSuggestControl.prototype.autosuggest = function (aSuggestions) {
        if (aSuggestions.length > 0) {
                this.typeAhead(aSuggestions[0]);
        }
    };
    
    /**
     * Handles keyup events.
     * @scope private
     * @param oEvent The event object for the keyup event.
     */
    AutoSuggestControl.prototype.handleKeyUp = function (oEvent) {
        var iKeyCode = oEvent.keyCode;
        var evtobj = oEvent;
        window.eventobj = evtobj;
        if (!((iKeyCode != 16 && iKeyCode < 32) || (iKeyCode >= 33 && iKeyCode <= 46) || (iKeyCode >= 112 && iKeyCode <= 123) || 
           (iKeyCode == 65 && evtobj.ctrlKey) || (iKeyCode == 90 && evtobj.ctrlKey))) {
            this.provider.requestSuggestions(this)
        }
    };
    
    /**
     * Initializes the textarea with event handlers for
     * auto suggest functionality.
     */
    AutoSuggestControl.prototype.init = function () {
        //save a reference to this object
        var oThis = this;
        //assign the onkeyup event handler
        lastDate = new Date();
        oThis.textbox.onkeyup = function (oEvent) {
            //check for the proper location of the event object
            if (!oEvent) {
                oEvent = window.event;
            }
            newDate = new Date();
            if (newDate.getTime() > lastDate.getTime() + 200) {
                oThis.handleKeyUp(oEvent);
                lastDate = newDate;
            }
        };
    };
    
    /**
     * Selects a range of text in the textarea.
     * @scope public
     * @param iStart The start index (base 0) of the selection.
     * @param iLength The number of characters to select.
     */
    AutoSuggestControl.prototype.selectRange = function (iStart, iLength) {
        //use text ranges for Internet Explorer
        if (this.textbox.createTextRange) {
            var oRange = this.textbox.createTextRange();
            oRange.moveStart("character", iStart);
            oRange.moveEnd("character", iLength);
            oRange.select();
        //use setSelectionRange() for Mozilla
        } else if (this.textbox.setSelectionRange) {
            this.textbox.setSelectionRange(iStart, iLength);
        }
        this.textbox.focus();
    };
    
    /**
     * Inserts a suggestion into the textbox, highlighting the
     * suggested part of the text.
     */
    AutoSuggestControl.prototype.typeAhead = function (sSuggestion) {
        if (this.textbox.createTextRange || this.textbox.setSelectionRange){
            var b = this.textbox.selectionStart;
            var e = this.textbox.selectionEnd;
            var v = this.textbox.value;
            var p = v.slice(0,b).lastIndexOf('\\');
            if (v.slice(b-1,b)==" ") {
                this.textbox.value = v.slice(0,p) + sSuggestion.slice(-1) + v.slice(e);
                this.selectRange(p+1,p+1); //place cursor after character
            } else {
                this.textbox.value = v.slice(0,b) + sSuggestion.slice(b-p-1) + v.slice(e);
                this.selectRange(b, e+sSuggestion.length-b+p+1); //highlight LaTeX completion
            }
        }
    };
    
    /**
     * Request suggestions for the given autosuggest control.
     */
    wordSuggestions.prototype.requestSuggestions = function (oAutoSuggestControl) {
        var aSuggestions = [];
        var b = oAutoSuggestControl.textbox.selectionStart;
        var e = oAutoSuggestControl.textbox.selectionEnd;
        var sTextbox = oAutoSuggestControl.textbox.value;
        var p = sTextbox.slice(0,b).lastIndexOf('\\');
        //console.log(p+','+b+sTextbox.slice(p,b)+"***")
        if (p >= 0 && p+1 < b && !(/\W/.test(sTextbox.slice(p+1,b-1)))) { // \W = any non-word char
            var bl = (sTextbox.slice(b-1,b)==" ")
            //console.log("bl"+sTextbox.slice(b-1,b)+(bl?"true":"false"))
            if (bl || !(/\W/.test(sTextbox.slice(b-1,b)))) {
                var sTextboxValue = sTextbox.slice(p+1,bl?b-1:b);
                for (var i=0; i < this.words.length && this.words[i].indexOf(sTextboxValue) != 0; i++) {}
                if (i < this.words.length) {
                    //console.log(sTextboxValue+"****"+(bl?"true":"false")+this.words[i].slice(-1))
                    aSuggestions.push(bl?this.words[i].slice(-1):this.words[i]);
                }
            }
        }
        oAutoSuggestControl.autosuggest(aSuggestions);
    };

    /**
     * Provides suggestions for each word.
     */
    function wordSuggestions() {
        this.words = [
'neg ¬',
'lor ∨',
'land ∧',
'implies ⟹',
'Longleftarrow ⟸',
'iff ⟺',
'forall ∀',
'exists ∃',
'nexists ∄',
'lozenge ◊',
'square □',
'bot ⊥',
'top ⊤',
'vdash ⊢',
'nvdash ⊬',
'Vdash ⊩',
'vDash ⊨',
'nvDash ⊭',
'in ∈',
'notin ∉',
'ni ∋',
'notni ∌',
'emptyset ∅',
'wp ℘',
'subset ⊂',
'nsubset ⊄',
'subseteq ⊆',
'nsubseteq ⊈',
'subsetneq ⊊',
'supset ⊃',
'nsupset ⊅',
'supseteq ⊇',
'nsupseteq ⊉',
'supsetneq ⊋',
'cap ∩',
'cup ∪',
'complement ∁',
'bigcap ⋂',
'bigcup ⋃',
'biguplus ⨄',
'downarrow ↓',
'uparrow ↑',
'updownarrow ↕',
'Downarrow ⇓',
'Uparrow ⇑',
'Updownarrow ⇕',
'hookrightarrow ↪',
'rightarrowtail ↣',
'twoheadrightarrow ↠',
'mapsto ↦',
'mapsfrom ↤',
'to →',
'rightarrow →',
'leftarrow ←',
'leftrightarrow ↔',
'Rightarrow ⇒',
'Leftarrow ⇐',
'Leftrightarrow ⇔',
'alpha α',
'beta β',
'chi χ',
'delta δ',
'Delta Δ',
'gamma γ',
'Gamma Γ',
'epsilon ϵ',
'varepsilon ɛ',
'eta η',
'kappa κ',
'lambda λ',
'Lambda Λ',
'mu μ',
'nu ν',
'omega ω',
'Omega Ω',
'phi ϕ',
'varphi φ',
'Phi Φ',
'pi π',
'Pi Π',
'psi ψ',
'Psi Ψ',
'rho ρ',
'sigma σ',
'Sigma Σ',
'tau τ',
'theta θ',
'vartheta ϑ',
'Theta Θ',
'upsilon υ',
'xi ξ',
'Xi Ξ',
'zeta ζ',
'aleph ℵ',
'beth ℶ',
'infty ∞',
'cdot ⋅',
'circ ∘',
'bullet •',
'div ÷',
'dotminus ∸',
'minusdot ⨪',
'mp ∓',
'pm ±',
'oplus ⊕',
'odot ⊙',
'ominus ⊖',
'oslash ⊘',
'obslash ⦸',
'sqcap ⊓',
'sqcup ⊔',
'amalg ⨿',
'times ×',
'ltimes ⋉',
'rtimes ⋊',
'bowtie ⋈',
'triangleleft ◃',
'triangleright ▹',
'barcap ⩃',
'barcup ⩂',
'uplus ⊎',
'vee ∨',
'wedge ∧',
'barvee ⊽',
'barwedge ⊼',
'wr ≀',
'Im ℑ',
'Re ℜ',
'sqrt √',
'cbrt ∛',
'fourthroot ∜',
'langle ⟨',
'rangle ⟩',
'lceil ⌈',
'rceil ⌉',
'lfloor ⌊',
'rfloor ⌋',
'llbracket ⟦',
'rrbracket ⟧',
'ldots …',
'adots ⋰',
'cdots ⋯',
'ddots ⋱',
'therefore ∴',
'approx ≈',
'cong ≅',
'equiv ≡',
'le ≤',
'nle ≰',
'ge ≥',
'nge ≱',
'leqq ≦',
'geqq ≧',
'll ≪',
'gg ≫',
'ne ≠',
'ngtr ≯',
'nless ≮',
'mid ∣',
'nmid ∤',
'prec ≺',
'nprec ⊀',
'preceq ⪯',
'succ ≻',
'nsucc ⊁',
'succeq ⪰',
'parallel ∥',
'nparallel ∦',
'propto ∝',
'sim ∼',
'sqsubset ⊏',
'sqsubseteq ⊑',
'sqsupset ⊐',
'sqsupseteq ⊒',
'angle ∠',
'Angle ⦜',
'checkmark ✓',
'clubsuit ♣',
'diamondsuit ♢',
'heartsuit ♡',
'spadesuit ♠',
'dagger †',
'degree °',
'ell ℓ',
'euro €',
'flat ♭',
'sharp ♯',
'frown ⌢',
'smile ⌣',
'hbar ħ',
'downzigzagarrow ↯',
'qed ∎',
'bigoplus ⨁',
'bigotimes ⨂',
'bigodot ⨀',
'bigsqcap ⨅',
'bigsqcup ⨆',
'bigstar ★',
'bigtimes ⨉',
'biguplus ⨃',
'bigvee ⋁',
'bigwedge ⋀',
'int ∫',
'iint ∬',
'iiint ∭',
'oint ∮',
'oiint ∯',
'oiiint ∰',
'partial ∂',
'del ∇',
'sum ∑',
'prod ∏',
'coprod ∐',
'False 𝔽',
'True 𝕋',
'Booleans 𝔹',
'Complex ℂ',
'Naturals ℕ',
'Primes ℙ',
'Rationals ℚ',
'Reals ℝ',
'Integers ℤ',
'BbbA 𝔸',
'mbfA 𝐀',
'mfrakA 𝔄',
'mbffrakA 𝕬',
'mitA 𝐴',
'mbfit 𝑨',
'msansA 𝖠',
'mbfsansA 𝗔',
'mitsansA 𝘈',
'mbfitsansA 𝘼',
'mscrA 𝒜',
'mbfscrA 𝓐',
'mttA 𝙰',
];
    }
