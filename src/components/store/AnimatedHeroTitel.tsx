
"use client";

import { motion } from "framer-motion";

const words = [
  "كل",
  "ما",
  "تحتاجه",
  "لصحتك..",
  "بخطوات",
  "بسيطة",
  "لحد",
  "باب",
  "بيتك",
];

export function AnimatedHeroTitle() {
  return (
    <motion.h1
      className="mt-6 flex flex-wrap gap-x-3 gap-y-2 text-4xl leading-tight font-black sm:text-5xl"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.18,
          },
        },
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: {
              opacity: 0,
              y: 25,
              filter: "blur(6px)",
            },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: {
                duration: 0.6,
                ease: "easeOut",
              },
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}
