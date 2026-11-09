import { useEffect, useRef } from 'react'

// Full-screen WebGL shader sky: pink gradient + pixel dither, stepped
// pixel hills, twinkling sparkles and gentle mouse parallax.
const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;

// tiny hash for sparkles / dither
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 m = u_mouse * 0.6 + 0.4; // 0.2 .. 0.8

  // ---- pixelate the space a little for that retro feel ----
  float px = 180.0;
  vec2 puv = floor(uv * px) / px;
  vec2 fuv = puv + vec2((m.x - 0.5) * 0.03, (m.y - 0.5) * 0.02);

  // ---- vertical pink gradient ----
  vec3 top = vec3(0.99, 0.55, 0.72);   // bubblegum
  vec3 mid = vec3(1.00, 0.78, 0.88);   // baby pink
  vec3 bot = vec3(0.98, 0.36, 0.58);   // hot pink
  vec3 col = mix(top, mid, smoothstep(0.25, 0.75, fuv.y));
  col = mix(col, bot, smoothstep(0.30, 0.02, fuv.y));

  // ---- checker dither band near the top (like the screenshots) ----
  float checker = mod(floor(fuv.x * 60.0) + floor(fuv.y * 60.0), 2.0) * 0.5 + 0.5;
  if (fuv.y > 0.86) col += (checker - 0.5) * 0.10;

  // ---- pixel clouds drifting ----
  float cloudY = 0.72 + 0.10 * sin(fuv.x * 6.0 + u_time * 0.10);
  float cl = step(0.90, 0.5 + 0.5 * sin((fuv.x + u_time * 0.006) * 22.0)
                 * sin((fuv.y - cloudY) * 90.0));
  if (cl > 0.5 && fuv.y > 0.55 && fuv.y < 0.85) col = mix(col, vec3(1.0), 0.35);

  // ---- stepped pink hills along the bottom ----
  float hill1 = 0.16 + 0.05 * sin(fuv.x * 5.0 + 0.6);
  float hill2 = 0.11 + 0.04 * sin(fuv.x * 7.0 + 2.1);
  float hill3 = 0.06 + 0.02 * sin(fuv.x * 9.0 + 4.0);
  float stepH1 = floor(fuv.x * 90.0) / 90.0;
  if (fuv.y < hill1 + stepH1 * 0.02) col = mix(col, vec3(0.98, 0.52, 0.70), 0.85);
  if (fuv.y < hill2) col = mix(col, vec3(0.96, 0.40, 0.62), 0.90);
  if (fuv.y < hill3) col = mix(col, vec3(0.93, 0.26, 0.54), 0.95);

  // ---- flower dots along the very bottom ----
  if (fuv.y < 0.035) {
    float dots = step(0.72, hash(vec2(floor(fuv.x * 120.0), 0.0)));
    col = mix(col, vec3(1.0, 0.70, 0.82), dots * 0.8);
  }

  // ---- twinkling sparkles ----
  vec2 cell = floor(fuv * vec2(28.0, 16.0));
  float h = hash(cell);
  float tw = 0.5 + 0.5 * sin(u_time * (2.0 + h * 3.0) + h * 40.0);
  if (h > 0.93) {
    vec2 c = (cell + vec2(0.5)) / vec2(28.0, 16.0);
    float d = length((uv - c) * vec2(u_res.x / u_res.y, 1.0));
    float star = smoothstep(0.012, 0.0, d) * tw;
    col += vec3(1.0, 0.95, 0.98) * star;
  }

  // subtle vignette
  vec2 vc = uv - 0.5;
  col *= 1.0 - dot(vc, vc) * 0.25;

  gl_FragColor = vec4(col, 1.0);
}
`

export default function ShaderBackground() {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) return

    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'u_res')
    const uTime = gl.getUniformLocation(program, 'u_time')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.floor(canvas.clientWidth * dpr)
      canvas.height = Math.floor(canvas.clientHeight * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e) => {
      mouse.current.x = e.clientX / window.innerWidth
      mouse.current.y = e.clientY / window.innerHeight
    }
    window.addEventListener('pointermove', onMove)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let t0 = performance.now()
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const t = reduced ? 0 : (performance.now() - t0) / 1000
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, t)
      gl.uniform2f(uMouse, mouse.current.x, mouse.current.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return <canvas ref={canvasRef} className="shader-sky" aria-hidden="true" />
}
