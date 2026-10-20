let datosMercado = {
    bcv: parseFloat(localStorage.getItem('bcv_guardado')) || 0.00,
    promedio: parseFloat(localStorage.getItem('prom_guardado')) || 0.00
};

let tasaBaseActual = 'bcv';

const usdInput = document.getElementById('usd-input');
const bsInput = document.getElementById('bs-input');
const bcvRateDisplay = document.getElementById('bcv-rate');
const promRateDisplay = document.getElementById('prom-rate');
const statusText = document.getElementById('status-text');
const updateTimeDisplay = document.getElementById('update-time');
const refreshBtn = document.getElementById('refresh-btn');
const calcTitle = document.getElementById('calc-title');
const cardBcv = document.getElementById('card-bcv');
const cardProm = document.getElementById('card-prom');

function obtenerTasaActiva() {
    return tasaBaseActual === 'bcv' ? datosMercado.bcv : datosMercado.promedio;
}

bcvRateDisplay.innerText = `${Number(datosMercado.bcv).toLocaleString("es-VE", {minimumFractionDigits: 2, maximumFractionDigits: 2})} Bs`;
promRateDisplay.innerText = `${Number(datosMercado.promedio).toLocaleString("es-VE", {minimumFractionDigits: 2, maximumFractionDigits: 2})} Bs`;

if (localStorage.getItem('hora_guardada')) {
    updateTimeDisplay.innerText = `Última actualización: ${localStorage.getItem('hora_guardada')}`;
}

usdInput.addEventListener('input', function() {
    let usd = parseFloat(usdInput.value);
    let tasaActiva = obtenerTasaActiva();
    if (isNaN(usd) || usd === "" || tasaActiva === 0) {
        bsInput.value = "";
    } else {
        bsInput.value = (usd * tasaActiva).toFixed(2);
    }
});

bsInput.addEventListener('input', function() {
    let bs = parseFloat(bsInput.value);
    let tasaActiva = obtenerTasaActiva();
    if (isNaN(bs) || bs === "" || tasaActiva === 0) {
        usdInput.value = "";
    } else {
        usdInput.value = (bs / tasaActiva).toFixed(2);
    }
});

cardBcv.addEventListener('click', function() {
    tasaBaseActual = 'bcv';
    cardBcv.classList.add('active-card');
    cardProm.classList.remove('active-card');
    calcTitle.innerText = "Calculadora Rápida (Base BCV)";
    if (usdInput.value) {
        usdInput.dispatchEvent(new Event('input'));
    }
});

cardProm.addEventListener('click', function() {
    tasaBaseActual = 'promedio';
    cardProm.classList.add('active-card');
    cardBcv.classList.remove('active-card');
    calcTitle.innerText = "Calculadora Rápida (Base Promedio)";
    if (usdInput.value) {
        usdInput.dispatchEvent(new Event('input'));
    }
});

document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.closest('.input-wrapper').querySelector('input');
        if (input && input.value) {
            navigator.clipboard.writeText(input.value);
        }
    });
});

async function cargarTasasEnVivo() {
    statusText.innerText = "Sincronizando con servidores...";
    refreshBtn.classList.add('is-spinning');

    try {
        let respuesta = await fetch('https://ve.dolarapi.com/v1/dolares');
        let docus = await respuesta.json();

        let bcvEncontrado = 0;
        let paraleloEncontrado = 0;

        for (let i = 0; i < docus.length; i++) {
            if (docus[i].fuente === 'oficial') {
                bcvEncontrado = docus[i].promedio;
            }
            if (docus[i].fuente === 'paralelo') {
                paraleloEncontrado = docus[i].promedio;
            }
        }

        if (bcvEncontrado > 0 && paraleloEncontrado > 0) {
            datosMercado.bcv = bcvEncontrado;
            datosMercado.promedio = paraleloEncontrado;

            let horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            localStorage.setItem('bcv_guardado', datosMercado.bcv);
            localStorage.setItem('prom_guardado', datosMercado.promedio);
            localStorage.setItem('hora_guardada', horaActual);

            statusText.innerText = "Datos en vivo actualizados • Sin publicidad";
            updateTimeDisplay.innerText = `Última actualización: ${horaActual}`;
        }
    } catch (error) {
        if (datosMercado.bcv > 0) {
            statusText.innerText = "Modo offline (Usando última tasa guardada)";
        } else {
            statusText.innerText = "Sin conexión y sin datos previos";
        }
    } finally {
        refreshBtn.classList.remove('is-spinning');
    }

    bcvRateDisplay.innerText = `${Number(datosMercado.bcv).toLocaleString("es-VE", {minimumFractionDigits: 2, maximumFractionDigits: 2})} Bs`;
    promRateDisplay.innerText = `${Number(datosMercado.promedio).toLocaleString("es-VE", {minimumFractionDigits: 2, maximumFractionDigits: 2})} Bs`;
}

refreshBtn.addEventListener('click', cargarTasasEnVivo);

cargarTasasEnVivo();
