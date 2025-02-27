import { Camera, CameraRef, Images, MapView, MapViewRef, ShapeSource, SymbolLayer, SymbolLayerStyle } from '@maplibre/maplibre-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import pois from './pois';
import { Button, StyleProp, Switch, Text, TouchableHighlight, View, ViewStyle } from 'react-native';

const baseStyle: SymbolLayerStyle = {
  //symbolSortKey: ['get', 'priority'], // comment this out to increase performance
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

const staticPinLargeStyle: SymbolLayerStyle = {
  ...baseStyle,
  textField: ['get', 'title'],
  textSize: 14,
  textColor: ['get', 'textColor'],
  textHaloColor: ['get', 'textHaloColor'],
  iconImage: 'poi_L',
};

const staticPinMediumStyle: SymbolLayerStyle = {
  ...baseStyle,
  iconImage: 'poi_M',
};


const staticPinSmallStyle: SymbolLayerStyle = {
  iconImage: 'poi_S',
  iconAnchor: 'center',
  iconSize: 1 / 2,
};

const pragueLocation = [14.4285631, 50.0806125];
const innsbruckLocation = [11.3824194, 47.2648672];

function App(): React.JSX.Element {
  const camera = useRef<CameraRef>(null);
  const map = useRef<MapViewRef>(null);
  const [cameraPosition] = useState<number[]>(innsbruckLocation);
  const [prioPoiId, setPrioPoiId] = useState<string|undefined>();

  const images = {
    poi_S: require('./icons/poi-s.png'),
    poi_M: require('./icons/poi-m.png'),
    poi_L: require('./icons/poi-l.png'),
  };


  const featuresCollection: GeoJSON.FeatureCollection = useMemo(() => {
    const latitudeShift = innsbruckLocation[0] - pragueLocation[0];
    const longitudeShift = innsbruckLocation[1] - pragueLocation[1];

    const features: GeoJSON.FeatureCollection =
    {
      type: 'FeatureCollection',
      features: pois.map(p => {
        const priority = p.id === prioPoiId ? 0 : 100 - p.priority;
        return ({
          type: 'Feature',
          id: p.id,
          properties: {
            title: `${p.name} (${priority.toFixed(2)})`,
            priority,
            textColor: p.id === prioPoiId ? 'white' : 'black',
            textHaloColor: p.id === prioPoiId ? 'red' : 'white',
          },
          geometry: {
            type: 'Point',
            coordinates: [p.latitude + latitudeShift, p.longitude + longitudeShift],
          },
        } as GeoJSON.Feature);
      })
      .sort((a, b) => a.properties?.priority - b.properties?.priority)
      ,
    };

    return features;
  }, [prioPoiId]);

  const style = useMemo(() => ({ flex: 1, backgroundColor: 'white' } as StyleProp<ViewStyle>), []);
  const toggleToiletsAsTop = useCallback(() => {
    if (prioPoiId === undefined) {
      setPrioPoiId('sygic-poi-283376');
    }
    else {
      setPrioPoiId(undefined);
    }
  }, [prioPoiId]);

  const onFeaturePress = useCallback((e: {features: GeoJSON.Feature[]}) => {
    console.log('feature pressed', e.features[0]?.id);
    if (e.features[0]?.id){
      setPrioPoiId(`${e.features[0]?.id}`);
    }
  }, []);

  const [pinLargeStyle, setPinLargeStyle] = useState<SymbolLayerStyle>({
    ...baseStyle,
    textField: ['get', 'title'],
    textSize: 14,
    textColor: ['get', 'textColor'],
    textHaloColor: ['get', 'textHaloColor'],
    iconImage: 'poi_L',
  });

  const [pinMediumStyle, setPinMediumStyle] = useState<SymbolLayerStyle>({
    ...baseStyle,
    iconImage: 'poi_M',
  });

  const [pinSmallStyle, setPinSmallStyle] = useState<SymbolLayerStyle>({
    iconImage: 'poi_S',
    iconAnchor: 'center',
    iconSize: 1 / 2,
  });

  const [useSymbolSortKey, setUseSymbolSortKey] = useState<boolean>(false);
  const onSymbolSortKeyToggle = useCallback(() => {
    const newValue = !useSymbolSortKey;
    setUseSymbolSortKey(newValue);
    if (newValue) {
      setUseStaticStyle(false);
      setPinLargeStyle({...pinLargeStyle, symbolSortKey: ['get', 'priority']});
      setPinMediumStyle({...pinMediumStyle, symbolSortKey: ['get', 'priority']});
      setPinSmallStyle({...pinSmallStyle, symbolSortKey: ['get', 'priority']});
    }
    else {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      setPinLargeStyle(({ symbolSortKey, ...rest }) => rest);
      setPinMediumStyle(({ symbolSortKey, ...rest }) => rest);
      setPinSmallStyle(({ symbolSortKey, ...rest }) => rest);
      /* eslint-enable @typescript-eslint/no-unused-vars */
    }
  }, [pinLargeStyle, pinMediumStyle, pinSmallStyle, useSymbolSortKey]);

  const [useStaticStyle, setUseStaticStyle] = useState<boolean>(false);

  const onStaticStyleToggle = useCallback(() => {
    const newValue = !useStaticStyle;
    setUseStaticStyle(newValue);
    if (newValue){
      setUseSymbolSortKey(false);
    }
  }, [useStaticStyle]);

  console.log('rerender');

  return (
    <View style={style}>
      <Text style={{margin: 6, fontSize: 18}}>Tap a POI to select it, tap the map to deselect</Text>
    <MapView
      ref={map}
      style={style}
      mapStyle="https://demotiles.maplibre.org/styles/osm-bright-gl-style/style.json"
      onPress={useCallback(() => {setPrioPoiId(undefined);}, [])}
    >
      <Camera ref={camera}
        centerCoordinate={cameraPosition}
        zoomLevel={16}
      />
      <Images images={images} />
      <ShapeSource
        id="layer1"
        shape={featuresCollection} onPress={onFeaturePress}
      >
        <SymbolLayer
          id="small"
          style={useStaticStyle ? staticPinSmallStyle : pinSmallStyle}
        />
        <SymbolLayer
          id="medium"
          style={useStaticStyle ? staticPinMediumStyle : pinMediumStyle}
        />
        <SymbolLayer
          id="large"
          style={useStaticStyle ? staticPinLargeStyle : pinLargeStyle}
        />
      </ShapeSource>
    </MapView>
    <View>
      <Button title={ prioPoiId === undefined ? 'Set toilets as high prio' : 'Reset priority'} onPress={toggleToiletsAsTop} />
      <TouchableHighlight onPress={onSymbolSortKeyToggle}>
        <View style={{flexDirection: 'row', justifyContent: 'space-around' }}>
          <Text style={{verticalAlign: 'middle'}}>use symbolSortKey in style</Text>
          <Switch style={{marginVertical: 16}} value={useSymbolSortKey} onValueChange={onSymbolSortKeyToggle} />
        </View>
      </TouchableHighlight>
      <TouchableHighlight onPress={onStaticStyleToggle}>
        <View style={{flexDirection: 'row', justifyContent: 'space-around' }}>
          <Text style={{verticalAlign: 'middle'}}>use static style</Text>
          <Switch style={{marginVertical: 16}} value={useStaticStyle} onValueChange={onStaticStyleToggle} />
        </View>
      </TouchableHighlight>
      <Text style={{marginVertical: 6}}>{`1st feature: ${featuresCollection.features[0].properties?.title}`}</Text>
      <Text>{JSON.stringify(pinLargeStyle)}</Text>
    </View>
    </View>
      );
}

export default App;
