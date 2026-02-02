"use client";

import Image from "next/image";
import { motion } from "framer-motion";
// import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { WelcomeData } from "@/data/welcome";
import TextType from "../shared/text-type";

export function WelcomeSlide({
  title,
  description,
  image,
  details,
}: WelcomeData) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 max-md:p-4 max-sm:p-2 text-center select-none">
      {/* <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="relative w-full h-[200px] max-w-md aspect-square mb-2"
      >
        <Image
          src={image}
          alt={title}
          fill
          className="object-contain"
          priority
        />
      </motion.div> */}

      <motion.div
        className="max-w-2xl w-full space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl max-md:text-3xl max-sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg max-md:text-md text-muted-foreground"
        >
          {description}
        </motion.p>

        {details && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            {/* <ContainerTextFlip  
            words={details}
            size = "sm"
            textClassName="text-base weight-100 max-md:text-[1rem]"
             /> */}
            <TextType
              text={details}
              typingSpeed={75}
              pauseDuration={1500}
              showCursor={true}
              className="text-base weight-100 text-black dark:text-white max-md:text-[1rem]"
              cursorCharacter="_"
              textColors={["blue", "green", "red", "gold", "magenta"]}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
