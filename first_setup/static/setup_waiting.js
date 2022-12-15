const status_p = document.getElementById('status');

const start_time = new Date();

function factorise(n) {
    n = Math.floor(n);
    if(n<2) {
        return {};
    }
    const factors = {};
    let t = 0;
    while(n%2 == 0) {
        n = n / 2;
        t += 1;
    }
    factors[2] = t;
    for(let p=3;n>1;p += 2) {
        t = 0;
        while(p<=n && n%p==0) {
            t += 1
            n = n / p;
        }
        factors[p] = t;
    }
    return factors;
}

function show_time_taken(dt) {
    dt = Math.floor(dt/1000);
    if(dt<2 || dt>1000) {
        return dt+'';
    }

    const factors = factorise(dt);
    return Object.entries(factors).filter(([p,q]) => q>0).map(([p,q]) => `${p}<sup>${q}</sup>`).join(' × ');
}

const check_interval = setInterval(async () => {
    try {
        const result = await fetch('/setup-status');
        const status = await result.text();

        const dt = (new Date()) - start_time;
        document.getElementById('time-taken').innerHTML = show_time_taken(dt);

        document.querySelector('main').setAttribute('class',status);

        if(status == 'finished') {
            clearInterval(check_interval);
            window.location = '/finished';
        }
    } catch(e) {
        document.querySelector('main').setAttribute('class','error');
        document.getElementById('error-message').textContent = e.message;
        console.error(e);
        clearInterval(check_interval);
    }
}, 1000);
