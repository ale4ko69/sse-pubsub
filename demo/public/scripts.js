function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = `; expires=${date.toUTCString()}`;
    }
    document.cookie = `${name}=${value || ""}${expires}; path=/`;
}

function getCookie(name) {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (const con of ca) {
        let c = con;
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

function randStr() {
    return Math.random().toString(36).substr(2);
};

function token() {
    return randStr() + randStr();
};

function randomIntInRange (low, high) {
    return Math.floor(Math.random() * high) + low;
}

function createChannelsByUserToken() {

    if (!getCookie('token')) {
        const _token = token()
        setCookie('token', _token, 1);
    }

    const el = document.querySelector('#single-ch');
    const es = new EventSource("/sse");

    es.addEventListener('uichange', ev => {
        const data = JSON.parse(ev.data);
        const logLine = document.createElement('div');
        logLine.innerHTML = `${moment().format('HH:mm:ss')}: ${data.message}`;
        el.appendChild(logLine);
        el.scrollTop = 9999999;
    });

    return es;
}

function addChannelListener(ch, eventName, cb, arrArgs) {

    const handler = (ev) => {
        console.log(`Fired event ${eventName}`);
        if (typeof cb === "function"){
            if (arrArgs) {
                cb(ev, [...arrArgs]);
            } else {
                cb(ev);
            }
        }

    }

    ch.addEventListener(eventName, handler);
    return handler
}

function closeChannel() {
    if(channel) channel.close();
}

async function sendMessage() {
    const elem = document.querySelector("#msg");
    const value = elem.value;

    elem.value = '';
    elem.focus()

    const response = await fetch(`/push?message=${value}`);
    console.log("sendMessage", response);
}

function subscribeNew(eventName){
    const handler = addChannelListener(channel, eventName, (ev, myName) => {
        console.log(`I'm ${myName} and I subscribed for ${eventName}`)
    }, ['Alex'])

    return () => channel.removeEventListener(eventName, handler)

}

