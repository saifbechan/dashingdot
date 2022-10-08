const randomGaussian = (): number =>
  Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(2.0 * Math.PI * Math.random());

export default randomGaussian;
