# ⚡️ Dashing Dot - NEAT Edition

> **An AI-powered multi-agent survival runner where neural networks evolve using NEAT (NeuroEvolution of Augmenting Topologies) to outjump, outshoot, and outlast a cybernetic onslaught.**

![Project Status](https://img.shields.io/badge/Status-Active_Development-green)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js_|_Phaser_|_NEAT-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

**Dashing Dot** is a high-performance, web-based simulation where you don't play the game—you evolve the intelligence behind it. Using a custom **NEAT** engine, a population of agents learns to navigate a procedurally generated, deterministic world by evolving their neural network topology from scratch.

---

## 🚀 The Path of Evolution

Watch as generation after generation of "Runners" attempt to survive the gauntlet.
- **Gen 1 👶**: Total chaos. 160 players (simple single-layer brains) run into walls and die instantly.
- **Gen 10 🏃**: Speciation occurs. Distinct species (visualized by 8 unique skins) emerge with different strategies.
- **Gen 30 🔫**: Complex behaviors. New neural connections evolve, allowing agents to shoot **Viruses** and collect items.
- **Gen 50+ 🤖**: Mastery. Complex networks with optimized topologies navigate with frame-perfect precision.

---

## ✨ Key Features

### 🧠 Pure NEAT AI System
Replacing fixed-topology networks, this engine implements **NeuroEvolution of Augmenting Topologies**:
- **Dynamic Topology**: Brains start minimal (inputs → outputs) and mutually evolve mostly by adding new structure (nodes & connections).
- **Speciation**: The population is partitioned into species based on genomic compatibility. This protects new innovations (like a new node) from being competed out of existence too early.
- **Visual Speciation**: Each of the **8 Player Skins** represents a distinct biological species. Watch them compete for dominance!
- **Genome Pooling**: Optimized object pooling system handles 160+ genomes per generation with zero garbage collection spikes.

### 👁 Lightweight Raycast Vision System
Agents perceive their world through a high-performance **Custom Raycast Vision System**:
- **7-Ray FOV**: Agents "see" via a fan-shaped array (-45° to +45°), detecting distance and semantic object types (Platform, Mob, Item).
- **Zero-Allocation**: Uses `Float32Array` ring buffers for input history and `Phaser.Geom` for math, avoiding allocation overhead.
- **Temporal Memory**: 3-frame input history allows the network to perceive velocity and trajectory.

### 👥 Multi-Player Shared World
- **Ghosting & Transparency**: Active agents are rendered with dynamic alpha to visualize density.
- **Collaborative/Competitive**: Mobs and Items are shared. An item is collected by the first successful agent, but mobs require individual shots.
- **Performance Optimized**: Runs 160 agents at 60fps on modern hardware.

---

## 🛠 Tech Stack

Built with the latest standards:
*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Game Engine**: [Phaser 3](https://phaser.io/) (Arcade Physics)
*   **AI Engine**: Custom Pure TypeScript NEAT Implementation (No TF.js)
*   **Performance**: Object Pooling, TypedArrays, Singleton Controllers
*   **Language**: Strict [TypeScript](https://www.typescriptlang.org/)

---

## 📂 Project Structure

```bash
dashingdot/
├── src/
│   ├── AI/                # 🧬 NEAT Core
│   │   ├── NEAT/          
│   │   │   ├── Genome.ts      # Neural Network Graph
│   │   │   ├── Species.ts     # Evolutionary Species
│   │   │   ├── index.ts       # Main Controller
│   │   │   ├── GenomePool.ts  # Memory Optimization
│   │   │   └── instance.ts    # Singleton Persistence
│   │   └── utils/
│   ├── Game/              # 🎮 Game Logic
│   │   ├── entities/      # Player, Mob, Platform, etc.
│   │   ├── scenes/        # Play, Pause
│   │   └── managers/      # ItemManager, MobManager...
│   ├── config/            # ⚙️ Configuration
│   │   ├── game.config.ts
│   │   └── evolution.config.ts # NEAT Hyperparameters
│   ├── app/               # 🌐 Next.js Pages
│   └── components/        # React Bridge
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

3.  **Tuning**:
    - Edit `src/config/` to adjust mutation rates, population size (default 160), or speciation thresholds.

---

## 📝 License

This project is open-sourced under the **MIT License**.

Made with 🤖 by **Saif Bechan** and the Google Deepmind team.
