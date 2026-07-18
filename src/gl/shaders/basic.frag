#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uScrollPos;
uniform vec2 uClickPos;
uniform float uClickAge;

out vec4 fragColor;

const vec3 COLOR = vec3(0.1f);
#define SCROLL_FACTOR 0.3
#define FREQ 8.
#define LINE_WIDTH 8.

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return a + (b - a) * u.x + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float potential(vec2 p) {
  float t = uTime;
  return noise(p * 1.7 + vec2(t * 0.018, t * 0.013)) + 0.5 * noise(p * 3.3 - vec2(t * 0.024, t * 0.009));
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uResolution.xy) / uResolution.y;
  vec2 p = uv;

  p.y += uScrollPos * SCROLL_FACTOR; // parallax

  // cursor
  vec2 toMouse = p - uMouse;
  float distToMouse = length(toMouse);
  float mouseRadius = 0.4;
  float pull = smoothstep(mouseRadius, 0.0, distToMouse);
  pull *= pull;
  vec2 tangent = vec2(-toMouse.y, toMouse.x) / (distToMouse + 1e-4);
  p += tangent * pull * 0.09;

  // click
  vec2 toClick = p - uClickPos;
  float distToClick = length(toClick);
  float ripple = sin(distToClick * 18.0 - uClickAge * 9.0) * exp(-uClickAge * 1.6) * exp(-distToClick * 2.5);
  p += toClick / (distToClick + 1e-4) * ripple * 0.05;

  float phi = potential(p);

  float d = abs(fract(phi * FREQ) - 0.5);
  float thresh = min(LINE_WIDTH * FREQ * fwidth(phi) * 0.5, 0.3);
  float lines = 1.0 - smoothstep(0.0, thresh, d);

  float grain = (hash(gl_FragCoord.xy + uTime * 60.0) - 0.5) * 0.008;
  float alpha = clamp(lines + grain, 0.0, 1.0); // * 0.55; 0.4

  fragColor = vec4(COLOR, alpha);
}
