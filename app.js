import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Rect, Circle } from 'react-native-svg';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const { width } = Dimensions.get('window');
const CELL_SIZE = Math.floor((width - 40) / GRID_SIZE);
const BOARD_SIZE = CELL_SIZE * GRID_SIZE;

export default function App() {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const directionRef = useRef(direction);
  const nextDirectionRef = useRef(direction);

  useEffect(() => {
    loadHighScore();
  }, []);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      moveSnake();
    }, INITIAL_SPEED);

    return () => clearInterval(interval);
  }, [isPlaying, snake, food]);

  const loadHighScore = async () => {
    try {
      const saved = await AsyncStorage.getItem('snakeHighScore');
      if (saved) setHighScore(parseInt(saved));
    } catch (error) {
      console.log('Error loading high score');
    }
  };

  const saveHighScore = async (newScore) => {
    try {
      await AsyncStorage.setItem('snakeHighScore', newScore.toString());
    } catch (error) {
      console.log('Error saving high score');
    }
  };

  const generateFood = (currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  };

  const moveSnake = () => {
    setSnake(prevSnake => {
      const dir = nextDirectionRef.current;
      const head = prevSnake[0];
      const newHead = {
        x: head.x + dir.x,
        y: head.y + dir.y,
      };

      // Check wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        endGame();
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        endGame();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  };

  const endGame = () => {
    setIsPlaying(false);
    setGameOver(true);
    if (score > highScore) {
      setHighScore(score);
      saveHighScore(score);
    }
  };

  const startGame = () => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection({ x: 1, y: 0 });
    directionRef.current = { x: 1, y: 0 };
    nextDirectionRef.current = { x: 1, y: 0 };
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  const changeDirection = (newDir) => {
    const current = directionRef.current;
    // Prevent opposite direction
    if (newDir.x === -current.x && newDir.y === -current.y) return;
    
    nextDirectionRef.current = newDir;
    setDirection(newDir);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        <Text style={styles.highScoreText}>High: {highScore}</Text>
      </View>

      <View style={styles.gameBoard}>
        <Svg width={BOARD_SIZE} height={BOARD_SIZE} style={styles.svg}>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            fill="#0f3460"
          />

          {/* Grid lines */}
          {Array.from({ length: GRID_SIZE + 1 }).map((_, i) => (
            <React.Fragment key={`grid-${i}`}>
              <Rect
                x={i * CELL_SIZE}
                y={0}
                width={1}
                height={BOARD_SIZE}
                fill="rgba(255,255,255,0.05)"
              />
              <Rect
                x={0}
                y={i * CELL_SIZE}
                width={BOARD_SIZE}
                height={1}
                fill="rgba(255,255,255,0.05)"
              />
            </React.Fragment>
          ))}

          {/* Snake */}
          {snake.map((segment, index) => (
            <Rect
              key={`snake-${index}`}
              x={segment.x * CELL_SIZE + 2}
              y={segment.y * CELL_SIZE + 2}
              width={CELL_SIZE - 4}
              height={CELL_SIZE - 4}
              fill={index === 0 ? '#4ecca3' : '#45b393'}
              rx={3}
            />
          ))}

          {/* Food */}
          <Circle
            cx={food.x * CELL_SIZE + CELL_SIZE / 2}
            cy={food.y * CELL_SIZE + CELL_SIZE / 2}
            r={CELL_SIZE / 2 - 2}
            fill="#e94560"
          />
        </Svg>

        {!isPlaying && (
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              <Text style={styles.overlayTitle}>
                {gameOver ? '🐍 Game Over!' : '🐍 Snake Game'}
              </Text>
              {gameOver && (
                <Text style={styles.finalScore}>Final Score: {score}</Text>
              )}
              <TouchableOpacity style={styles.playButton} onPress={startGame}>
                <Text style={styles.playButtonText}>
                  {gameOver ? 'Play Again' : 'Start Game'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {isPlaying && (
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => changeDirection({ x: 0, y: -1 })}
            >
              <Text style={styles.arrow}>↑</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => changeDirection({ x: -1, y: 0 })}
            >
              <Text style={styles.arrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.controlSpacer} />
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => changeDirection({ x: 1, y: 0 })}
            >
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => changeDirection({ x: 0, y: 1 })}
            >
              <Text style={styles.arrow}>↓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 20,
  },
  scoreText: {
    color: '#4ecca3',
    fontSize: 24,
    fontWeight: 'bold',
  },
  highScoreText: {
    color: '#ffd700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameBoard: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  svg: {
    backgroundColor: '#0f3460',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
    padding: 30,
  },
  overlayTitle: {
    color: '#4ecca3',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  finalScore: {
    color: 'white',
    fontSize: 24,
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#4ecca3',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  playButtonText: {
    color: '#1a1a2e',
    fontSize: 20,
    fontWeight: 'bold',
  },
  controls: {
    marginTop: 30,
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 5,
  },
  controlButton: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(78, 204, 163, 0.2)',
    borderWidth: 2,
    borderColor: '#4ecca3',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  controlSpacer: {
    width: 70,
    marginHorizontal: 5,
  },
  arrow: {
    color: '#4ecca3',
    fontSize: 32,
    fontWeight: 'bold',
  },
});