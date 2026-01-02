# ⚡️ Dashing Dot

> **An AI-powered endless runner where neural networks evolve to survive a cybernetic onslaught.**

![Project Status](https://img.shields.io/badge/Status-Active_Development-green)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js_|_Phaser_|_TensorFlow.js-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

**Dashing Dot** is a sophisticated web-based game where you don't play the character—you build the brain that plays it. Using **NeuroEvolution (Genetic Algorithms + Neural Networks)**, a population of agents learns to navigate a procedurally generated world filled with platforms and flying cyber-mobs.

---

## 🚀 Experience the Evolution

Watch as generation after generation of "Runners" attempt to survive the gauntlet.
- **Generation 1**: Chaos. They run into walls, fall into pits, and die instantly.
- **Generation 10**: Basics. They learn to jump over gaps.
- **Generation 50**: Mastery. They dodge incoming **Trojans** and **Viruses** with superhuman reflexes.

---

## 🛠 Tech Stack

Built with the bleeding edge of modern web technologies:

*   **Core**: [Next.js 15](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
*   **Game Engine**: [Phaser 3](https://phaser.io/) (Canvas/WebGL)
*   **AI / ML**: [TensorFlow.js](https://www.tensorflow.org/js) (Neural Networks)
*   **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
*   **Styling**: Vanilla CSS / Tailwind (Configured)
*   **Quality**: ESLint, Prettier, Husky, Commitlint

---

## ✨ Key Features

### 🧠 Neuro-Evolutionary AI
The core of Dashing Dot is the **Genetic Algorithm**.
1.  **Population**: We spawn multiple players (bots) with randomized neural weights.
2.  **Selection**: Agents that survive longer and travel further receive a higher "fitness" score.
3.  **Crossover & Mutation**: The best brains are mixed and slightly mutated to create the next generation.

### 👾 Cybernetic Mobs
A dynamic `MobManager` spawns a variety of themed enemies to stop the runners.
- **Types**: *Drone, Bug, Worm, Virus, Bot, Spam, Trojan*.
- **Behavior**: They fly in from the right with randomized velocities and heights, requiring the AI to learn vertical evasion.

### 🏃 Dynamic Asset System
The game features a flexible asset loading system driven by JSON configuration.
- **Players**: 8 Unique characters (*Cipher, Rogue, Vortex, Glitch, Neon, Shadow, Flux, Pulse*).
- **Configuration**: Defined in `src/lib/player-config.json` and `src/lib/mob-config.json`.
- **Sprites**: Dynamically loaded and offset-corrected to ensure perfect hitbox alignment.

---

## 📂 Project Architecture

```
dashingdot/
├── public/
│   └── images/          # Game assets (Players, Mobs, Backgrounds)
├── src/
│   ├── app/             # Next.js App Router
│   ├── lib/             # Configurations & Constants
│   │   ├── config.ts            # Main Game Settings
│   │   ├── player-config.json   # Character Sprite Definitions
│   │   └── mob-config.json      # Enemy Sprite Definitions
│   ├── NeuroEvolution/  # The Brains 🧠
│   │   ├── NeuralNetwork.ts     # TF.js Model definition
│   │   └── GeneticAlgorithm.ts  # Crossover/Mutation logic
│   ├── World/           # Game Entities
│   │   ├── Play.ts             # Main Scene
│   │   ├── Player.ts           # Physics & Brain Interface
│   │   ├── Mob.ts              # Flying Enemies
│   │   └── MobManager.ts       # Spawning Logic
│   └── ...
└── ...
```

---

## ⚡️ Getting Started

### Prerequisites
- **Node.js**: Version 22.x or higher is recommended.
- **Package Manager**: `npm`

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/saifbechan/dashingdot.git
    cd dashingdot
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to warn the evolution in action or watch it explode.

---

## 🧪 Commands & Scripts

We enforce high code quality standards. Use the following commands to ensure your code is clean:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack. |
| `npm run build` | Builds the application for production. |
| `npm run lint` | Runs ESLint to check for code issues. |
| `npm run type-check` | Runs TypeScript compiler to check for type errors. |
| `npm test` | Runs Unit Tests with Jest. |
| `npm run test:e2e` | Runs End-to-End tests with Playwright. |

---

## 🎮 Game Configuration

Tweaking the simulation is easy. Navigate to `src/lib/config.ts`.

- **`playerCount`**: 1 (Single agent debug mode) or 100+ (Evolution mode).
- **`evolution`**: Adjust `mutationRate` and `survivalRate` to speed up learning.
- **`game.physics.arcade.debug`**: Set to `true` to see hitboxes and inputs.

---

## 📝 License

This project is open-sourced under the **MIT License**.

Made with 💜 and 🤖 by the Google Deepmind team.
