precision mediump float;
  uniform sampler2D state;
  uniform sampler2D vState;
  uniform vec2 resolution;
  uniform float f;
  uniform mediump float time;
  //add a control for the direction
  //Use rotation?
  //add color controls here?

  vec4 blur5(sampler2D image, vec2 uv, vec2 res, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(2.3333333333333333) * (direction/tan(time));
    color += texture2D(image, uv) * 0.29411764705882354;
    color += texture2D(image, uv + (off1 / res)) * 0.35294117647058826;
    color += texture2D(image, uv - (off1 / res)) * 0.35294117647058826;
    return color;
  }

  void main() {
     vec2 pos = gl_FragCoord.xy / resolution;
     //vec4 color = vec4(0.0);

     vec4 blur = blur5( state, pos, resolution, vec2(2.) );
     vec4 vid = vec4(0.7, 0.2, 0.5, 1.0);//vec4( texture2D( vState, pos).rgb, 1. );
     vec4 s = vec4( texture2D( state, pos).rgb, 1. );

    //vec4 color = blur;

     vec4 color = vec4(vid.r * (1. - blur.r), vid.g * (1. - blur.r), vid.b * (1. - blur.r), 1.);

     gl_FragColor = vec4( color.r, color.g, color.b, 1. );
     //gl_FragColor = s;
  }