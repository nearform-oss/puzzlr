import {useEffect, type MutableRefObject, useState, useRef} from 'react';
import {OrbitControls, PerspectiveCamera, View} from '@react-three/drei';
import {useLiveQuery} from 'dexie-react-hooks';
import {Box3, MathUtils, type Group, Sphere, Vector3} from 'three';
import {useSpring, animated, config, easings} from '@react-spring/three';
import {useThree} from '@react-three/fiber';
import {db} from './db';
import {
  type LayerPoint,
  pieceLayout,
  placedToCubeColorMap,
  type PlacedPiece,
} from './piece-layout';
import CubeLayer3D from './CubeLayer3D';
import {type PieceColor} from './piece-types';

const colorWeights: Array<[PieceColor, number]> = [
  ['pink', 0.15],
  ['orange', 0.3],
  ['green', 0.5],
  ['blue', 0.75],
  ['purple', 1],
];

function generateRandomCubePieces() {
  const pieces: Array<{color: PieceColor}> = [];

  function isComplete(laidOutPieces: PlacedPiece[][]) {
    const cubeColorMap = placedToCubeColorMap(laidOutPieces);

    // Determine if the cube is complete by checking that every point is defined
    const nextIsComplete =
      cubeColorMap.length === 4 &&
      cubeColorMap.every((layer) => layer.flat().every(Boolean));

    return nextIsComplete;
  }

  function tryPiece() {
    const randomColor = colorWeights.find(
      ([_, maxWeight]) => Math.random() <= maxWeight,
    )?.[0];

    const piece = {
      color: randomColor ?? 'purple',
    };

    const attemptedPieces = [...pieces, piece];
    const laidOutPieces = pieceLayout(
      attemptedPieces.map((piece) => piece.color),
    );

    if (laidOutPieces.flat(2).length === pieces.length + 1) {
      pieces.push(piece);
    }

    return laidOutPieces;
  }

  let laidOutPieces: PlacedPiece[][] = [[]];
  while (!isComplete(laidOutPieces)) {
    laidOutPieces = tryPiece();
    pieces.push();
  }

  return pieces;
}

export default function AssembledCube3D({
  cubeRef,
  controlsRef,
  demo,
}: {
  cubeRef: MutableRefObject<HTMLDivElement>;
  controlsRef?: MutableRefObject<HTMLDivElement>;
  demo?: boolean;
}) {
  const placedPieces = useLiveQuery(async () =>
    db.pieces.where('placement').aboveOrEqual(0).sortBy('placement'),
  );

  const [layers, setLayers] = useState<
    Array<Array<Array<undefined | LayerPoint>>>
  >([[]]);

  const [isComplete, setIsComplete] = useState(false);

  const [{rotateX, rotateY, rotateZ}, api] = useSpring(
    () => ({
      from: {
        rotateX: MathUtils.degToRad(0),
        rotateY: MathUtils.degToRad(0),
        rotateZ: MathUtils.degToRad(0),
      },
      to: {
        rotateX: MathUtils.degToRad(360),
        rotateY: MathUtils.degToRad(360),
        rotateZ: MathUtils.degToRad(360),
      },
      loop: true,
      config: {
        ...config.wobbly,
        // Duration: isComplete ? 2000 : 6000,
        duration: 6000,
      },
    }),
    [isComplete],
  );

  useEffect(() => {
    if (placedPieces === undefined) {
      return;
    }

    const laidOutPieces = pieceLayout(
      (demo ? generateRandomCubePieces() : placedPieces)?.map(
        (piece) => piece.color,
      ) ?? [],
    );
    const cubeColorMap = placedToCubeColorMap(laidOutPieces);

    // Determine if the cube is complete by checking that every point is defined
    const nextIsComplete =
      cubeColorMap.length === 4 &&
      cubeColorMap.every((layer) => layer.flat().every(Boolean));
    setIsComplete(nextIsComplete);

    if (nextIsComplete) {
      for (const point of cubeColorMap.flat(2)) {
        point!.highlight = true;
      }
    }

    setLayers(cubeColorMap);
  }, [placedPieces, demo]);

  useEffect(() => {
    if (!isComplete) {
      return;
    }

    api.start({
      to: [
        {
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
          config: config.default,
        },
        {
          rotateX: MathUtils.degToRad(38),
          rotateY: MathUtils.degToRad(360 * 10 + 45),
          rotateZ: 0,
          config: {
            ...config.molasses,
            duration: 3000,
            easing: easings.easeOutBack,
          },
        },
      ],
      loop: false,
    });
  }, [isComplete, api]);

  const piecesRef = useRef<Group>(null!);
  const pivotRef = useRef<Group>(null!);

  const [centered, setCentered] = useState(false);
  const [radius, setRadius] = useState<number>();
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    if (layers.flat(2).length === 0) {
      return;
    }

    if (centered) {
      return;
    }

    piecesRef.current.position.multiplyScalar(0);
    pivotRef.current.position.multiplyScalar(0);

    const bbox = new Box3().setFromObject(piecesRef.current);
    bbox.getCenter(piecesRef.current.position);
    piecesRef.current.position.multiplyScalar(-1);

    // Calculate the distance between the diagonals of the cube
    const sphere = new Sphere();
    bbox.getBoundingSphere(sphere);

    setRadius(sphere.radius);
    setCentered(true);
  }, [layers, centered]);

  useEffect(() => {
    if (centered) {
      // Const xyPos = ((4 - (1 - 0.92)) / 2) * -1;
      // const zPos = ((layers.length - (1 - 0.92)) / 2) * -1;
      // piecesRef.current.position.x = xyPos;
      // piecesRef.current.position.y = xyPos;
      // piecesRef.current.position.z = zPos;

      const center = new Vector3();
      const bbox = new Box3().setFromObject(piecesRef.current);
      bbox.getCenter(center);
      piecesRef.current.worldToLocal(center);
      piecesRef.current.position.copy(center);
      piecesRef.current.position.multiplyScalar(-1);

      // Makes the scale jump, the sphere doesn't behave well with the axis bound bounding box
      // Const sphere = new Sphere();
      // bbox.getBoundingSphere(sphere);
      // setRadius(sphere.radius);
    }
  }, [layers, centered]);

  const {viewport} = useThree();

  useEffect(() => {
    if (radius === undefined) {
      return;
    }

    const smallestAxis = Math.min(viewport.height, viewport.width);
    const scaleFactor = smallestAxis / (radius * 2);

    // 90% to be sure the object fits in the view
    setScale(scaleFactor * 0.9);
  }, [viewport.width, viewport.height, radius]);

  return (
    <View track={cubeRef}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <ambientLight intensity={0.5} />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <pointLight position={[-10, -10, -10]} />
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />

      <animated.group
        ref={pivotRef}
        rotation-x={rotateX}
        rotation-y={rotateY}
        rotation-z={rotateZ}
        scale={scale}
      >
        <group ref={piecesRef}>
          {layers.map((layer, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <CubeLayer3D key={`layer-${index}`} layer={layer} z={index} />
          ))}
        </group>
      </animated.group>

      {controlsRef && <OrbitControls domElement={controlsRef.current} />}
    </View>
  );
}
