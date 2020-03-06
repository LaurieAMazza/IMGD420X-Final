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

var dShader, upShader, vShader, state, vide, stateSize, current =0, time = 0, w

let oct1 = 0.0457, oct2 = 2.0, oct3 = 3.0, oct4 = 0.5, oct5 = 0.5, oct6 = 0.5, oct7 = 0.5, textureLoaded = false
const ws = new WebSocket('ws://127.0.0.1:8080')
ws.onmessage = function(msg){
    const json = JSON.parse(msg.data)
    //console.log('msg recieved:', msg)
    /*if(json.address === '/rotation_vector/r1'){
        //console.log(json.args[0].value)
       if(Math.abs(json.args[0].value) < 0.5){
            oct7 = Math.abs(json.args[0].value)
        } else{
            oct7 = 0.5
        }
    } */
    if(json.address === '/light'){
        //console.log(json.args[0].value)
        var light = json.args[0].value / 10000.0
        if( light < 0.099 && light > 0.04){
            oct1 = Math.abs(json.args[0].value)
        } else if(light > 0.099){
            oct1 = 0.07
        } else{
            oct1 = 0.0457
        }
    }

    if(json.address === '/accelerometer/gravity/z'){
        console.log("gz" + json.args[0].value)
        oct2 = Math.abs(json.args[0].value)
    }

    if(json.address === '/accelerometer/gravity/y'){
        console.log("gy" + json.args[0].value)
        oct3 = Math.abs(json.args[0].value)
    }

    if(json.address === '/rotation_vector/r4'){
        console.log(json.args[0].value)
        oct4 = Math.abs(json.args[0].value)
    }

    if(json.address === '/rotation_vector/r3'){
        console.log(json.args[0].value)
        oct5 = Math.abs(json.args[0].value)
    }

    if(json.address === '/rotation_vector/r2'){
        console.log(json.args[0].value)
        oct6 = Math.abs(json.args[0].value)
    }

    if(oct1 < 0.039){
        oct1 = 0.04
    } else if(oct1 > 0.075){
        oct1 = 0.06
    }
    console.log(oct1)
}

function getVideo(gl) {
    video = document.createElement( 'video' )

    navigator.mediaDevices.getUserMedia({
        video:true
    }).then( stream => {
        video.srcObject = stream
        video.play()
        makeTexture(gl)
    })

    return video
}

function makeTexture(gl) {
    // create an OpenGL texture object
    vide = gl.createTexture()

    // this tells OpenGL which texture object to use for subsequent operations
    gl.bindTexture( gl.TEXTURE_2D, vide )
    //l.bindTexture(gl.TEXTURE_2D, vide.color[0])

    // since canvas draws from the top and shaders draw from the bottom, we
    // have to flip our canvas when using it as a shader.
    gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, true )

    // how to map when texture element is more than one pixel
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR )
    // how to map when texture element is less than one pixel
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR )

    // you must have these properties defined for the video texture to
    // work correctly
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )

    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, w, w, 0, gl.RGBA, gl.FLOAT, null )

    // let our render loop know when the texture is ready
    textureLoaded = true
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

    //video = getVideo(gl)
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
    //upShader.uniforms.k = oct7

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
    dShader.uniforms.dirx = oct2
    dShader.uniforms.diry = oct3
    dShader.uniforms.cB = oct4
    dShader.uniforms.cG = oct5
    dShader.uniforms.cR = oct6
    fillScreen(gl)
})