    (function(){
      const TARGET = '136.555';
      const input = document.getElementById('freqInput');
      const ambient = document.getElementById('ambient');
      const success = document.getElementById('success');
      const wrongPool = [document.getElementById('wrong1'), document.getElementById('wrong2'), document.getElementById('wrong3')];
      const transcriptionEl = document.getElementById('transcription');
      const card = document.getElementById('card');
      let ambientStarted = false;

      /* ---------- format helpers ---------- */
      function formatFreq(raw){
        const digits = (raw || '').replace(/\D/g,'').slice(0,6);
        if(digits.length<=3) return digits;
        return digits.slice(0,3) + '.' + digits.slice(3);
      }

      function startAmbientIfNeeded(){
        if(ambientStarted) return;
        try{ ambient.volume = 0.12; ambient.play(); ambientStarted=true; }catch(e){}
      }

      /* ---------- input behaviour ---------- */
      input.addEventListener('keydown', e=>{ if(e.key===' '){ e.preventDefault(); } });
      input.addEventListener('input', ()=>{ 
        const formatted = formatFreq(input.value);
        input.value = formatted;
        input.setAttribute('data-text', formatted);
        input.classList.add('glitch-text');
      });
      input.addEventListener('focus', ()=> startAmbientIfNeeded());
      input.addEventListener('keyup', e=>{ if(e.key==='Enter') submit(); });
      input.addEventListener('paste', e=>{
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const formatted = formatFreq(text);
        input.value = formatted;
      });

      /* ---------- submit logic ---------- */
      function submit(){
        const val = (input.value || '').trim();
        startAmbientIfNeeded();
        if(val === TARGET){
          try{ success.volume = 0.16; success.currentTime = 0; success.play(); }catch(e){}
          revealTranscription();
        } else {
          const r = Math.floor(Math.random()*wrongPool.length);
          const audio = wrongPool[r];
          if(audio){ try{ audio.currentTime=0; audio.volume=0.22; audio.play(); }catch(e){} }
          card.classList.add('glitch');
          setTimeout(()=> card.classList.remove('glitch'),520);
          try{ ambient.pause(); ambient.currentTime=0; }catch(e){}
          setTimeout(()=>{ location.reload(); }, 3000);
        }
      }

      /* ---------- typing reveal ---------- */
      function revealTranscription(){
        try{ ambient.volume = 0.02; setTimeout(()=>ambient.pause(),1600); }catch(e){}
        const lines = [
          "teste teste teste",
          "teste2 teste2 teste2",
          "Alguém costurou um nome dentro do microfone e nunca mais tirou.",
          "Choveubaixo do telhado: metal derretido em forma de lágrima; havia rótulos em língua de inseto.",
          "A criança aprendeu a cantar com os pregos e agora quer que você cante também.",
          "Há um espelho que esqueceu como refletir — ele mastiga promessas e as devolve como moeda.",
          "Não é memória. É um recado rasgado em pele falsa: segure a respiração e ouça o piso resolver seu nome.",
          "O que você chamou de silêncio estava apenas adormecido com fome. Não acorde o que já tem dentes.",
          "Se tentou catalogar os sons, saiba: as palavras se dobram em argila e fazem uma escada para o porão.",
          "Fique. Não fique. É indiferente. As portas contaram a piada antes de perceberem que não havia plateia.",
          "— nada aqui pede licença. aceita o erro; ele é um convite com sobra de sangue."
        ];

        transcriptionEl.innerHTML = '';
        transcriptionEl.classList.add('show');

        let lineIndex = 0;
        function typeLine(){
          if(lineIndex >= lines.length) return;
          const txt = lines[lineIndex];
          const lineEl = document.createElement('div');
          lineEl.className = 'typed-line';
          transcriptionEl.appendChild(lineEl);

          let i = 0;
          const baseDelay = 28;
          const jitter = 12;
          function typeChar(){
            if(i <= txt.length){
              lineEl.textContent = txt.slice(0, i);
              transcriptionEl.scrollTop = transcriptionEl.scrollHeight;
              i++;
              setTimeout(typeChar, baseDelay + Math.floor(Math.random()*jitter));
            } else {
              lineIndex++;
              setTimeout(typeLine, 420);
            }
          }
          typeChar();
        }
        typeLine();
      }

      /* ---------- initial focus ---------- */
      input.focus();

      /* ---------- grain/noise image check + canvas fallback ---------- */
      (function ensureOverlays(){
        const grainEl = document.getElementById('overlay-grain');
        const noiseEl = document.getElementById('overlay-noise');
        const grainPath = grainEl.getAttribute('style')?.match(/url\(['"]?([^'")]+)['"]?\)/)?.[1] || 'images/grain.png';
        const noisePath = noiseEl.getAttribute('style')?.match(/url\(['"]?([^'")]+)['"]?\)/)?.[1] || 'images/noise.png';

        function testImage(path){ 
          return new Promise(res=>{
            const img = new Image();
            img.onload = ()=> res(true);
            img.onerror = ()=> res(false);
            // bust cache for debug
            img.src = path + '?_v=' + (new Date()).getTime();
          });
        }

        async function run(){
          const gOk = await testImage(grainPath).catch(()=>false);
          const nOk = await testImage(noisePath).catch(()=>false);

          if(!gOk || !nOk){
            console.warn('[overlay] grain or noise failed to load. Using canvas fallback.');
            // create a small tile for grain
            const c = document.createElement('canvas');
            c.width = 256; c.height = 256;
            const ctx = c.getContext('2d');
            const imgd = ctx.createImageData(c.width, c.height);
            for(let i=0;i<imgd.data.length;i+=4){
              const v = Math.random()*255|0;
              imgd.data[i] = v; imgd.data[i+1] = v; imgd.data[i+2] = v;
              imgd.data[i+3] = Math.random()*40|0; // slight transparency
            }
            ctx.putImageData(imgd,0,0);
            const dataUrl = c.toDataURL('image/png');

            // apply to grainEl
            if(grainEl) {
              grainEl.style.backgroundImage = `url('${dataUrl}')`;
              grainEl.style.mixBlendMode = 'screen';
              grainEl.style.opacity = '0.12';
            }

            // noise fallback: use a larger canvas with stronger noise
            const c2 = document.createElement('canvas');
            c2.width = 512; c2.height = 256;
            const ctx2 = c2.getContext('2d');
            const id2 = ctx2.createImageData(c2.width,c2.height);
            for(let i=0;i<id2.data.length;i+=4){
              const v = Math.random()*255|0;
              id2.data[i] = v; id2.data[i+1] = v; id2.data[i+2] = v;
              id2.data[i+3] = Math.random()*80|0;
            }
            ctx2.putImageData(id2,0,0);
            const dataUrl2 = c2.toDataURL('image/png');
            if(noiseEl){
              noiseEl.style.backgroundImage = `url('${dataUrl2}')`;
              noiseEl.style.mixBlendMode = 'overlay';
              noiseEl.style.opacity = '0.14';
            }
          } else {
            // if both ok, ensure opacities suitable
            if(grainEl) grainEl.style.opacity = '0.09';
            if(noiseEl) noiseEl.style.opacity = '0.12';
          }
        }

        run();
      })();

      /* Optional: small UX: press Enter on body to submit when input focused */
      document.addEventListener('keydown', e=>{
        if(e.key === 'Enter' && document.activeElement === input){
          submit();
        }
      });

    })();