import Brain from '../../../../phaser/World/Player/Brain/Brain';
import Connection from '../../../../phaser/World/Player/Brain/Connection';

describe('getLastInnovation', () => {
  it('should return 0 if no innovation occured', () => {
    const brain = new Brain(jest.fn(), [], []);
    expect(brain.getLastInnovation()).toBe(0);
  });
  it('should return the last innovation number', () => {
    const brain = new Brain(
      jest.fn(),
      [],
      [
        new Connection((x: number, y: number) => x + y, 1, 1),
        new Connection((x: number, y: number) => x + y, 2, 2),
        new Connection((x: number, y: number) => x + y, 5, 5),
      ]
    );
    expect(brain.getLastInnovation()).toBe(10);
  });
});
