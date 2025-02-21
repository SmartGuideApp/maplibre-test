import { Camera, CameraRef, Images, MapView, MapViewRef, ShapeSource, SymbolLayer, SymbolLayerStyle } from '@maplibre/maplibre-react-native';
import React, { useMemo, useRef, useState } from 'react';
import pois from './pois';

const baseStyle: SymbolLayerStyle = {
  symbolSortKey: ['get', 'priority'], // comment this out to increase performance
  textHaloWidth: 2,
  textHaloBlur: 0,
  textAnchor: 'top',
  textMaxWidth: 10,
  iconAllowOverlap: false,
  textAllowOverlap: false,
  iconSize: 1 / 2,
  iconOptional: false,
  iconAnchor: 'bottom',
  textOffset: [0, 0.1],
};

const pinLargeStyle: SymbolLayerStyle = {
  ...baseStyle,
  textField: ['get', 'title'],
  textSize: 14,
  textColor: ['get', 'textColor'],
  textHaloColor: ['get', 'textHaloColor'],
  iconImage: 'poi_L',
};

const pinMediumStyle: SymbolLayerStyle = {
  ...baseStyle,
  iconImage: 'poi_M',
};


const pinSmallStyle: SymbolLayerStyle = {
  iconImage: 'poi_S',
  iconAnchor: 'center',
  iconSize: 1 / 2,
};

function App(): React.JSX.Element {
  const camera = useRef<CameraRef>(null);
  const map = useRef<MapViewRef>(null);
  const [cameraPosition] = useState<number[]>([14.4285631, 50.0806125]);

  const images = {
    poi_S: require('./icons/poi-s.png'),
    poi_M: require('./icons/poi-m.png'),
    poi_L: require('./icons/poi-l.png'),
  };

  const featuresCollection: GeoJSON.FeatureCollection = useMemo(() => {
    const features: GeoJSON.FeatureCollection =
    {
      type: 'FeatureCollection',
      features: pois.map(p => ({
        type: 'Feature',
        id: p.id,
        properties: {
          title: p.name,
          priority: 100 - p.priority,
          textColor: 'black',
          textHaloColor: 'white',
        },
        geometry: {
          type: 'Point',
          coordinates: [p.latitude, p.longitude],
        },
      })),
    };

    return features;
  }, []);

  const style = useMemo(() => ({ flex: 1 }), []);

  return (
    <MapView
      ref={map}
      style={style}
    >
      <Camera ref={camera}
        centerCoordinate={cameraPosition}
        zoomLevel={16}
      />
      <Images images={images} />
      <ShapeSource
        id="layer1"
        shape={featuresCollection}
      >
        <SymbolLayer
          id="small"
          style={pinSmallStyle}
        />
        <SymbolLayer
          id="medium"
          style={pinMediumStyle}
        />
        <SymbolLayer
          id="large"
          style={pinLargeStyle}
        />
      </ShapeSource>
    </MapView>
  );
}

export default App;
