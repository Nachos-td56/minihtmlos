let cubeWindow = null;

function openCubeApp() {
  if (cubeWindow) return;

  const content = openWindow("cube", "3D Cube", `
    <canvas id="cubeCanvas" width="520" height="520"
      style="display:block;margin:auto;border:2px solid #333;background:#000;"></canvas>
    <div style="text-align:center;color:#aaa;font-family:monospace;font-size:12px;margin-top:6px;">
      Tip: Spinning cube with lighting. Close window to stop.
    </div>
  `, 620, 608);

  const canvas = content.querySelector("#cubeCanvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    canvas.outerHTML = "<div style='color:red;text-align:center;'>WebGL not supported</div>";
    return;
  }

  const vertexShaderSrc = `
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec3 color;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform vec3 lightDir;

    varying vec3 vColor;

    void main(void) {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

      // Transform normal using rotation part of modelView (vec4(normal,0.0))
      vec3 n = normalize((modelViewMatrix * vec4(normal, 0.0)).xyz);

      float diffuse = max(dot(n, normalize(lightDir)), 0.0);
      float ambient = 0.18;
      float intensity = ambient + 0.82 * diffuse;

      vColor = color * intensity;
    }
  `;

  const fragmentShaderSrc = `
    precision mediump float;
    varying vec3 vColor;
    void main(void) {
      gl_FragColor = vec4(vColor, 1.0);
    }
  `;

  function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compileShader(vertexShaderSrc, gl.VERTEX_SHADER);
  const fs = compileShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  const verts = new Float32Array([
    -1, -1,  1,   0, 0, 1,    0.2, 1.0, 0.2,
     1, -1,  1,   0, 0, 1,    0.2, 1.0, 0.2,
     1,  1,  1,   0, 0, 1,    0.2, 1.0, 0.2,
    -1,  1,  1,   0, 0, 1,    0.2, 1.0, 0.2,

    -1, -1, -1,   0, 0,-1,    1.0, 0.2, 0.2,
     1, -1, -1,   0, 0,-1,    1.0, 0.2, 0.2,
     1,  1, -1,   0, 0,-1,    1.0, 0.2, 0.2,
    -1,  1, -1,   0, 0,-1,    1.0, 0.2, 0.2,

    -1,  1, -1,   0, 1, 0,    0.2, 0.4, 1.0,
     1,  1, -1,   0, 1, 0,    0.2, 0.4, 1.0,
     1,  1,  1,   0, 1, 0,    0.2, 0.4, 1.0,
    -1,  1,  1,   0, 1, 0,    0.2, 0.4, 1.0,

    -1, -1, -1,   0,-1, 0,    1.0, 1.0, 0.2,
     1, -1, -1,   0,-1, 0,    1.0, 1.0, 0.2,
     1, -1,  1,   0,-1, 0,    1.0, 1.0, 0.2,
    -1, -1,  1,   0,-1, 0,    1.0, 1.0, 0.2,

     1, -1, -1,   1, 0, 0,    0.2, 1.0, 1.0,
     1,  1, -1,   1, 0, 0,    0.2, 1.0, 1.0,
     1,  1,  1,   1, 0, 0,    0.2, 1.0, 1.0,
     1, -1,  1,   1, 0, 0,    0.2, 1.0, 1.0,

    -1, -1, -1,  -1, 0, 0,    1.0, 0.2, 1.0,
    -1,  1, -1,  -1, 0, 0,    1.0, 0.2, 1.0,
    -1,  1,  1,  -1, 0, 0,    1.0, 0.2, 1.0,
    -1, -1,  1,  -1, 0, 0,    1.0, 0.2, 1.0,
  ]);

  const indices = new Uint16Array([
    0, 1, 2,   0, 2, 3,
    4, 5, 6,   4, 6, 7,
    8, 9,10,   8,10,11,
    12,13,14,  12,14,15,
    16,17,18,  16,18,19,
    20,21,22,  20,22,23
  ]);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const stride = (3 + 3 + 3) * 4;

  const posLoc = gl.getAttribLocation(program, "position");
  const normLoc = gl.getAttribLocation(program, "normal");
  const colLoc = gl.getAttribLocation(program, "color");

  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, stride, 0);

  gl.enableVertexAttribArray(normLoc);
  gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, stride, 3 * 4);

  gl.enableVertexAttribArray(colLoc);
  gl.vertexAttribPointer(colLoc, 3, gl.FLOAT, false, stride, 6 * 4);

  const projLoc = gl.getUniformLocation(program, "projectionMatrix");
  const modelLoc = gl.getUniformLocation(program, "modelViewMatrix");
  const lightDirLoc = gl.getUniformLocation(program, "lightDir");

  function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, (2 * far * near) * nf, 0
    ]);
  }

  function identity() {
    return new Float32Array([
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1
    ]);
  }

  function multiply(a, b) {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; ++i) {
      for (let j = 0; j < 4; ++j) {
        out[i*4 + j] =
          a[i*4 + 0] * b[0*4 + j] +
          a[i*4 + 1] * b[1*4 + j] +
          a[i*4 + 2] * b[2*4 + j] +
          a[i*4 + 3] * b[3*4 + j];
      }
    }
    return out;
  }

  function rotateX(m, a) {
    const c = Math.cos(a), s = Math.sin(a);
    const r = identity();
    r[5] = c; r[6] = -s;
    r[9] = s; r[10] = c;
    return multiply(m, r);
  }

  function rotateY(m, a) {
    const c = Math.cos(a), s = Math.sin(a);
    const r = identity();
    r[0] = c; r[2] = s;
    r[8] = -s; r[10] = c;
    return multiply(m, r);
  }

  function translate(m, x, y, z) {
    const t = identity();
    t[12] = x; t[13] = y; t[14] = z;
    return multiply(m, t);
  }

  function scale(m, s) {
    const sc = identity();
    sc[0] = s; sc[5] = s; sc[10] = s;
    return multiply(m, sc);
  }

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);

  const proj = perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(projLoc, false, proj);

  const lightDir = new Float32Array([0.6, 0.7, 0.5]);
  gl.uniform3fv(lightDirLoc, lightDir);

  let angleX = 0, angleY = 0;
  const speedX = (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? 1 : -1);
  const speedY = (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? 1 : -1);

  let windowClosed = false;
  let animId = null;

  function drawScene() {
    if (windowClosed) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    angleX += speedX;
    angleY += speedY;

    let model = identity();
    model = rotateX(model, angleX);
    model = rotateY(model, angleY);
    model = scale(model, 0.95);
    model = translate(model, 0, 0, -5.0);

    gl.uniformMatrix4fv(modelLoc, false, model);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    animId = requestAnimationFrame(drawScene);
  }

  drawScene();

  const closeBtn = content.closest(".window").querySelector(".close");
  closeBtn.addEventListener("click", () => {
    windowClosed = true;
    if (animId) cancelAnimationFrame(animId);
    cubeWindow = null;
  });

  cubeWindow = content.closest(".window");
}

console.log("cube.js loaded");
