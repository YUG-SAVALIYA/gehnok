import Lenis from 'lenis';

export const lenis = new Lenis({
  autoRaf: true,
  lerp: 0.08, // Adjust for smoothness vs responsiveness
  smoothWheel: true,
});
