(function() {
  const canvas = document.getElementById('gol-canvas');
  if (!canvas) return;
  
  const gl = canvas.getContext('webgl', { 
    antialias: false,
    preserveDrawingBuffer: true
  });
  
  if (!gl) {
    console.error('WebGL not supported');
    return;
  }

  const vertexShaderSrc = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const computeShaderSrc = `
    precision highp float;
    uniform sampler2D u_state;
    uniform vec2 u_resolution;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 texel = 1.0 / u_resolution;
      float alive = texture2D(u_state, v_texCoord).r;
      
      int neighbors = 0;
      
      for (int dx = -1; dx <= 1; dx++) {
        for (int dy = -1; dy <= 1; dy++) {
          if (dx == 0 && dy == 0) continue;
          float n = texture2D(u_state, v_texCoord + vec2(float(dx), float(dy)) * texel).r;
          neighbors += int(n > 0.5);
        }
      }
      
      float next = 0.0;
      if (alive > 0.5) {
        if (neighbors == 2 || neighbors == 3) next = 1.0;
      } else {
        if (neighbors == 3) next = 1.0;
      }
      
      gl_FragColor = vec4(next, next, next, 1.0);
    }
  `;

  const displayShaderSrc = `
    precision highp float;
    uniform sampler2D u_state;
    uniform float u_time;
    varying vec2 v_texCoord;
    
    void main() {
      float alive = texture2D(u_state, v_texCoord).r;
      
      if (alive < 0.5) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
      }
      
      float pulse = 0.7 + 0.3 * sin(u_time * 3.0);
      float noise = fract(sin(dot(v_texCoord, vec2(12.9898, 78.233))) * 43758.5453);
      
      float r = pulse;
      float g = pulse * (0.15 + 0.2 * noise);
      float b = pulse * (0.05 + 0.1 * noise);
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(vsSrc, fsSrc) {
    const vs = createShader(gl.VERTEX_SHADER, vsSrc);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return null;
    
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  const computeProgram = createProgram(vertexShaderSrc, computeShaderSrc);
  const displayProgram = createProgram(vertexShaderSrc, displayShaderSrc);

  if (!computeProgram || !displayProgram) {
    console.error('Failed to create shader programs');
    return;
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  1, -1,  -1, 1,  1, 1
  ]), gl.STATIC_DRAW);

  let gridW, gridH;
  let tex = [null, null];
  let fbo = [null, null];
  let current = 0;

  function createTexture(w, h, data) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  function createFBO(tex) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return fb;
  }

  function init(w, h) {
    gridW = Math.floor(w / 4);
    gridH = Math.floor(h / 4);
    canvas.width = gridW * 4;
    canvas.height = gridH * 4;
    
    const data = new Uint8Array(gridW * gridH * 4);
    for (let i = 0; i < gridW * gridH; i++) {
      const alive = Math.random() < 0.25;
      data[i * 4] = alive ? 255 : 0;
      data[i * 4 + 1] = alive ? 255 : 0;
      data[i * 4 + 2] = alive ? 255 : 0;
      data[i * 4 + 3] = 255;
    }
    
    for (let i = 0; i < 2; i++) {
      if (tex[i]) gl.deleteTexture(tex[i]);
      if (fbo[i]) gl.deleteFramebuffer(fbo[i]);
      tex[i] = createTexture(gridW, gridH, data);
      fbo[i] = createFBO(tex[i]);
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function computeStep() {
    gl.useProgram(computeProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - current]);
    gl.viewport(0, 0, gridW, gridH);
    
    const posLoc = gl.getAttribLocation(computeProgram, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex[current]);
    gl.uniform1i(gl.getUniformLocation(computeProgram, 'u_state'), 0);
    gl.uniform2f(gl.getUniformLocation(computeProgram, 'u_resolution'), gridW, gridH);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    current = 1 - current;
  }

  function display(time) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(displayProgram);
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    const posLoc = gl.getAttribLocation(displayProgram, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex[current]);
    gl.uniform1i(gl.getUniformLocation(displayProgram, 'u_state'), 0);
    gl.uniform1f(gl.getUniformLocation(displayProgram, 'u_time'), time);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  let frameCount = 0;

  function animate(time) {
    frameCount++;
    
    if (frameCount % 4 === 0) {
      computeStep();
    }
    
    display(time / 1000);
    requestAnimationFrame(animate);
  }

  function resize() {
    init(window.innerWidth, window.innerHeight);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(animate);
  
  console.log('Game of Life initialized:', gridW, 'x', gridH);
})();
