import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import RubiksCube from '@/components/RubiksCube';
import { ExperienceCard } from '@/components/ExperienceCard';
import { experiences } from '@/data/experiences';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Briefcase, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCubeSolver } from '@/hooks/useCubeSolver';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Portfolio() {
  const [step, setStep] = useState(0);

  // Initialize cube solver
  const { solutionMoves, isInitialized } = useCubeSolver(experiences.length - 1);

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, experiences.length - 1));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const currentExp = experiences[step];

  return (
    <div className="flex flex-col md:flex-row w-full h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-primary-foreground">

      {/* 3D Scene Panel */}
      <div className="w-full h-[40vh] md:w-[30%] md:h-full relative bg-muted/10">
        <Canvas camera={{ position: [4, 4, 4], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color={currentExp.color} />

          <Suspense fallback={null}>
            {isInitialized && (
              <RubiksCube
                step={step}
                experiences={experiences}
                solutionMoves={solutionMoves}
              />
            )}
            <Environment preset="city" />
            <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={20} blur={2.5} far={4.5} />
          </Suspense>

          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      {/* Content Panel */}
      <div className="w-full h-[60vh] md:w-[70%] md:h-full relative flex flex-col bg-background/50 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-border/50 shadow-2xl z-10">

        {/* Header */}
        <header className="flex justify-between items-start p-6 md:p-8 pb-0">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              Murali Krishtna J
            </h1>
            <p className="text-muted-foreground font-mono text-xs mt-1">
              Software Development Engineer
            </p>
          </div>
          <div className="flex gap-4">
            {/* Mobile Resume Button */}
            <Button variant="ghost" size="icon" className="md:hidden rounded-full" asChild data-testid="button-resume-mobile">
              <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                <Briefcase className="w-5 h-5" />
              </a>
            </Button>

            <div className="hidden md:flex gap-4">
              <Button variant="outline" size="sm" className="gap-2" asChild data-testid="button-resume">
                <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                  <Briefcase className="w-4 h-4" /> Resume
                </a>
              </Button>
              <Button variant="outline" size="sm" className="gap-2" asChild data-testid="button-linkedin">
                <a href="https://www.linkedin.com/in/murali-krishtna/" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </a>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <ScrollArea className="flex-1 px-6 md:px-8 py-6">
          <AnimatePresence mode="wait">
            <ExperienceCard
              experience={currentExp}
              currentIndex={step}
              totalCount={experiences.length}
            />
          </AnimatePresence>
        </ScrollArea>

        {/* Navigation Footer */}
        <footer className="p-6 md:p-8 pt-0 mt-auto pb-20 md:pb-8">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground hidden md:block max-w-xs">
                Use arrow keys or buttons to explore.
              </div>

              <div className="flex gap-4 items-center ml-auto">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={prevStep}
                  data-testid="button-prev"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>

                <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((step + 1) / experiences.length) * 100}%` }}
                    style={{ backgroundColor: currentExp.color }}
                    data-testid="progress-bar"
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={nextStep}
                  data-testid="button-next"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Keyboard Listener */}
      <KeyboardListener onNext={nextStep} onPrev={prevStep} />
    </div>
  );
}

function KeyboardListener({ onNext, onPrev }: { onNext: () => void, onPrev: () => void }) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev]);
  return null;
}
