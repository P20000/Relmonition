"use client";

import React from 'react';
import { motion } from 'framer-motion';

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 bg-primary rounded-full"
            animate={{ 
              y: [0, -4, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: i * 0.15 
            }}
          />
        ))}
      </div>
      <motion.span 
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="text-xs font-medium text-muted-foreground"
      >
        Thinking...
      </motion.span>
    </div>
  );
}
