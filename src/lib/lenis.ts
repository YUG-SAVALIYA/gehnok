import Lenis from 'lenis';

export const lenis = new Lenis({
  autoRaf: true,
  lerp: 0.04, // Slower for smoother feel
  duration: 1.5,
  smoothWheel: true,
});
