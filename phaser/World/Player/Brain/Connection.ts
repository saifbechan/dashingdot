import InnovationManager from '../../InnovationManager';

export default class Connection {
  private readonly innovationNumber: number;
  private readonly inputNode: number;
  private readonly outputNode: number;
  private weight: number;

  private disabled: boolean;

  constructor(
    innovationManager: InnovationManager,
    inputNode: number,
    outputNode: number,
    weight: number = Math.random()
  ) {
    this.innovationNumber = innovationManager.createIfNotExists(inputNode, outputNode);
    this.inputNode = inputNode;
    this.outputNode = outputNode;
    this.weight = weight;

    this.disabled = false;
  }

  getInnovationNumber = (): number => this.innovationNumber;
  getInputNode = (): number => this.inputNode;
  getOutputNode = (): number => this.outputNode;
  getWeight = (): number => this.weight;
  getDisabled = (): boolean => this.disabled;

  disable = (): void => {
    this.disabled = true;
  };

  setWeight = (weight: number): void => {
    this.weight = weight;
  };
}
