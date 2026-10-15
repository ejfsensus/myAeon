"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type Props = { ready: boolean; onComplete?: () => void };
export default function AeonPreloader({ ready, onComplete }: Props) {
  const reduceMotion = useReducedMotion();
  const [minElapsed, setMinElapsed] = useState(false);
  const [forceExit, setForceExit] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const minTimer = window.setTimeout(() => setMinElapsed(true), reduceMotion ? 150 : 1650);
    const maxTimer = window.setTimeout(() => setForceExit(true), 4200);
    return () => { window.clearTimeout(minTimer); window.clearTimeout(maxTimer); };
  }, [reduceMotion]);
  useEffect(() => { if ((ready && minElapsed) || forceExit) setVisible(false); }, [forceExit, minElapsed, ready]);
  return <AnimatePresence onExitComplete={onComplete}>{visible && <motion.div role="status" aria-label="Loading myAeon" className="aeon-preloader" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: reduceMotion ? 0.05 : 0.65 } }}>
    <motion.div className="aeon-preloader-mark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0.01 : 0.95, ease: 'easeInOut' }}>
      <Image className="aeon-preloader-wordmark" src="/brand/my-aeon-wordmark.png" alt="myAeon" width={1456} height={449} sizes="(max-width: 768px) 72vw, 28rem" priority />
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
