import { motion } from 'framer-motion';

export default function Waveform() {
  return (
    <div className="grid gap-2">
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          animate={{ scaleY: [0.7, 1.4, 0.8] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.08 }}
          className="h-3 rounded-full bg-text"
          style={{ width: `${10 + index * 8}%` }}
        />
      ))}
    </div>
  );
}
