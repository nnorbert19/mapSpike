// src/App.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  GoogleMap,
  LoadScript,
  DrawingManager,
  Polygon,
} from '@react-google-maps/api';
import { SketchPicker } from 'react-color';
import { FaDrawPolygon, FaHandPaper } from 'react-icons/fa';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS;

const mapContainerStyle = {
  width: '800px',
  height: '600px',
};

const center = {
  lat: 47.4979,
  lng: 19.0402,
};

const libraries = ['drawing', 'geometry'];

function App() {
  const [zones, setZones] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null);
  const [polygonColor, setPolygonColor] = useState('#2196F3');
  const [editingZoneIndex, setEditingZoneIndex] = useState(null);

  useEffect(() => {
    //api hívás
    //......
  }, []);

  const mapRef = useRef();
  const drawingManagerRef = useRef(null);

  const onLoadMap = useCallback((map) => {
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

  const handlePolygonComplete = (polygon) => {
    if (!isLoaded) return;

    const zoneName = prompt('Enter a name for this zone:');
    if (zoneName) {
      // koordináták kinyerése a polygonból
      const path = polygon
        .getPath()
        .getArray()
        .map((latLng) => ({ lat: latLng.lat(), lng: latLng.lng() }));

      const newZone = {
        name: zoneName,
        color: polygonColor,
        coordinates: path,
      };
      console.log('newZone', newZone);
      //api hívás a backendnek a zóna elmentésére
      //......
      setZones((currentZones) => [...currentZones, newZone]);
    } else {
      polygon.setMap(null);
    }
    setDrawingMode(null);
  };

  const checkCoordinateInZone = (lat, lng) => {
    if (!isLoaded) return;

    const location = new window.google.maps.LatLng(lat, lng);

    for (const zone of zones) {
      const polygonPath = zone.coordinates.map(
        (coord) => new window.google.maps.LatLng(coord.lat, coord.lng)
      );
      const polygon = new window.google.maps.Polygon({ paths: polygonPath });

      if (
        window.google.maps.geometry.poly.containsLocation(location, polygon)
      ) {
        alert(`A koordináta ebben a(z): "${zone.name}" zónában található`);
        return zone.name;
      }
    }
    alert('A koordináta nincs zónában');
    return null;
  };

  // koordináta ellenőrzés, hogy benne van-e valamelyik zónában
  const handleCheckCoordinate = () => {
    checkCoordinateInZone(47.4979, 19.0402); // Bp közepe
  };

  const DrawingUi = () => {
    return (
      <div className='relative flex flex-row items-center justify-center gap-2 mt-5'>
        {/* mozgatás */}
        <button
          onClick={() => setDrawingMode(null)}
          className={`bg-white ${
            drawingMode == null && 'border-black bg-slate-300'
          } border rounded w-8 h-8 flex justify-center items-center`}
        >
          <FaHandPaper />
        </button>
        {/* rajzolás */}
        <button
          onClick={() => setDrawingMode('polygon')}
          className={`bg-white ${
            drawingMode == 'polygon' && 'border-black bg-slate-300'
          } border rounded w-8 h-8 flex justify-center items-center`}
        >
          <FaDrawPolygon />
        </button>
        <div>
          {/* színválasztó */}
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`bg-white ${
              showColorPicker && 'border-black bg-slate-300'
            } border rounded w-8 h-8 flex justify-center items-center text-xl`}
          >
            {showColorPicker ? (
              '✖'
            ) : (
              <div
                className='h-6 w-6 rounded-sm'
                style={{ backgroundColor: polygonColor }}
              ></div>
            )}
          </button>
          {showColorPicker && (
            <dialog open={showColorPicker} className='absolute'>
              <SketchPicker
                color={polygonColor}
                onChangeComplete={(color) => setPolygonColor(color.hex)}
                style={{ marginLeft: '20px' }}
              />
            </dialog>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className='border-black border-2 border-solid rounded'>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
        <GoogleMap
          id='map'
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={12}
          onLoad={onLoadMap}
        >
          {isLoaded && (
            <>
              {/* zónák rajzolása */}
              {zones.map((zone, index) => (
                <Polygon
                  key={index}
                  path={zone.coordinates}
                  options={{
                    fillColor: zone.color,
                    fillOpacity: 0.4,
                    strokeColor: zone.color,
                    strokeWeight: 2,
                    editable: editingZoneIndex === index,
                    draggable: false,
                  }}
                  onClick={() => alert(`Zne: ${zone.name}`)}
                  onMouseUp={(e) => {
                    if (editingZoneIndex === index) {
                    }
                  }}
                />
              ))}
              <DrawingUi />
              <DrawingManager
                drawingMode={drawingMode}
                onLoad={(dm) => (drawingManagerRef.current = dm)}
                onPolygonComplete={handlePolygonComplete}
                options={{
                  drawingControl: false,
                  polygonOptions: {
                    fillColor: polygonColor,
                    fillOpacity: 0.4,
                    strokeColor: polygonColor,
                    strokeWeight: 2,
                    editable: true,
                    draggable: false,
                  },
                }}
              />
            </>
          )}
        </GoogleMap>
      </LoadScript>
      <div className='m-2'>
        <button
          className='bg-white border rounded flex justify-center items-center'
          onClick={handleCheckCoordinate}
        >
          Check Coordinate (47.4979,19.0402,)
        </button>
      </div>
    </div>
  );
}

export default App;
