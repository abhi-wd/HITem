import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState, useRef } from "react";
import { useAccount, useConnect } from "wagmi";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

// Fruit icons
const fruits = ["🍎", "🍌", "🍒", "🍇"];

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-600 to-indigo-900 text-white p-4">
      <ConnectMenu />
    </div>
  );
}

function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();


  if (isConnected) {
    return (
      <div className="w-full flex flex-col items-center">
        <div className="mb-4 text-center">
          <div className="font-bold">✅ Connected</div>
          <div className="text-sm">{address}</div>
        </div>
        <WhackFruitGame />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => connect({ connector: connectors[0] })}
      className="px-6 py-3 rounded-2xl text-lg bg-yellow-400 text-black hover:bg-yellow-500"
    >
      Connect Wallet
    </button>
  );
}

function WhackFruitGame() {
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [bombsHit, setBombsHit] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const [grid, setGrid] = useState(Array(9).fill(null));
  const lastIndexRef = useRef<number | null>(null);

  // Confetti state
  const [confettiConfig, setConfettiConfig] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const { width: screenWidth, height: screenHeight } = useWindowSize();
  const width = screenWidth * 0.9;
  const height = screenHeight * 0.9;

  // Timer countdown
  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0 && bombsHit < 2) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameStarted && (timeLeft === 0 || bombsHit >= 2)) {
      setGameOver(true);
    }
  }, [timeLeft, bombsHit, gameStarted, gameOver]);

  // Spawn items on grid
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawn = () => {
      let idx: number;
      do {
        idx = Math.floor(Math.random() * 9);
      } while (idx === lastIndexRef.current); // avoid same spot twice
      lastIndexRef.current = idx;

      const rand = Math.random();
      let type = "fruit";
      if (rand < 0.2) type = "coin"; // 20%
      else if (rand < 0.5) type = "bomb"; // 30%

      setGrid((prev) => {
        const newGrid = [...prev];
        newGrid[idx] = {
          type,
          icon:
            type === "fruit"
              ? fruits[Math.floor(Math.random() * fruits.length)]
              : type === "coin"
                ? "🪙"
                : "💣",
        };
        return newGrid;
      });

      // Clear cell after short delay
      setTimeout(() => {
        setGrid((prev) => {
          const newGrid = [...prev];
          newGrid[idx] = null;
          return newGrid;
        });
      }, 900);
    };

    // spawn immediately
    spawn();

    // fixed spawn speed
    const spawnInterval = setInterval(spawn, 1200);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver]);

  // Handle click
  const handleCellClick = (cell: any, e: React.MouseEvent) => {
    if (!cell) return;
    if (cell.type === "coin") {
      setTokens((t) => t + 1);

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      setConfettiConfig({ x, y, active: true });
      setTimeout(() => setConfettiConfig({ x: 0, y: 0, active: false }), 3000);
    } else if (cell.type === "fruit") {
      setScore((s) => s + 1);
    } else if (cell.type === "bomb") {
      setBombsHit((b) => b + 1);
      document.body.classList.add("shake");
      setTimeout(() => document.body.classList.remove("shake"), 500);
    }
  };

  const handleStart = () => {
    setGameStarted(true);
    setTimeLeft(30);
    setScore(0);
    setTokens(0);
    setBombsHit(0);
    setGameOver(false);
    setGrid(Array(9).fill(null)); // clear grid
  };

  const handleClaimReward = () => {
    alert(`Reward claimed! Sending ${tokens} ARB tokens to your Farcaster wallet...`);
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-600 to-indigo-900 text-white p-4"
      style={{ cursor: `url('https://cdn-icons-png.flaticon.com/512/1622/1622060.png') 32 32, auto` }}
    >
      {confettiConfig.active && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={100}
          recycle={false}
          gravity={0.4}
          confettiSource={{ x: confettiConfig.x, y: confettiConfig.y, w: 10, h: 10 }}
        />
      )}

      {!gameStarted ? (
        <button
          onClick={handleStart}
          className="px-8 py-4 bg-yellow-400 text-black font-bold rounded-2xl text-xl hover:bg-yellow-500"
        >
          Start Game 🎮
        </button>
      ) : !gameOver ? (
        <>
          {/* Top Bar */}
          <div className="w-full flex justify-between items-center max-w-md mb-6">
            <div className="text-lg font-bold">🪙 {tokens}</div>
            <div className="text-lg font-bold">Score: {score}</div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {grid.map((cell, i) => (
              <motion.div
                key={i}
                className="w-24 h-24 flex items-center justify-center rounded-2xl bg-white text-black shadow-lg cursor-pointer text-4xl"
                whileTap={{ scale: 0.85 }}
                onClick={(e) => handleCellClick(cell, e)}
              >
                {cell ? cell.icon : ""}
              </motion.div>
            ))}
          </div>

          {/* Timer Bar */}
          <div className="w-full max-w-md h-4 bg-gray-800 rounded-2xl overflow-hidden">
            <motion.div
              className="h-full bg-green-400"
              initial={{ width: "100%" }}
              animate={{
                width: `${(timeLeft / 30) * 100}%`,
                backgroundColor: timeLeft < 7 ? "#ef4444" : "#22c55e",
              }}
              transition={{ ease: "linear", duration: 1 }}
            />
          </div>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4">Game Over 🎮</h2>
          <p className="mb-2">Final Score: {score}</p>
          <p className="mb-6">Collected Coins: 🪙 {tokens}</p>

          <div className="flex gap-4">
            <button
              onClick={handleClaimReward}
              className="px-6 py-3 rounded-2xl text-lg bg-yellow-400 text-black hover:bg-yellow-500"
            >
              Claim Reward 🎁
            </button>
            <button
              onClick={handleStart}
              className="px-6 py-3 rounded-2xl text-lg bg-blue-400 text-black hover:bg-blue-500"
            >
              Replay 🔄
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
