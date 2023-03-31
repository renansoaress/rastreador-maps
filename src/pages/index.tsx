import Head from 'next/head';
import styles from '@/styles/Map.module.css';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline,
} from '@react-google-maps/api';
import { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next/types';

interface dataProps {
  date: string;
  direction: number;
  gps: { lat: number; lng: number };
}

const Map: NextPage = () => {
  const [sizePoint, setSizePoint] = useState<number>(3.5);
  const [data, setData] = useState<dataProps[]>([]);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY as string,
  });
  const colorsRef = useRef<string[]>([]);

  useEffect(() => {
    console.log('DATA: ', colorsRef.current);
  }, [data]);

  const fadeInColors = (num: number): string[] => {
    const colors: string[] = [];
    const step = 255 / (num - 1); // calcula o valor do incremento para cada cor
    let r = 0;
    let g = 0;
    let b = 255;

    for (let i = 0; i < num; i++) {
      const hexR = Math.round(r).toString(16).padStart(2, '0'); // converte o valor do componente red para hexadecimal e adiciona um zero à esquerda se necessário
      const hexG = Math.round(g).toString(16).padStart(2, '0'); // converte o valor do componente green para hexadecimal e adiciona um zero à esquerda se necessário
      const hexB = Math.round(b).toString(16).padStart(2, '0'); // converte o valor do componente blue para hexadecimal e adiciona um zero à esquerda se necessário

      colors.push(`#${hexR}${hexG}${hexB}`); // adiciona a cor em hexadecimal ao array de cores

      r += step; // incrementa o valor do componente red
      b -= step; // decrementa o valor do componente blue
    }

    return colors;
  };

  const parseData = (text: string) => {
    const rows = text.split('\n');
    const result = rows.map((row) => {
      const result = JSON.parse(`[${row}]`);
      const gps = result[2];
      if (gps[0] === 0 || gps[1] === 0) return null;
      return {
        date: result[0],
        direction: result[1],
        gps: { lat: gps[0], lng: gps[1] },
      };
    });
    const filterNull = result.filter(
      (result) => result !== null
    ) as dataProps[];
    const order = filterNull.sort((a, b) => {
      return (a.date as any) - (b.date as any);
    });

    setData((_data) => {
      const result = order.filter(
        (value, index) => order.indexOf(value) === index
      );
      colorsRef.current = fadeInColors(result.length);
      return result;
    });
  };

  if (!isLoaded) return <div>Loading...</div>;
  return (
    <>
      <Head>
        <title>Rastreador - Maps</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <div
          className={styles.container}
          style={{
            height: '100vh',
            width: '100%',
          }}
        >
          <div className={styles.container_insert}>
            <textarea
              id="data"
              placeholder="Ex: 1680204270000,0.0,[-19.881792, -43.980389]"
              style={{ width: '100%', height: '75%', resize: 'none' }}
            />
            <button
              className={styles.button}
              onClick={() => {
                const textarea =
                  document.querySelector<HTMLTextAreaElement>('#data');
                try {
                  if (textarea) {
                    parseData(textarea.value);
                  }
                } catch (err) {
                  if (typeof err === 'object' && err !== null) {
                    alert(err.toString());
                  } else {
                    alert('Unexpected error' + err);
                  }
                }
              }}
            >
              Plotar
            </button>
            <button
              className={styles.button}
              onClick={() => {
                setSizePoint((size) => size + 0.5);
              }}
            >
              {`Aumentar PONTO (${sizePoint})`}
            </button>
            <button
              className={styles.button}
              onClick={() => {
                sizePoint > 0.5 && setSizePoint((size) => size - 0.5);
              }}
            >
              {`Diminuir PONTO (${sizePoint})`}
            </button>
            <button
              className={styles.button}
              onClick={() => {
                console.log(process.env.GOOGLE_MAPS_API_KEY);
                setData([]);
                const textarea =
                  document.querySelector<HTMLTextAreaElement>('#data');
                if (textarea) textarea.value = '';
              }}
            >
              RESET MAP
            </button>
          </div>
          {isLoaded ? (
            <GoogleMap
              options={{
                disableDefaultUI: true,
                clickableIcons: false,
                scrollwheel: true,
              }}
              zoom={14}
              center={
                data.length > 0
                  ? data[data.length - 1].gps
                  : { lat: -19.857988118254365, lng: -43.978237540797224 }
              }
              mapTypeId={google.maps.MapTypeId.ROADMAP}
              mapContainerStyle={{ width: '100%', height: '100%' }}
            >
              <div>
                {data.map((point, index) => {
                  return (
                    <Marker
                      key={index}
                      icon={{
                        rotation: point.direction,
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: sizePoint,
                        fillColor: colorsRef.current[index],
                        fillOpacity: 1,
                        strokeColor: 'black',
                        strokeWeight: 1,
                      }}
                      position={point.gps}
                    ></Marker>
                  );
                })}
              </div>
              <div>
                <Polyline
                  path={data.map((value) => value.gps)}
                  options={{
                    strokeColor: '#409b13',
                    strokeOpacity: 0.7,
                    strokeWeight: 2,
                    clickable: false,
                    draggable: false,
                    editable: false,
                    visible: true,
                    zIndex: 1,
                  }}
                />
              </div>
            </GoogleMap>
          ) : (
            <></>
          )}
        </div>
      </main>
    </>
  );
};

export default Map;
