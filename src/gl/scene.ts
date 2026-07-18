import { Renderer, Program, Mesh, Triangle } from "ogl";

import vertex from "./shaders/basic.vert";
import fragment from "./shaders/basic.frag";

export function initScene(canvas: HTMLCanvasElement) {
  const renderer = new Renderer({
    canvas,
    alpha: true,
    dpr: Math.min(window.devicePixelRatio, 2),
    webgl: 2,
  });
  const gl = renderer.gl;

  const geometry = new Triangle(gl);

  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: [gl.canvas.width, gl.canvas.height] },
      uMouse: { value: [999, 999] },
      uScrollPos: { value: 0 },
      uClickPos: { value: [0, 0] },
      uClickAge: { value: 999 },
    },
  });

  const mesh = new Mesh(gl, { geometry, program });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    onScroll();
    if (reduceMotion) renderer.render({ scene: mesh }); // loop is dead, so resize must repaint itself
  }
  window.addEventListener("resize", resize);

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const mouseTarget = { x: 999, y: 999 };
  const mouseEased = { x: 999, y: 999 };

  function toShaderSpace(clientX: number, clientY: number) {
    const dpr = renderer.dpr;
    const x = (2 * clientX * dpr - gl.canvas.width) / gl.canvas.height;
    const y = -(2 * clientY * dpr - gl.canvas.height) / gl.canvas.height;
    return { x, y };
  }

  function onPointerMove(e: PointerEvent) {
    const p = toShaderSpace(e.clientX, e.clientY);
    mouseTarget.x = p.x;
    mouseTarget.y = p.y;
  }
  window.addEventListener("pointermove", onPointerMove);

  let clickPos = { x: 0, y: 0 };
  let clickTime = -9999;

  function onPointerDown(e: PointerEvent) {
    clickPos = toShaderSpace(e.clientX, e.clientY);
    clickTime = performance.now();
  }
  window.addEventListener("pointerdown", onPointerDown);

  let scrollTarget = 0;
  const scrollSpring = { pos: 0, vel: 0 };
  const SCROLL_STIFFNESS = 40;
  const SCROLL_DAMPING = 14;

  function onScroll() {
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1,
    );
    scrollTarget = (window.scrollY / maxScroll) * 2 - 1;
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  resize();
  onScroll();

  let rafId = 0;
  let last = 0;

  function update(t: number) {
    const dt = last === 0 ? 0 : Math.min((t - last) / 1000, 1 / 30);
    last = t;

    if (!reduceMotion && dt > 0) {
      const timeSec = t * 0.001;

      const smoothing = 1 - Math.exp(-dt * 10);
      mouseEased.x += (mouseTarget.x - mouseEased.x) * smoothing;
      mouseEased.y += (mouseTarget.y - mouseEased.y) * smoothing;

      const sAcc =
        (scrollTarget - scrollSpring.pos) * SCROLL_STIFFNESS -
        scrollSpring.vel * SCROLL_DAMPING;
      scrollSpring.vel += sAcc * dt;
      scrollSpring.pos += scrollSpring.vel * dt;

      program.uniforms.uTime.value = timeSec;
      program.uniforms.uMouse.value = [mouseEased.x, mouseEased.y];
      program.uniforms.uScrollPos.value = scrollSpring.pos;
      program.uniforms.uClickPos.value = [clickPos.x, clickPos.y];
      program.uniforms.uClickAge.value = (performance.now() - clickTime) / 1000;
    }

    renderer.render({ scene: mesh });

    if (reduceMotion) return;
    rafId = requestAnimationFrame(update);
  }
  rafId = requestAnimationFrame(update);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("scroll", onScroll);
  };
}
