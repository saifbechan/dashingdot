import InnovationManager from '../../../../phaser/World/InnovationManager';
import Brain from '../../../../phaser/World/Player/Brain/Brain';
import Connection from '../../../../phaser/World/Player/Brain/Connection';

describe('getLastInnovation', () => {
  it('should return 0 if no innovation occured', () => {
    const brain = new Brain(new InnovationManager(), [], []);
    expect(brain.getLastInnovation()).toBe(0);
  });
  it('should return the last innovation number', () => {
    const innovationManager = new InnovationManager();
    const brain = new Brain(
      innovationManager,
      [],
      [
        new Connection(innovationManager, 1, 1),
        new Connection(innovationManager, 2, 2),
        new Connection(innovationManager, 5, 5),
      ]
    );
    expect(brain.getLastInnovation()).toBe(3);
  });
});
