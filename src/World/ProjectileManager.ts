import { type ProjectileNames } from '@/lib/constants';
import Projectile from './Projectile';

export default class ProjectileManager extends Phaser.GameObjects.Group {
  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
  }

  spawnProjectile(
    x: number,
    y: number,
    name: ProjectileNames,
    shooterId: string,
    alpha = 1,
  ): void {
    const projectile = this.getFirstDead(false) as Projectile | null;

    if (projectile) {
      projectile.initProjectile(x, y, name, shooterId);
      projectile.setAlpha(alpha);
    } else {
      const newProjectile = new Projectile(this.scene, x, y, name, shooterId);
      newProjectile.setAlpha(alpha);
      this.add(newProjectile);
    }
  }

  update(): void {
    // Projectiles handle their own off-screen removal in preUpdate
  }
}
