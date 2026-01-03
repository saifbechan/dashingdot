# ⚡️ Dashing Dot

> **An AI-powered multi-agent survival runner where neural networks evolve to outjump, outshoot, and outlast a cybernetic onslaught.**

![Project Status](https://img.shields.io/badge/Status-Active_Development-green)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js_|_Phaser_|_TensorFlow.js-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

**Dashing Dot** is a high-performance, web-based simulation where you don't play the game—you evolve the intelligence behind it. Using **NeuroEvolution (Genetic Algorithms + Neural Networks)**, a population of agents learns to navigate a procedurally generated, deterministic world.

---

## 🚀 The Path of Evolution

Watch as generation after generation of "Runners" attempt to survive the gauntlet.
- **Generation 1 👶**: Total chaos. They run into walls, fall into pits, and die instantly.
- **Generation 10 🏃**: Basics mastered. They've learned to jump over gaps and stand on platforms.
- **Generation 30 🔫**: Combat training. They begin to pick up powerups and blast **Viruses** out of their path.
- **Generation 50+ 🤖**: Mastery. They dodge, shoot, and navigate with frame-perfect precision.

---

## ✨ Key Features

### 🧠 Neuro-Evolutionary AI
The core of Dashing Dot is a parallelized Genetic Algorithm:
- **Neural Networks**: Each player is powered by a `tf.layers.dense` model using **TensorFlow.js**, predicting both `JUMP` and `SHOOT` actions.
- **Deterministic World**: Spawns are driven by a seeded random generator, ensuring every agent in a generation faces the exact same challenge for fair evaluation.
- **Survival of the Fittest**: Agents are ranked by fitness (distance + survival time). The best brains are selected, crossed over, and mutated to seed the next generation.

### 👁 Lightweight Raycast Vision System
Agents perceive their world through a high-performance **Custom Raycast Vision System** optimized for Arcade Physics:
- **7-Ray FOV**: Agents "see" through a fan-shaped ray array (-45° to +45°), detecting distance and semantic object types (Platform, Mob, Item).
- **Lightweight AABB Raycasting**: Uses Phaser's built-in `Geom.Intersects.GetLineToRectangle()` for direct line-rectangle intersection testing against arcade body bounds, avoiding plugin overhead.
- **Per-Frame Target Building**: All active entities are collected and their body bounds cached once per frame for efficient ray intersection testing.
- **Zero-Allocation Ring Buffer**: Input history uses a `Float32Array` ring buffer for O(1) updates with zero garbage collection pressure.
- **Temporal Memory**: Each agent maintains a 3-frame input history (51 total inputs), allowing the neural network to perceive motion and predict trajectories.
- **Visual Debugging**: Real-time sensory visualization allows you to see the agents' "consciousness" in action when debug mode is enabled.

### 👥 Multi-Player Shared World
Unlike typical AI sims, Dashing Dot features a "Shared" environment:
- **Ghosting & Transparency**: Active agents are rendered with dynamic alpha.
- **Collaborative Obstacles**: Mobs and Items are shared. An item is only "collected" once every alive player has touched it, fading out as collection progress increases.
- **Individual Defense**: Mobs only "die" for the specific player that shot them, but their collective transparency reflects how many agents have successfully cleared that threat.

### 🔫 Combat & Powerups
- **Zero-Ammo Start**: Players start with an empty magazine.
- **Powerups**: Collecting a powerup (found on blue platforms) grants **+5 ammo**.
- **Projectiles**: Each player is assigned a randomized unique projectile type (*Plasma Bolt, Void Orb, Laser Beam, etc.*) to clear their own path through enemy swarms.

### 🎨 Premium Cyberpunk Aesthetics
- **Parallax Backgrounds**: Multi-layered, high-definition backgrounds with independent scroll factors.
- **Visual Effects**: Centralized `EffectManager` handling pooled sparkles, burn effects, and death clouds.
- **Modern UI**: Clean, responsive layout with glassmorphism and real-time generation stats.

---

## 🛠 Tech Stack

Built with the latest standards in web development:
*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Game Engine**: [Phaser 3](https://phaser.io/) (Arcade Physics)
*   **Vision System**: Custom lightweight raycaster using Phaser's Geom.Intersects (optimized for AABB)
*   **AI Engine**: [TensorFlow.js](https://www.tensorflow.org/js) (WASM Backend ready)
*   **Language**: Strict [TypeScript](https://www.typescriptlang.org/)
*   **State**: React 19 + Phaser Bridge

---

## 📂 Project Structure

```bash
dashingdot/
├── public/images/         # 🖼 High-quality game assets
├── src/
│   ├── app/               # 🌐 Next.js Page Structure
│   ├── lib/
│   │   ├── sprite-configs/# ⚙️ JSON Metadata for all entities
│   │   ├── config.ts      # 🛠 Global simulation settings
│   │   └── constants.ts   # 🏷 Enums and shared keys
│   ├── NeuroEvolution/    # 🧬 The AI Core
│   │   ├── NeuralNetwork.ts
│   │   └── GeneticAlgorithm.ts
│   ├── Scenes/            # 🎬 Phaser Scenes
│   │   ├── Play.ts        # The Heart of the Game
│   │   └── Pause.ts       # Pause overlay
│   ├── World/             # 🌍 Physics & Logic
│   │   ├── Player.ts      # Agent logic (Brain + Vision)
│   │   ├── Mob.ts         # Shared Enemy obstacles
│   │   ├── Item.ts        # Collectible items
│   │   ├── Platform.ts    # Procedural grounds
│   │   └── Projectile.ts  # Combat logic
│   ├── types/             # 📝 TypeScript declarations
│   └── ...
```

---

## ⚡️ Getting Started

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/saifbechan/dashingdot.git
    npm install
    ```

2.  **Launch Evolution**:
    ```bash
    npm run dev
    ```
    Open [localhost:3000](http://localhost:3000) to witness the evolution.

3.  **Simulation Controls**:
    - **Press `P`**: Pause/Resume the simulation.
    - **Edit `src/lib/config.ts`**: Toggle `debug: true` to see physics hitboxes and AI input guides.

---

## 🧪 Development Commands

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | High-speed development with Turbopack |
| `npm run type-check` | Validate strict TypeScript types |
| `npm run lint` | Enforce Airbnb-style coding standards |
| `npm test` | Run Jest unit tests |
| `npm run test:e2e` | Run Playwright browser tests |

---

## 📝 License

This project is open-sourced under the **MIT License**.

Made with 🤖 by **Saif Bechan** and the Google Deepmind team.
