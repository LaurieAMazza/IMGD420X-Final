const glslify = require('glslify')
var shell = require('gl-now')()
const fbo = require('gl-fbo')
const fillScreen = require('a-big-triangle')
const createShader = require('gl-shader')
const toy     = require('gl-toy')

const draw = glslify('./draw.glsl')
const vert = glslify('./vert.glsl')
const frag = glslify('./frag.glsl')
const vid = glslify('./video.glsl')

var dShader, upShader, state, stateSize, current =0, time = 0

let oct1 = 0.0457, oct2 = 8, oct3 = 3, textureLoaded = false
const ws = new WebSocket('ws://127.0.0.1:8080')
ws.onmessage = function(msg){
    const json = JSON.parse(msg.data)
    //console.log('msg recieved:', msg)
    if(json.address === '/rotation_vector/r1'){
        console.log(json.args[0].value)
       if(Math.abs(json.args[0].value) < 0.099 && Math.abs(json.args[0].value) > 0.03){
            oct1 = Math.abs(json.args[0].value)
        } else if(Math.abs(json.args[0].value) > 0.099){
            oct1 = (Math.abs(json.args[0].value)/10.0) + 0.029
        } else{
            oct1 = Math.abs(json.args[0].value) + 0.03//0.0457
        }
    }

    if(oct1 < 0.039){
        //oct1 = 0.04
    } else if(oct1 > 0.075){
        //oct1 = 0.07
    }
    console.log(oct1)
}


shell.on("gl-init", function () {
    var gl = shell.gl
    const canvas = document.querySelector( 'canvas' )
    canvas.width = window.innerWidth
    //console.log(canvas.width)
    const w = gl.drawingBufferWidth
    const h = gl.drawingBufferHeight
    //console.log(w)

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
    upShader.uniforms.f = oct1
    //upShader.uniforms.time = time

    fillScreen(gl)
})

//hi
shell.on("gl-render", function () {
    var gl = shell.gl

    dShader.bind()
    dShader.uniforms.state = state[ current ].color[0].bind()
    dShader.uniforms.resolution = state[current].shape
    dShader.uniforms.time = time++
    dShader.uniforms.f = oct1
    fillScreen(gl)
})