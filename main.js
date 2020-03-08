const glslify = require('glslify')
var shell = require('gl-now')()
const fbo = require('gl-fbo')
const fillScreen = require('a-big-triangle')
const createShader = require('gl-shader')

const draw = glslify('./draw.glsl')
const vert = glslify('./vert.glsl')
const frag = glslify('./frag.glsl')

var dShader, upShader, state, vide, stateSize, current =0, time = 0, w

let fVal = 0.0457, dirx = 2.0, diry = 3.0, b = 1., g = 1., r = 1., kVal = 0.0635, light = 0.0457
const ws = new WebSocket('ws://127.0.0.1:8080')
ws.onmessage = function(msg){
    const json = JSON.parse(msg.data)
    //console.log('msg recieved:', msg)
    //The more light the device is exposed to, the greater the blur will be
    if(json.address === '/light'){
        light = json.args[0].value

        //fixes the signal to usable numbers
        if (light > 999.99){
            light = json.args[0].value / 1000.0
        } else if (light > 99.99){
            light = json.args[0].value / 100.0
        } else if(light > 9.99){
            light = json.args[0].value / 10.0
        } else {
            light = json.args[0].value
        }
    }

    //This makes it so if you shake the phone side to side, the kill rate increases
    if(json.address === '/accelerometer/linear/x'){
        console.log("k" + json.args[0].value)
        if(Math.abs(json.args[0].value) > 10){
            kVal = Math.abs(json.args[0].value)/1000.0
        } else if(Math.abs(json.args[0].value) > 1){
            kVal = Math.abs(json.args[0].value)/100.0
        } else {
            kVal = Math.abs(json.args[0].value)
        }
    }

    if(json.address === '/accelerometer/gravity/z'){
        console.log("gz" + json.args[0].value)
        dirx = Math.abs(json.args[0].value)
    }

    if(json.address === '/accelerometer/gravity/y'){
        console.log("gy" + json.args[0].value)
        diry = Math.abs(json.args[0].value)
    }

    //Rotate the phone to "blend" the colors
    if(json.address === '/rotation_vector/r1'){
        //console.log(json.args[0].value)
        b = Math.abs(json.args[0].value)
    }

    if(json.address === '/rotation_vector/r2'){
        //console.log(json.args[0].value)
        g = Math.abs(json.args[0].value)
    }

    if(json.address === '/rotation_vector/r3'){
        //console.log(json.args[0].value)
        r = Math.abs(json.args[0].value)
    }

    if(Math.abs(kVal - fVal) < 0.0178 || (kVal - fVal) > 0.02){
        kVal = fVal + 0.0178
    }

    console.log("f" + fVal)

    console.log("k" + kVal)
}

shell.on("gl-init", function () {
    var gl = shell.gl
    const canvas = document.querySelector( 'canvas' )
    canvas.width = window.innerWidth
    w = canvas.width
    const h = gl.drawingBufferHeight

    gl.disable(gl.DEPTH_TEST)

    upShader = createShader(gl, vert, frag)
    dShader = createShader(gl, vert, draw)

    state =[fbo(gl, [canvas.width,canvas.width]), fbo(gl, [canvas.width,canvas.width])]

    stateSize = Math.pow( 2, Math.floor(Math.log(canvas.width)/Math.log(2)) )
    var pixelSize = 4
    var feedSize = 48

    var initial_conditions = new Float32Array(stateSize*stateSize*pixelSize)
    state[0].color[0].bind()
    for( let i = 0; i < stateSize; i++ ) {
        for( let j = 0; j < stateSize * pixelSize; j+= pixelSize ) {
            // this will be our 'a' value in the simulation
            initial_conditions[ i * stateSize * pixelSize + j ] = 1
            // selectively add 'b' value to middle of screen
            if( i > stateSize / 2 - stateSize / feedSize  && i < stateSize / 2 + stateSize / feedSize ) {
                const xmin = j > (stateSize*pixelSize) / 2 - stateSize / feedSize
                const xmax = j < (stateSize*pixelSize) / 2 + (stateSize*pixelSize) / feedSize
                if( xmin && xmax ) {
                    initial_conditions[ i * stateSize * pixelSize + j + 1 ] = 1
                }
            }
        }
    }

    gl.texSubImage2D(
        gl.TEXTURE_2D, 0, 0, 0, stateSize, stateSize, gl.RGBA, gl.FLOAT, initial_conditions
    )
})

shell.on("tick", function () {
    var gl = shell.gl

    var prevState = state[current]
    var curState = state[current ^= 1]

    curState.bind()//fbo

    upShader.bind()
    upShader.uniforms.state = prevState.color[0].bind()
    upShader.uniforms.resolution = prevState.shape
    upShader.uniforms.f = fVal
    upShader.uniforms.k = kVal

    fillScreen(gl)
})

//hi
shell.on("gl-render", function () {
    var gl = shell.gl

    dShader.bind()
    dShader.uniforms.state = state[ current ].color[0].bind()
    dShader.uniforms.vState = vide
    dShader.uniforms.resolution = state[current].shape
    dShader.uniforms.time = time++
    dShader.uniforms.dirx = dirx
    dShader.uniforms.diry = diry
    dShader.uniforms.cB = b
    dShader.uniforms.cG = g
    dShader.uniforms.cR = r
    dShader.uniforms.blr = light
    fillScreen(gl)
})