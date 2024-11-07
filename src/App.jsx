/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useRef, useCallback, useEffect } from 'react';
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
  const [zoneDataModal, setZoneDataModal] = useState(false);
  const [editingModal, setEditingModal] = useState({
    isOpen: false,
    index: null,
    colorPicker: false,
  });

  const mapRef = useRef();
  const drawingManagerRef = useRef(null);
  const inputRef = useRef();

  const handleClickOutside = (event) => {
    if (editingModal.isOpen && !event.target.closest('dialog')) {
      setEditingModal({ isOpen: false, index: null, colorPicker: false });
    }
    if (showColorPicker && !event.target.closest('dialog')) {
      setShowColorPicker(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingModal.isOpen, showColorPicker]);

  // useEffect(() => {
  //   api hívás
  //   ......
  //    setZones([....])
  // }, []);

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
      //api hívás a backendnek a zóna elmentésére
      //......
      setZones((currentZones) => [...currentZones, newZone]);
    } else {
      polygon.setMap(null);
    }

    polygon.setMap(null);

    setDrawingMode(null);
  };

  const handlePolygonEdit = (polygon, index) => {
    if (polygon.vertex) {
      const newCoordinates = zones[index].coordinates;
      newCoordinates[polygon.vertex] = {
        lat: polygon.latLng.lat(),
        lng: polygon.latLng.lng(),
      };
      updateZone(index, { coordinates: newCoordinates });
    }

    if (polygon.edge) {
      const newCoordinates = zones[index].coordinates;
      newCoordinates.splice(polygon.edge, 0, {
        lat: polygon.latLng.lat(),
        lng: polygon.latLng.lng(),
      });
      updateZone(index, { coordinates: newCoordinates });
    }
  };

  const updateZone = (index, updatedZoneData) => {
    setZones((currentZones) =>
      currentZones.map((zone, i) =>
        i === index ? { ...zone, ...updatedZoneData } : zone
      )
    );
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

  const handleCheckCoordinate = () => {
    checkCoordinateInZone(47.4979, 19.0402); // Bp közepe
  };

  const zoneEditingModal = () => {
    function saveZoneName(index) {
      const newName = inputRef.current.value;
      if (newName) {
        updateZone(index, { name: newName });
        setEditingModal({ isOpen: false, index: null, colorPicker: false });
      }
    }

    function setColor(color) {
      updateZone(editingModal.index, { color });
    }

    function deleteZone(index) {
      //api hívás a backendnek a zóna törlésére
      //......
      setZones((currentZones) => currentZones.filter((zone, i) => i !== index));
      setEditingModal({ isOpen: false, index: null, colorPicker: false });
    }

    return (
      <>
        {editingModal.isOpen && (
          <dialog
            open={editingModal.isOpen}
            className='top-20 z-50 p-4 border rounded-md'
          >
            <span
              className='absolute right-3 top-0 text-2xl cursor-pointer hover:text-3xl hover:top-[-3px] transition-all'
              onClick={() =>
                setEditingModal({
                  isOpen: false,
                  index: null,
                  colorPicker: false,
                })
              }
            >
              x
            </span>
            <div className='p-4'>
              <h2 className='text-lg font-bold'>zóna szerkesztése</h2>
              <div className='pb-2'>
                <p>zóna neve</p>
                <input
                  label='zóna neve'
                  ref={inputRef}
                  className='border rounded w-full p-1'
                  type='text'
                  defaultValue={zones[editingModal.index]?.name}
                />
              </div>

              <div className='flex flex-row justify-center items-center gap-2'>
                <button
                  className='bg-green-500 text-white rounded px-2 py-1'
                  onClick={() => saveZoneName(editingModal.index)}
                >
                  mentés
                </button>
              </div>
              <div className='pt-2'>
                <p>zóna színe</p>
                {/* színválasztó */}
                <button
                  onClick={() =>
                    setEditingModal({
                      ...editingModal,
                      colorPicker: !editingModal.colorPicker,
                    })
                  }
                  className={`bg-white ${
                    editingModal.colorPicker && 'border-black bg-slate-300'
                  } border rounded w-8 h-8 flex justify-center items-center text-xl`}
                >
                  {editingModal.colorPicker ? (
                    '✖'
                  ) : (
                    <div
                      className='h-6 w-6 rounded-sm'
                      style={{
                        backgroundColor: zones[editingModal.index].color,
                      }}
                    ></div>
                  )}
                </button>
                {editingModal.colorPicker && (
                  <dialog open={editingModal.colorPicker} className='absolute'>
                    <SketchPicker
                      color={zones[editingModal.index].color}
                      onChangeComplete={(color) => setColor(color.hex)}
                      style={{ marginLeft: '20px' }}
                    />
                  </dialog>
                )}
              </div>
              <div className='flex justify-center items-center pt-2'>
                <button
                  className='bg-red-500 text-white rounded px-2 py-1'
                  onClick={() => deleteZone(editingModal.index)}
                >
                  törlés
                </button>
              </div>
            </div>
          </dialog>
        )}
      </>
    );
  };

  const showZones = () => {
    return (
      <div className='m-2'>
        <button
          className='p-2 bg-white border rounded flex justify-center items-center'
          onClick={() => setZoneDataModal(!zoneDataModal)}
        >
          Zónák megjelenítése
        </button>
        {zoneDataModal && (
          <dialog
            open={zoneDataModal}
            className='top-20 z-50 p-4 border rounded-md max-w-[600px] min-w-48'
          >
            <span
              className='absolute right-2 top-[-4px] text-2xl cursor-pointer hover:text-3xl hover:top-[-7px] transition-all'
              onClick={() => setZoneDataModal(false)}
            >
              x
            </span>
            <div className='pt-2'>
              {zones.length > 0 &&
                zones.map((zone, index) => (
                  <div
                    key={index}
                    className='flex flex-row items-center gap-2 border p-2'
                  >
                    <div
                      className='min-h-6 min-w-6 rounded-sm'
                      style={{ backgroundColor: zone.color }}
                    ></div>
                    <div>
                      <p>{zone.name}</p>
                      <p>koordináták száma:{zone.coordinates.length}</p>
                    </div>
                  </div>
                ))}
            </div>
          </dialog>
        )}
      </div>
    );
  };

  const DrawingUi = () => {
    return (
      <div className='relative flex flex-row items-center justify-center gap-2 mt-5'>
        {/* mozgatás */}
        <button
          onClick={() => setDrawingMode(null)}
          className={`${
            drawingMode == null ? 'border-black bg-slate-300' : 'bg-white'
          } border rounded w-8 h-8 flex justify-center items-center`}
        >
          <FaHandPaper />
        </button>
        {/* rajzolás */}
        <button
          onClick={() => setDrawingMode('polygon')}
          className={`${
            drawingMode == 'polygon' ? 'border-black bg-slate-300' : 'bg-white'
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
      {zoneEditingModal()}
      {showZones()}
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
                <>
                  <Polygon
                    key={index}
                    path={zone.coordinates}
                    options={{
                      fillColor: zone.color,
                      fillOpacity: 0.4,
                      strokeColor: zone.color,
                      strokeWeight: 2,
                      editable: true,
                      draggable: false,
                    }}
                    onClick={() => {
                      setEditingModal({ isOpen: true, index });
                    }}
                    onMouseUp={(polygon) => {
                      handlePolygonEdit(polygon, index);
                    }}
                  />
                </>
              ))}
              <DrawingUi />
              (
              <DrawingManager
                drawingMode={drawingMode}
                onLoad={(dm) => (drawingManagerRef.current = dm)}
                onPolygonComplete={handlePolygonComplete}
                options={{
                  drawingControl: false,
                  polygonOptions: {
                    visible: true,
                    fillColor: polygonColor,
                    fillOpacity: 0.4,
                    strokeColor: polygonColor,
                    strokeWeight: 2,
                    editable: false,
                    draggable: false,
                  },
                }}
              />
              )
            </>
          )}
        </GoogleMap>
      </LoadScript>
      <div className='m-2 p-1'>
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
