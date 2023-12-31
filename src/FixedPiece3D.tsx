import clsx from 'clsx';
import {Canvas, type Dpr, type Euler} from '@react-three/fiber';
import {rotatingPieces} from './RotatingPieces';
import {type PieceColor} from './piece-types';

export default function FixedPiece3D({
  color,
  setTakeSnapshot,
  rotation,
  dpr,
}: {
  rotation?: Euler;
  color: PieceColor;
  setTakeSnapshot?: React.Dispatch<React.SetStateAction<() => string>>;
  dpr?: Dpr | undefined;
}) {
  const Piece = rotatingPieces[color];

  return (
    <Canvas
      // EventSource={mainRef}
      eventSource={document.querySelector<HTMLElement>('#root')!}
      // https://github.com/pmndrs/react-three-fiber/issues/251#issuecomment-558573141
      // Scrolling and mouse events seem to work best with fixed positioning
      className={clsx('')}
      dpr={dpr}
    >
      {/* eslint-disable-next-line react/no-unknown-property */}
      <ambientLight intensity={0.5} />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <pointLight position={[-10, -10, -10]} />
      <Piece
        rotation={rotation}
        setTakeSnapshot={setTakeSnapshot}
        scale={1.5}
      />
      {/* <OrbitControls /> */}
    </Canvas>
  );
}
