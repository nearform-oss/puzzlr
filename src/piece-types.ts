export type Point = 0 | 1;
export type Piece1D = [Point, Point, Point];
export type Piece2D = [Piece1D, Piece1D, Piece1D];

export const allPieceColors = [
  'purple',
  'green',
  'pink',
  'orange',
  'blue',
] as const;
type PieceColorTuple = typeof allPieceColors;
export type PieceColor = PieceColorTuple[number];

// https://stackoverflow.com/a/61129291
export function isPieceColor(color: unknown) {
  return allPieceColors.find((c) => c === color) !== null;
}
