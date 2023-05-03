class Size {
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  ratio() {
    return this.width / this.height;
  }
}

export default Size;
