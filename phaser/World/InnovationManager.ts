import { InnovationsType } from '../types';

export default class InnovationManager {
  private readonly innovations: InnovationsType = {};

  createIfNotExists = (inputNode: number, outputNode: number): number => {
    const connection =
      outputNode > inputNode ? `${inputNode}>${outputNode}` : `${outputNode}>${inputNode}`;
    const innovations = Object.values(this.innovations).length;
    if (!this.innovations[connection]) {
      this.innovations[connection] = innovations + 1;
    }
    return this.innovations[connection];
  };

  getInnovations = (): InnovationsType => this.innovations;
}
