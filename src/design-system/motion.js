/**
 * PRATIKSHYA FASHON — Atelier Motion
 *
 * The motion language is deliberately quiet: content fades up once as it
 * enters the viewport, imagery breathes on hover, colour changes are instant
 * but eased. Nothing loops, nothing bounces.
 *
 * Every helper here respects `prefers-reduced-motion`.
 */

import { useReducedMotion } from "framer-motion";

/** Durations, in seconds, used by Framer Motion. */
export const duration = {
  reveal: 0.6,
  hero: 1.2,
};

/** Durations, as Tailwind classes, used by CSS transitions. */
export const durationClass = {
  crossfade: "duration-500",
  image: "duration-700",
};

/** Distance (px) an element travels while fading up. */
export const distance = {
  short: 20,
  medium: 25,
  long: 30,
};

/* ------------------------------------------------------------------ */
/* Framer Motion presets                                               */
/* ------------------------------------------------------------------ */

/** Scroll reveal — fade up once, on enter. */
export const fadeUp = (travel = distance.short, seconds = duration.reveal) => ({
  initial: { opacity: 0, y: travel },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: seconds },
});

/** Entrance reveal — plays immediately on mount (hero). */
export const enter = (travel = distance.long, seconds = duration.hero) => ({
  initial: { opacity: 0, y: travel },
  animate: { opacity: 1, y: 0 },
  transition: { duration: seconds },
});

const staticReveal = {
  initial: { opacity: 1, y: 0 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0 },
};

const staticEnter = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0 },
};

/**
 * Scroll-reveal props for a `motion` element, disabled when the visitor has
 * asked for reduced motion.
 */
export function useReveal(travel = distance.short, seconds = duration.reveal) {
  const shouldReduceMotion = useReducedMotion();
  return shouldReduceMotion ? staticReveal : fadeUp(travel, seconds);
}

/**
 * Mount-entrance props for a `motion` element, disabled when the visitor has
 * asked for reduced motion.
 */
export function useEnter(travel = distance.long, seconds = duration.hero) {
  const shouldReduceMotion = useReducedMotion();
  return shouldReduceMotion ? staticEnter : enter(travel, seconds);
}

/* ------------------------------------------------------------------ */
/* CSS transition presets                                              */
/* ------------------------------------------------------------------ */

export const transition = {
  /** Links and text colour changes. */
  colors: "transition-colors",
  /** Buttons and chips (background, colour and border together). */
  all: "transition-all",
  /** Hover image crossfade. */
  crossfade: "transition-opacity duration-500",
  /** Image scale. */
  image: "transition-transform duration-700",
};

/** Hover zoom applied to imagery inside a `group`. */
export const zoom = {
  /** Wide and editorial imagery. */
  soft: "transition-transform duration-700 group-hover:scale-[1.04]",
  /** Portrait tiles and product imagery. */
  strong: "transition-transform duration-700 group-hover:scale-[1.05]",
};

export const motionTokens = {
  duration,
  durationClass,
  distance,
  fadeUp,
  enter,
  transition,
  zoom,
};

export default motionTokens;
