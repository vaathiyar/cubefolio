import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Cube from 'cubejs';
import { Experience } from '../data/experiences';

interface RubiksCubeProps {
  step: number;
  experiences: Experience[];
  solutionMoves: string[];
}

const FACE_COLORS: Record<string, string> = {
  U: '#FFFFFF',
  R: '#B90000',
  F: '#009E60',
  D: '#FFD500',
  L: '#FF5900',
  B: '#0045AD',
};

const Cubie = React.forwardRef(({
  position,
  faceColors,
}: {
  position: [number, number, number],
  faceColors: string[],
}, ref: any) => {
  return (
    <group position={position} ref={ref}>
      <mesh>
        <boxGeometry args={[0.96, 0.96, 0.96, 3, 3, 3]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      <mesh position={[0.481, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={faceColors[0]} />
      </mesh>
      <mesh position={[-0.481, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={faceColors[1]} />
      </mesh>
      <mesh position={[0, 0.481, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={faceColors[2]} />
      </mesh>
      <mesh position={[0, -0.481, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={faceColors[3]} />
      </mesh>
      <mesh position={[0, 0, 0.481]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={faceColors[4]} />
      </mesh>
      <mesh position={[0, 0, -0.481]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshStandardMaterial color={faceColors[5]} />
      </mesh>
    </group>
  );
});

export default function RubiksCube({ step, experiences, solutionMoves }: RubiksCubeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cubieRefs = useRef<(THREE.Group | null)[]>([]);

  // Logical Cube State (for tracking moves)
  const logicalCube = useRef<any>(new Cube());

  // Generate initial solved cube positions and colors
  const initialPositions = useMemo(() => {
    const pos = [];
    const cols = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          pos.push([x, y, z]);
          const c = Array(6).fill('#111');
          if (x === 1) c[0] = FACE_COLORS.R;
          if (x === -1) c[1] = FACE_COLORS.L;
          if (y === 1) c[2] = FACE_COLORS.U;
          if (y === -1) c[3] = FACE_COLORS.D;
          if (z === 1) c[4] = FACE_COLORS.F;
          if (z === -1) c[5] = FACE_COLORS.B;
          cols.push(c);
        }
      }
    }
    return { pos, cols };
  }, []);

  // Animation queue system
  const animationQueue = useRef<Array<{ from: number; to: number; moves?: string[] }>>([]);
  const isProcessingQueue = useRef(false);
  const currentAnimatedStep = useRef(0);
  const isInitialized = useRef(false);
  const lastQueuedStep = useRef(0);
  const abortProcessing = useRef(false);
  const pendingStepRef = useRef<number | null>(null);

  // Special Animation States
  const [animationState, setAnimationState] = useState<'idle' | 'waiting' | 'vibrating' | 'shuffling' | 'jump'>('idle');
  const [isSolving, setIsSolving] = useState(false);

  const vibrationStartTime = useRef(0);
  const jumpStartTime = useRef(0);
  const isJumpingRef = useRef(false); // Ref to track jump state across effects
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const vibrateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const jumpTimerRef = useRef<NodeJS.Timeout | null>(null);

  const VIBRATION_DURATION = 1500;
  const SOLVED_WAIT = 750;
  // CRITICAL: JUMP_DURATION (600ms) > Max Move Duration (avg 300ms, max 500ms).
  // This ensures that if we abort the queue, the current move has enough time to finish naturally
  // before the jump ends and resetToStep() is called.
  // If you reduce this, you MUST add an explicit wait/sleep before calling resetToStep()
  // otherwise resetToStep() will crash visibly (broken cube) if called mid-rotation.
  const JUMP_DURATION = 600; // ms

  const invertMove = useCallback((move: string) => {
    if (move.includes("'")) return move.replace("'", "");
    if (move.includes("2")) return move;
    return move + "'";
  }, []);

  const rotateSlice = useCallback(async (
    axis: 'x' | 'y' | 'z',
    index: number,
    direction: number,
    duration: number
  ) => {
    if (!groupRef.current) return;

    const pivot = new THREE.Object3D();
    pivot.rotation.set(0, 0, 0);
    groupRef.current.add(pivot);

    const activeCubies: THREE.Group[] = [];

    cubieRefs.current.forEach(cubie => {
      if (!cubie) return;
      const pos = cubie.position[axis];
      if (Math.abs(pos - index) < 0.1) {
        activeCubies.push(cubie);
        pivot.attach(cubie);
      }
    });

    if (duration === 0) {
      pivot.rotation[axis] += direction * Math.PI / 2;
      pivot.updateMatrixWorld();
      activeCubies.forEach(c => {
        groupRef.current?.attach(c);
        c.position.x = Math.round(c.position.x);
        c.position.y = Math.round(c.position.y);
        c.position.z = Math.round(c.position.z);
        c.rotation.x = Math.round(c.rotation.x / (Math.PI / 2)) * (Math.PI / 2);
        c.rotation.y = Math.round(c.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
        c.rotation.z = Math.round(c.rotation.z / (Math.PI / 2)) * (Math.PI / 2);
        c.updateMatrixWorld();
      });
      groupRef.current?.remove(pivot);
      return;
    }

    const startRot = pivot.rotation[axis];
    const targetRot = startRot + (direction * Math.PI / 2);
    const startTime = performance.now();

    return new Promise<void>(resolve => {
      const animate = (time: number) => {
        const elapsed = (time - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        pivot.rotation[axis] = startRot + (targetRot - startRot) * ease;

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          pivot.rotation[axis] = targetRot;
          pivot.updateMatrixWorld();
          activeCubies.forEach(c => {
            groupRef.current?.attach(c);
            c.position.x = Math.round(c.position.x);
            c.position.y = Math.round(c.position.y);
            c.position.z = Math.round(c.position.z);
            c.rotation.x = Math.round(c.rotation.x / (Math.PI / 2)) * (Math.PI / 2);
            c.rotation.y = Math.round(c.rotation.y / (Math.PI / 2)) * (Math.PI / 2);
            c.rotation.z = Math.round(c.rotation.z / (Math.PI / 2)) * (Math.PI / 2);
            c.updateMatrixWorld();
          });
          groupRef.current?.remove(pivot);
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }, []);

  const applyMove = useCallback(async (move: string, duration: number = 0.3) => {
    // Update Logical Cube State
    logicalCube.current.move(move);

    const face = move[0];
    const isPrime = move.includes("'");
    const isDouble = move.includes("2");

    let axis: 'x' | 'y' | 'z' = 'y';
    let sliceIndex = 0;
    let direction = 1;

    switch (face) {
      case 'R': axis = 'x'; sliceIndex = 1; direction = -1; break;
      case 'L': axis = 'x'; sliceIndex = -1; direction = 1; break;
      case 'U': axis = 'y'; sliceIndex = 1; direction = -1; break;
      case 'D': axis = 'y'; sliceIndex = -1; direction = 1; break;
      case 'F': axis = 'z'; sliceIndex = 1; direction = -1; break;
      case 'B': axis = 'z'; sliceIndex = -1; direction = 1; break;
    }

    if (isPrime) direction *= -1;
    if (isDouble) {
      await rotateSlice(axis, sliceIndex, direction, duration);
      await rotateSlice(axis, sliceIndex, direction, duration);
    } else {
      await rotateSlice(axis, sliceIndex, direction, duration);
    }
  }, [rotateSlice]);

  // Helper to get moves required to reach a specific step from solved state
  // Pre-calculate move checkpoints for each step
  const moveCheckpoints = useMemo(() => {
    if (solutionMoves.length === 0) return [];

    const totalMoves = solutionMoves.length;
    const numExperiences = experiences.length;
    const checkpoints = new Array(numExperiences).fill(0);

    // Step 0: Start (0 moves)
    checkpoints[0] = 0;

    // Step N-1: WIP (All moves)
    checkpoints[numExperiences - 1] = totalMoves;

    // Step N-2: Pre-WIP (Total - 3 moves)
    // Ensure we don't go negative if totalMoves is very small
    const preWipMoves = Math.max(0, totalMoves - 3);
    if (numExperiences > 1) {
      checkpoints[numExperiences - 2] = preWipMoves;
    }

    // Intermediate Steps: Distribute remaining moves evenly
    // We need to distribute 'preWipMoves' across steps 1 to N-2
    // The range is from index 0 (0 moves) to index N-2 (preWipMoves)
    // We need to fill indices 1 to N-3
    const numIntermediateSteps = numExperiences - 2; // Total steps excluding Start and WIP

    if (numIntermediateSteps > 1) {
      // We have steps between Start and Pre-WIP
      // Total moves to distribute: preWipMoves
      // Number of intervals: numIntermediateSteps
      const movesPerInterval = preWipMoves / numIntermediateSteps;

      for (let i = 1; i < numExperiences - 2; i++) {
        checkpoints[i] = Math.round(i * movesPerInterval);
      }
    }

    console.log('Cube Move Checkpoints:', checkpoints);
    return checkpoints;
  }, [solutionMoves, experiences.length]);

  // Helper to get moves required to reach a specific step from solved state
  const getMovesToReachStep = useCallback((targetStep: number) => {
    if (solutionMoves.length === 0 || targetStep >= moveCheckpoints.length) return [];
    const movesCount = moveCheckpoints[targetStep];
    return solutionMoves.slice(0, movesCount);
  }, [solutionMoves, moveCheckpoints]);

  // Reset cube to a specific step's state
  const resetToStep = useCallback(async (targetStep: number) => {
    if (!groupRef.current) return;

    // 1. Reset logical cube to solved state
    logicalCube.current = new Cube(); // Solved

    // 2. Reset visual rotation of group
    groupRef.current.rotation.set(0, 0, 0);

    // 3. Reset colors to initial state (Fix for Chase effect)
    cubieRefs.current.forEach((cubie, i) => {
      if (!cubie) return;
      const initialCols = initialPositions.cols[i];
      // Children 1-6 are the faces
      for (let j = 0; j < 6; j++) {
        const faceMesh = cubie.children[j + 1] as THREE.Mesh;
        if (faceMesh && faceMesh.material) {
          (faceMesh.material as THREE.MeshStandardMaterial).color.set(initialCols[j]);
        }
      }
    });

    const movesForStep = getMovesToReachStep(targetStep);
    const reverseSolution = [...solutionMoves].reverse().map(invertMove);

    // Reset Cubies to Initial State
    cubieRefs.current.forEach((cubie, i) => {
      if (!cubie) return;
      const pos = initialPositions.pos[i];
      cubie.position.set(pos[0], pos[1], pos[2]);
      cubie.rotation.set(0, 0, 0);
      cubie.updateMatrixWorld();
    });

    // Apply reverse solution (Instant)
    for (const move of reverseSolution) {
      await applyMove(move, 0);
    }

    // Apply moves for step (Instant)
    for (const move of movesForStep) {
      await applyMove(move, 0);
    }

    // Sync logical cube
    for (const move of reverseSolution) {
      logicalCube.current.move(move);
    }
    for (const move of movesForStep) {
      logicalCube.current.move(move);
    }

  }, [solutionMoves, applyMove, invertMove, getMovesToReachStep, initialPositions]);

  // Get moves for a specific transition
  const getMovesForTransition = useCallback((fromStep: number, toStep: number): { moves: string[], duration: number } => {
    if (solutionMoves.length === 0) return { moves: [], duration: 0.3 };

    // Reset case: last step -> first step
    if (fromStep === experiences.length - 1 && toStep === 0) {
      const reverseMoves = [...solutionMoves].reverse().map(invertMove);
      return { moves: reverseMoves, duration: 0.02 }; // Very fast for reset
    }

    const fromMovesCount = moveCheckpoints[fromStep] || 0;
    const toMovesCount = moveCheckpoints[toStep] || 0;

    // Forward case
    if (toStep > fromStep) {
      // Check if this is the final transition (to WIP)
      if (toStep === experiences.length - 1) {
        // Use a slightly faster duration for the final 3 moves
        return { moves: solutionMoves.slice(fromMovesCount, toMovesCount), duration: 0.25 };
      }
      return { moves: solutionMoves.slice(fromMovesCount, toMovesCount), duration: 0.25 };
    }

    // Backward case
    if (toStep < fromStep) {
      const movesToPlay = solutionMoves.slice(toMovesCount, fromMovesCount);
      const reverseMoves = [...movesToPlay].reverse().map(invertMove);
      return { moves: reverseMoves, duration: 0.25 };
    }

    return { moves: [], duration: 0.3 };
  }, [solutionMoves, experiences.length, invertMove, moveCheckpoints]);

  // Process the animation queue
  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current || animationQueue.current.length === 0) return;

    isProcessingQueue.current = true;
    setIsSolving(true);
    abortProcessing.current = false;

    while (animationQueue.current.length > 0) {
      if (abortProcessing.current) break;
      const transition = animationQueue.current.shift();
      if (!transition) break;

      // Check if explicit moves are provided (for dynamic solving)
      let moves: string[] = [];
      let duration = 0.3;

      if (transition.moves) {
        moves = transition.moves;
        duration = 0.25;
      } else {
        const result = getMovesForTransition(transition.from, transition.to);
        moves = result.moves;
        duration = result.duration;
      }

      for (const move of moves) {
        if (abortProcessing.current) break;
        await applyMove(move, duration);
      }

      currentAnimatedStep.current = transition.to;
    }

    isProcessingQueue.current = false;
    setIsSolving(false);
  }, [getMovesForTransition, applyMove]);

  // Initialize cube to scrambled state
  useEffect(() => {
    if (solutionMoves.length === 0 || isInitialized.current) return;
    if (cubieRefs.current.filter(c => c !== null).length < 27) {
      const timeout = setTimeout(() => {
        isInitialized.current = false; // Allow retry
      }, 100);
      return () => clearTimeout(timeout);
    }

    const initCube = async () => {
      isInitialized.current = true;

      // Reset logical cube
      logicalCube.current = new Cube();

      const reverseMoves = [...solutionMoves].reverse().map(invertMove);
      for (const move of reverseMoves) {
        await applyMove(move, 0);
      }
      currentAnimatedStep.current = 0;
      lastQueuedStep.current = 0;
    };

    initCube();
  }, [solutionMoves, applyMove, invertMove]);

  // Handle Step Change Logic
  const handleStepChange = useCallback((targetStep: number) => {
    const lastQueued = lastQueuedStep.current;
    if (targetStep === lastQueued) return;

    // SPECIAL CASE: Backward from WIP (Last Step) -> Previous Step
    if (lastQueued === experiences.length - 1 && targetStep === experiences.length - 2) {
      // Abort any ongoing solving
      abortProcessing.current = true;
      // Clear queue
      animationQueue.current = [];

      // Trigger Jump Animation
      setAnimationState('jump');
      isJumpingRef.current = true; // Mark as jumping
      jumpStartTime.current = performance.now();

      // Schedule the actual reset at the end of the jump
      if (jumpTimerRef.current) clearTimeout(jumpTimerRef.current);
      jumpTimerRef.current = setTimeout(async () => {
        await resetToStep(targetStep);
        setAnimationState('idle');
        isJumpingRef.current = false; // Reset jump flag
        if (groupRef.current) {
          groupRef.current.position.y = 0; // Ensure it lands exactly on 0
        }
        lastQueuedStep.current = targetStep;
        currentAnimatedStep.current = targetStep;

        // Process any pending steps that occurred during the jump
        if (pendingStepRef.current !== null) {
          const nextStep = pendingStepRef.current;
          pendingStepRef.current = null;
          // Recursively handle the next step
          handleStepChange(nextStep);
        }
      }, JUMP_DURATION);

      return;
    }

    // DECISION: Dynamic Solving for Final Step
    if (targetStep === experiences.length - 1 && lastQueued !== targetStep - 1) {
      // Clear any pending transitions as we are forcing a solve from CURRENT state
      animationQueue.current = [];
      abortProcessing.current = false;

      // Calculate moves to solve from CURRENT state
      const solveMovesString = logicalCube.current.solve();
      const solveMoves = solveMovesString.split(' ').filter((m: string) => m.trim() !== '');

      // Push a special transition with explicit moves
      animationQueue.current.push({
        from: lastQueued,
        to: targetStep,
        moves: solveMoves
      });

      lastQueuedStep.current = targetStep;
      processQueue();
      return;
    }

    // Normal Path Logic
    const totalSteps = experiences.length;
    let currentQueueStep = lastQueued;
    abortProcessing.current = false;

    // Handle wrap-around
    if (targetStep > lastQueued) {
      for (let s = lastQueued + 1; s <= targetStep; s++) {
        animationQueue.current.push({ from: currentQueueStep, to: s });
        currentQueueStep = s;
      }
    } else if (targetStep < lastQueued) {
      if (lastQueued === totalSteps - 1 && targetStep === 0) {
        animationQueue.current.push({ from: lastQueued, to: 0 });
      } else {
        for (let s = lastQueued - 1; s >= targetStep; s--) {
          animationQueue.current.push({ from: currentQueueStep, to: s });
          currentQueueStep = s;
        }
      }
    }

    lastQueuedStep.current = targetStep;
    processQueue();
  }, [experiences.length, processQueue, resetToStep, JUMP_DURATION]);

  // Queue transitions when step changes
  useEffect(() => {
    if (!isInitialized.current || solutionMoves.length === 0) return;

    if (isJumpingRef.current) {
      // If we are currently jumping, queue this step to be processed after landing
      pendingStepRef.current = step;
      return;
    }

    handleStepChange(step);
  }, [step, isInitialized, solutionMoves, handleStepChange]);

  // Handle Final Step Animation Sequence
  useEffect(() => {
    // Clear any existing timers when effect re-runs
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    if (vibrateTimerRef.current) clearTimeout(vibrateTimerRef.current);

    if (step === experiences.length - 1) {
      // Only start sequence if we are NOT currently solving/moving
      if (!isSolving) {
        setAnimationState('waiting');

        waitTimerRef.current = setTimeout(() => {
          setAnimationState('vibrating');
          vibrationStartTime.current = performance.now();

          vibrateTimerRef.current = setTimeout(() => {
            setAnimationState('shuffling');
          }, VIBRATION_DURATION);
        }, SOLVED_WAIT);
      } else {
        // If solving, ensure we are in idle/solving state until done
        setAnimationState('idle');
      }
    } else {
      // Not on final step, reset everything UNLESS we are in jump mode
      // Use ref to check if we are jumping, as state might be stale in this render cycle
      if (animationState !== 'jump' && !isJumpingRef.current) {
        setAnimationState('idle');
        if (groupRef.current) {
          groupRef.current.rotation.set(0, 0, 0);
          groupRef.current.position.y = 0;
        }
      }
    }

    return () => {
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      if (vibrateTimerRef.current) clearTimeout(vibrateTimerRef.current);
    };
  }, [step, isSolving, experiences.length]);

  // Handle Vibration and Shuffling
  useFrame((state) => {
    if (!groupRef.current) return;

    // Vibration Logic
    if (animationState === 'vibrating') {
      const elapsed = performance.now() - vibrationStartTime.current;
      const progress = Math.min(elapsed / VIBRATION_DURATION, 1);

      // Intensity increases linearly from 0.02 to 0.15
      const intensity = 0.02 + (progress * 0.13);

      groupRef.current.rotation.x = (Math.random() - 0.5) * intensity;
      groupRef.current.rotation.y = (Math.random() - 0.5) * intensity;
      groupRef.current.rotation.z = (Math.random() - 0.5) * intensity;
    }
    // Jump Logic
    else if (animationState === 'jump') {
      const elapsed = performance.now() - jumpStartTime.current;
      const progress = Math.min(elapsed / JUMP_DURATION, 1);

      // Parabolic jump: y = 4 * height * (x - x^2)
      // Peak at progress = 0.5
      const jumpHeight = 0.175;
      const y = 4 * jumpHeight * (progress - Math.pow(progress, 2));

      groupRef.current.position.y = Math.max(0, y);
    }
    // Reset rotation if not vibrating/jumping
    else if (animationState !== 'shuffling') {
      if (Math.abs(groupRef.current.rotation.x) > 0.01) groupRef.current.rotation.x *= 0.9;
      if (Math.abs(groupRef.current.rotation.y) > 0.01) groupRef.current.rotation.y *= 0.9;
      if (Math.abs(groupRef.current.rotation.z) > 0.01) groupRef.current.rotation.z *= 0.9;
      // Ensure position is reset
      if (Math.abs(groupRef.current.position.y) > 0.01) groupRef.current.position.y *= 0.9;
    }

    // Shuffling Logic
    if (animationState === 'shuffling' && !isProcessingQueue.current) {
      // Add a random move
      const moves = ['U', 'D', 'L', 'R', 'F', 'B'];
      const modifiers = ['', "'", '2'];
      const randomMove = moves[Math.floor(Math.random() * moves.length)] + modifiers[Math.floor(Math.random() * modifiers.length)];

      // We execute it directly via applyMove to avoid queue complexity for infinite shuffle
      isProcessingQueue.current = true;
      applyMove(randomMove, 0.3).then(() => {
        isProcessingQueue.current = false;
        // Check if we have pending tasks (e.g. user navigated away)
        if (animationQueue.current.length > 0) {
          processQueue();
        }
      });
    }
  });

  return (
    <group ref={groupRef} scale={0.55}>
      {initialPositions.pos.map((pos, i) => (
        <Cubie
          key={i}
          ref={(el: THREE.Group) => { cubieRefs.current[i] = el; }}
          position={pos as [number, number, number]}
          faceColors={initialPositions.cols[i]}
        />
      ))}
    </group>
  );
}
