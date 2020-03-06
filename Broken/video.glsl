#ifdef GL_ES
  precision mediump float;
  #endif

  uniform sampler2D Video;
  //uniform sampler2D State;
  uniform vec2 resolution;

  void main() {
    // copy color info from texture
    gl_FragColor = vec4( texture2D( Video, gl_FragCoord.xy / resolution ).rgb, 1. );
  }