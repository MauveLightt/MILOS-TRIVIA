const TIEMPO_MAX = 180;
let segundos = TIEMPO_MAX;
let respuestasUser = {};
let timer;
let reiniciosRestantes = 1;
let triviaIniciada = false;

const audiosCorrectos = ['assets/ahh.mp3', 'assets/wow.mp3'];
const audiosIncorrectos = ['assets/du.mp3', 'assets/fa.mp3'];

const soluciones = { 
    1: "B", 2: "C", 3: "A", 4: "B", 5: "C", 6: "A", 7: "B", 8: "C", 9: "A" 
};

const bgAudio = document.getElementById('milos-audio-bg');
const triviaAudio = document.getElementById('trivia-audio');

// --- NUEVO: CONTROLES DE INTERFAZ ---
const volumeSlider = document.getElementById('volume-slider');
const btnNeonToggle = document.getElementById('btn-neon-toggle');
const milosGrid = document.getElementById('milos-grid');

// Aplicar volumen inicial
bgAudio.volume = volumeSlider.value;
triviaAudio.volume = volumeSlider.value;

// Controlar el cambio de volumen
volumeSlider.addEventListener('input', (e) => {
    bgAudio.volume = e.target.value;
    triviaAudio.volume = e.target.value;
});

// Controlar el Borde Neón
btnNeonToggle.addEventListener('click', () => {
    milosGrid.classList.toggle('neon-border-active');
    if (milosGrid.classList.contains('neon-border-active')) {
        btnNeonToggle.innerText = 'BORDE NEÓN: ON';
        btnNeonToggle.style.background = '#005555';
    } else {
        btnNeonToggle.innerText = 'BORDE NEÓN: OFF';
        btnNeonToggle.style.background = 'transparent';
    }
});

// NUEVO: DETECTAR SI EL USUARIO MINIMIZA LA APP/PESTAÑA
// DETECTAR SI EL USUARIO MINIMIZA LA APP/PESTAÑA
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // Silencio total al minimizar o cambiar de pestaña
        bgAudio.pause();
        triviaAudio.pause();
    } else {
        // Al regresar, verificamos en qué estado se quedó el juego
        if (triviaIniciada) {
            if (document.querySelector('.milos-card.flipped')) {
                // Si hay una carta abierta, reanudamos la canción de la trivia
                triviaAudio.play().catch(e => { console.log("Autoplay bloqueado al regresar"); });
            } else {
                // Si estamos viendo la cuadrícula normal, reanudamos la música de fondo
                bgAudio.play().catch(e => { console.log("Autoplay bloqueado al regresar"); });
            }
        }
    }
});
// ------------------------------------

const textElement = document.getElementById('typewriter-text');
const msg = "PRESIONA PARA CONTINUAR.";
let charIdx = 0;

function typeWriter() {
    if (charIdx < msg.length) {
        textElement.innerHTML += msg.charAt(charIdx);
        charIdx++;
        setTimeout(typeWriter, 60);
    } else {
        document.getElementById('btn-deploy').classList.remove('hidden');
    }
}
window.onload = typeWriter;

document.getElementById('btn-deploy').onclick = () => {
    document.getElementById('overlay').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('game-ui').classList.remove('hidden');
        milosGrid.classList.remove('hidden');
        
        document.querySelectorAll('.milos-card:not(.flipped) .milos-v').forEach(v => {
            let playPromise = v.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => { console.log("Autoplay bloqueado"); });
            }
        });
        
        bgAudio.play(); 
    }, 500);
};

document.getElementById('start-game-btn').onclick = function() {
    if (triviaIniciada) return;
    triviaIniciada = true;
    this.style.display = 'none'; 
    bgAudio.pause(); 
    
    timer = setInterval(() => {
        segundos--;
        document.getElementById('timer-count').innerText = segundos;
        if (segundos <= 0) finalizar('timeout');
    }, 1000);
};

function flipCard(card) {
    if (card.classList.contains('locked') || !triviaIniciada || card.classList.contains('correct') || card.classList.contains('incorrect')) return;
    
    const yaAbierta = card.classList.contains('flipped');
    const video = card.querySelector('.milos-v');

    if (!yaAbierta) {
        bgAudio.pause(); 
        document.querySelectorAll('.milos-card.flipped').forEach(c => { 
            if(c !== card) {
                c.classList.remove('flipped'); 
                let v = c.querySelector('.milos-v');
                if(v) v.play().catch(e => {});
            }
        });
    }

    card.classList.toggle('flipped');
    
    if (card.classList.contains('flipped')) {
        iniciarCancion(card);
        if(video) video.pause();
    } else {
        detenerCancion();
        if(video) video.play().catch(e => {});
        
        setTimeout(() => {
            if (!document.querySelector('.milos-card.flipped')) bgAudio.play();
        }, 50);
    }
}

