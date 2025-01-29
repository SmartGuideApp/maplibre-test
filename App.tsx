import { Camera, CameraRef, Images, MapView, MapViewRef, RegionPayload, ShapeSource, SymbolLayer, SymbolLayerStyle } from '@maplibre/maplibre-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { mapStyle } from './mapStyle';
import { Dimensions, PixelRatio, Platform } from 'react-native';
import pois from './pois';


const SIZE_L = 14;

const baseStyle: SymbolLayerStyle = {
  symbolSortKey: ['get', 'priority'],
  textHaloWidth: 2,
  textHaloBlur: 0,
  textAnchor: 'top',
  textMaxWidth: 10,
  //textFont: ['get', 'textFont'],
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
  textSize: SIZE_L,
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
  const [renderedFeatureIds, setRenderedFeatureIds] = useState<string[]>([]);
  const [cameraPosition, setCameraPosition] = useState<number[]>([14.4285631, 50.0806125]);


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

  const bbox: [number, number, number, number] = useMemo(() => [
    0,
    0,
    9999,//Platform.OS === 'ios' ? mapHeight : PixelRatio.getPixelSizeForLayoutSize(mapHeight),
    9999,//Platform.OS === 'ios' ? displayWidth : PixelRatio.getPixelSizeForLayoutSize(displayWidth),
  ], []);



  const onBoundsChanged = useCallback((bounds: GeoJSON.Feature<GeoJSON.Point, RegionPayload>) => {
    console.log('onBoundsChanged', bounds.properties.visibleBounds);
    const func = async () => {
      const renderedFeatures = await map.current?.queryRenderedFeaturesInRect(bbox, undefined, ['layer1', 'large']);
      const ids = renderedFeatures?.features.filter(f => f.id).map(f => `${f.id}`) || [];
      console.log('rendered:', ids);

      if (renderedFeatures && renderedFeatures?.features.length > 0) {
        const combinedArray = Array.from(new Set(renderedFeatures?.features.map((f) => `${f.id}`).concat(renderedFeatureIds.slice(0, 100))));
        setRenderedFeatureIds(combinedArray);
      }
    };

    func();
    // don't depend on `renderedFeatures` to eliminate infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, bbox, setRenderedFeatureIds]);

  const style = useMemo(() => ({ flex: 1 }), []);


  return (
    <MapView
      ref={map}
      style={style}
      //mapStyle={mapStyle}
      onRegionDidChange={onBoundsChanged}
    //onDidFailLoadingMap={useCallback(() => setIsMounted(true), [])}
    //onDidFinishLoadingMap={useCallback(() => setIsMounted(true), [])}
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
