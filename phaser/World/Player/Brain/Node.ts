import { NodeTypes } from '../../../contants';

export default class Node {
  private readonly number: number;
  private readonly type: NodeTypes;

  constructor(number: number, type: NodeTypes) {
    this.number = number;
    this.type = type;
  }

  getNumber = (): number => this.number;
  getType = (): NodeTypes => this.type;
}