function iniciarCancion(card) {
    bgAudio.pause(); 
    const id = card.closest('.milos-frame').id.split('-')[1];
    triviaAudio.src = `assets/mb${id}.mp3`;
    const barra = document.getElementById(`pb-${id}`);
    
    document.querySelectorAll('.progress-bar').forEach(b => b.style.width = '0%');
    triviaAudio.play();

    triviaAudio.ontimeupdate = () => {
        if (triviaAudio.duration) {
            const porcentaje = (triviaAudio.currentTime / triviaAudio.duration) * 100;
            if (barra) barra.style.width = porcentaje + "%";
        }
    };
    triviaAudio.onended = () => { if (barra) barra.style.width = '100%'; };
}

function detenerCancion() {
    triviaAudio.pause();
    triviaAudio.currentTime = 0;
}

function lockCard(btn, id) {
    const card = btn.closest('.milos-card');
    const sel = card.querySelector(`input[name="q${id}"]:checked`);
    if (!sel) return; 

    detenerCancion();
    bgAudio.pause();
    
    respuestasUser[id] = sel.value;
    const esCorrecto = (sel.value === soluciones[id]);

    if (esCorrecto) {
        card.classList.add('correct');
        const sfx = new Audio(audiosCorrectos[Math.floor(Math.random() * audiosCorrectos.length)]);
        sfx.volume = volumeSlider.value; // Que respete el slider
        sfx.play().catch(e => {});
    } else {
        card.classList.add('incorrect');
        const sfx = new Audio(audiosIncorrectos[Math.floor(Math.random() * audiosIncorrectos.length)]);
        sfx.volume = volumeSlider.value; // Que respete el slider
        sfx.play().catch(e => {});
    }

    setTimeout(() => {
        card.classList.add('locked');
        card.classList.remove('flipped'); 
        
        const terminamos = Object.keys(respuestasUser).length === 9;
        
        if (!terminamos && !document.querySelector('.milos-card.flipped')) {
            bgAudio.play();
        }
        
        if (terminamos) finalizar('results');
    }, 1200);
}

function finalizar(modo) {
    clearInterval(timer);
    bgAudio.pause();
    triviaAudio.pause();
    
    if (modo === 'results') {
        let score = 0;
        for (let i in soluciones) if (respuestasUser[i] === soluciones[i]) score++;
        
        document.getElementById('score-display').innerText = `${score} / 9`;
        const prizeZone = document.getElementById('prize-zone');

        if (score === 9) { 
            prizeZone.innerHTML = `
                <p class='neon-text' style='color:#ff00ff;'>¡PERFECTO!</p>
                <div class="prize-media">
                    <video src="assets/pantalla.mp4" controls style="border: 3px solid #ff00ff;"></video>
                </div>
                <p class="pixel-text" style="color:#00ffff; margin-top:10px;">Válido para la compra de un monitor.</p>
            `;
        } else if (score >= 7) { 
            prizeZone.innerHTML = `
                <p class='neon-text' style='color:#00ffff;'>¡Casi perfecto! </p>
                <div class="prize-media" style="background:#fff; padding:10px; border-radius:10px; border: 4px solid #e53935;">
                    <img src="assets/pollo_s.png" style="image-rendering: pixelated; width: 150px;">
                </div>
                <p class="pixel-text" style="color:#fff; margin-top:10px;">
                    Válido por un KFC en la fecha y local de su elección<br><br>
                    <span style="color:#aaa;">O intercambiable por un segundo intento (en 2 días).</span>
                </p>
            `;
        } else if (score >= 5) { 
            prizeZone.innerHTML = `
                <p class='neon-text' style='color:#0f0;'>¡Ajustando... pero ganaste! </p>
                <div class="prize-media" style="position:relative; display:inline-block;">
                    <img src="assets/juego.jpg" style="border: 2px solid #0f0; filter: brightness(0.8);">
                    <p class="pixel-text" style="color:#fff; position:absolute; top: 10%; left: 0; width: 100%;">Válido por 1<br><br>juego sorpresa<br><br>en Steam</p>
                </div>
            `;
        } else { 
            prizeZone.innerHTML = `
                <p style='color:red; font-size: 1.5rem; font-family: "Consolas", monospace;'>Vuelve a intentarlo 🤡</p>
                <div class="prize-media" style="margin-top:15px;">
                    <img src="assets/kat2.png" style="image-rendering: pixelated; width: 150px; border-radius:10px;">
                </div>
            `;
        }
        document.getElementById('results-screen').classList.remove('hidden');
    } else {
        document.getElementById('timeout-screen').classList.remove('hidden');
    }
}

[document.getElementById('btn-restart-results'), document.getElementById('btn-restart-timeout')].forEach(btn => {
    btn.onclick = () => {
        if (reiniciosRestantes > 0) { 
            reiniciosRestantes--; 
            location.reload(); 
        } else {
            btn.innerText = "SISTEMA BLOQUEADO";
            btn.style.borderColor = "red";
            btn.style.color = "red";
            btn.style.boxShadow = "0 0 10px red";
        }
    };
});