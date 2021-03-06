precision mediump float;
  uniform sampler2D state;
  uniform vec2 resolution;
  uniform float f;
  uniform float k;
  float dA = 1., dB = .5;

  // 2D Random
  float random (in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
  }

  vec2 get(int x, int y) {
    return texture2D( state, ( gl_FragCoord.xy + vec2(x, y) ) / resolution ).rg;
  }

  vec2 run() {
    vec2 state = get( 0, 0 );
    float a = state.r;
    float b = state.g;
    float sumA = a * -1.;
    float sumB = b * -1.;

    sumA += get(-1,0).r * .2;
    sumA += get(-1,-1).r * .05;
    sumA += get(0,-1).r * .2;
    sumA += get(1,-1).r * .05;
    sumA += get(1,0).r * .2;
    sumA += get(1,1).r * .05;
    sumA += get(0,1).r * .2;
    sumA += get(-1,1).r * .05;

    sumB += get(-1,0).g * .2;
    sumB += get(-1,-1).g * .05;
    sumB += get(0,-1).g * .2;
    sumB += get(1,-1).g * .05;
    sumB += get(1,0).g * .2;
    sumB += get(1,1).g * .05;
    sumB += get(0,1).g * .2;
    sumB += get(-1,1).g * .05;

    state.r = a + dA
      * sumA -
      a * b * b +
      f * (1. - a);

    state.g = b + dB *
      sumB +
      a * b * b -
      ((k+f) * b);

    return state;
  }
  void main() {
    vec2 nextState = run();
    gl_FragColor = vec4( nextState.r, nextState.g, 0., 1. );
  }