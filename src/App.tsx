import {type MutableRefObject, useRef, lazy, useEffect} from 'react';
import {useSearchParams} from 'react-router-dom';
import logo from './assets/logo.png';
import {db} from './db';
import {isPieceColor, type PieceColor} from './piece-types';
import SingleShape from './SingleShapeDom';

const Canvas3D = lazy(async () => import('./Canvas3D'));

function App() {
  const [search, setSearch] = useSearchParams();
  useEffect(() => {
    let cancel = false;

    let timeoutHandle: number | undefined = setTimeout(() => {
      timeoutHandle = undefined;
      if (cancel) {
        console.log('skip');
        return;
      }

      if (search.has('add')) {
        console.log('adding', search.get('add'));
        const nextSearch = new URLSearchParams([...search.entries()]);
        nextSearch.delete('add');
        setSearch(nextSearch);

        if (isPieceColor(search.get('add'))) {
          void db.pieces.add({
            color: search.get('add') as PieceColor,
            added: new Date(),
          });
        }
      }
    }, 0);

    return () => {
      cancel = true;
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [search, setSearch]);
  const orangeRef = useRef<HTMLDivElement>(null!);
  const greenRef = useRef<HTMLDivElement>(null!);
  const blueRef = useRef<HTMLDivElement>(null!);
  const purpleRef = useRef<HTMLDivElement>(null!);
  const pinkRef = useRef<HTMLDivElement>(null!);
  const cubeRef = useRef<HTMLDivElement>(null!);

  const pieceRefs: {[key in PieceColor]: MutableRefObject<HTMLDivElement>} = {
    orange: orangeRef,
    green: greenRef,
    blue: blueRef,
    purple: purpleRef,
    pink: pinkRef,
  };

  return (
    <div className="relative w-full">
      <div className="gap-4 p-2 w-full max-w-screen-sm">
        <div className="flex flex-row gap-2">
          <img src={logo} className="h-10 w-auto" />
          <div className="font-heading text-3xl font-700">NodeConf EU 2023</div>
        </div>
        <div className="font-heading font-600">
          at the Lyrath Estate, Kilkenny, Ireland
        </div>
        <div className="flex flex-row w-full items-stretch">
          <div className="gap-2">
            {Object.entries(pieceRefs).map(([color, ref]) => (
              <SingleShape key={color} ref={ref} color={color as PieceColor} />
            ))}
          </div>
          <div ref={cubeRef} className="flex-grow-1" />
        </div>
        <div className="prose">Find the pieces to complete the cube</div>
        <button
          type="button"
          className="btn"
          onClick={() => {
            void db.transaction('rw', [db.pieces], async () =>
              db.pieces.clear(),
            );
          }}
        >
          clear
        </button>
      </div>
      <Canvas3D pieceRefs={pieceRefs} cubeRef={cubeRef} />
    </div>
  );
}

export default App;
