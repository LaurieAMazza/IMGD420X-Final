#ifdef GL_ES
  precision mediump float;
  #endif

  uniform sampler2D Video;
  uniform sampler2D State;
  uniform vec2 resolution;

  void main() {
    //vec4 color = vec4(0.0);
    vec4 vid = vec4( texture2D( Video, gl_FragCoord.xy / resolution ).rgb, 1. );
    vec4 st = vec4( texture2D( State, gl_FragCoord.xy / resolution ).rgb, 1. );

    if(st.r > 0.9){
        gl_FragColor = vec4( texture2D( Video, gl_FragCoord.xy / resolution ).rgb, 1. );
    } else{
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
    // copy color info from texture
    //gl_FragColor = vec4( texture2D( Video, gl_FragCoord.xy / resolution ).rgb, 1. );
  }