const udp = require('dgram')
const osc = require('osc-min')
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const clients = []

wss.on('connection', function connection(ws) {
    console.log('recived connection', ws)
    clients.push(ws)
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    //ws.send('something');
});

const sock = udp.createSocket("udp4", function(msg, rinfo) {
    try {
        const _msg = osc.fromBuffer( msg )
        clients.forEach( c => c.send( JSON.stringify(_msg) ))
        return console.log( osc.fromBuffer( msg ) )
    } catch (error) {
        return console.log( "installnvalid OSC packet", error )
    }
})

sock.bind(7500)