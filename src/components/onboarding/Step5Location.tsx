import React, { useState } from 'react';
import { MapPin, Navigation, Search, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { PermissionStatus } from '../../types';

interface Step5LocationProps {
  homeCity: string;
  homeState: string;
  homeZip?: string;
  latitude?: number;
  longitude?: number;
  locationPermissionStatus: PermissionStatus;
  onChangeLocation: (data: {
    homeCity: string;
    homeState: string;
    homeZip?: string;
    latitude?: number;
    longitude?: number;
    locationPermissionStatus: PermissionStatus;
  }) => void;
  onNext: () => void;
  onSkip: () => void;
}

const POPULAR_CITIES = [
  { city: 'Austin', state: 'TX', zip: '78701', lat: 30.2672, lon: -97.7431 },
  { city: 'Dallas', state: 'TX', zip: '75201', lat: 32.7767, lon: -96.797 },
  { city: 'Houston', state: 'TX', zip: '77002', lat: 29.7604, lon: -95.3698 },
  { city: 'San Antonio', state: 'TX', zip: '78205', lat: 29.4241, lon: -98.4936 },
  { city: 'Denver', state: 'CO', zip: '80202', lat: 39.7392, lon: -104.9903 },
  { city: 'Chicago', state: 'IL', zip: '60601', lat: 41.8781, lon: -87.6298 }
];

export const Step5Location: React.FC<Step5LocationProps> = ({
  homeCity,
  homeState,
  homeZip,
  latitude,
  longitude,
  locationPermissionStatus,
  onChangeLocation,
  onNext,
  onSkip
}) => {
  const [activeMode, setActiveMode] = useState<'GPS' | 'CITY' | 'ZIP'>('CITY');
  const [cityInput, setCityInput] = useState(`${homeCity}, ${homeState}`);
  const [zipInput, setZipInput] = useState(homeZip || '');
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleRequestGps = () => {
    setIsLocating(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser. Please select your city manually.');
      onChangeLocation({
        homeCity: homeCity || 'Austin',
        homeState: homeState || 'TX',
        locationPermissionStatus: 'DENIED'
      });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        onChangeLocation({
          homeCity: 'Austin',
          homeState: 'TX',
          homeZip: '78701',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          locationPermissionStatus: 'GRANTED'
        });
        setActiveMode('GPS');
      },
      (err) => {
        setIsLocating(false);
        setGpsError('Location access was denied or timed out. You can still set your home city manually.');
        onChangeLocation({
          homeCity: homeCity || 'Austin',
          homeState: homeState || 'TX',
          locationPermissionStatus: 'DENIED'
        });
      },
      { timeout: 8000 }
    );
  };

  const handleSelectPopularCity = (item: (typeof POPULAR_CITIES)[0]) => {
    setCityInput(`${item.city}, ${item.state}`);
    setZipInput(item.zip);
    onChangeLocation({
      homeCity: item.city,
      homeState: item.state,
      homeZip: item.zip,
      latitude: item.lat,
      longitude: item.lon,
      locationPermissionStatus: locationPermissionStatus || 'PROMPT'
    });
  };

  const handleZipApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipInput.trim()) {
      onChangeLocation({
        homeCity: 'Austin',
        homeState: 'TX',
        homeZip: zipInput.trim(),
        latitude: 30.2672,
        longitude: -97.7431,
        locationPermissionStatus: 'PROMPT'
      });
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-[520px] py-2">
      <div>
        <div className="space-y-1 mb-4 text-center">
          <h2 className="text-xl font-black text-white tracking-tight">
            Where do you usually watch?
          </h2>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            RallyOn uses your location to find games and venues near you.
          </p>
        </div>

        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleRequestGps}
          disabled={isLocating}
          className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all mb-4 ${
            locationPermissionStatus === 'GRANTED'
              ? 'bg-emerald-500/15 border-emerald-500 text-white'
              : 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <span className="text-xs font-bold block text-white">
                {isLocating ? 'Locating device...' : 'Use my current location'}
              </span>
              <span className="text-[11px] text-neutral-400">
                {locationPermissionStatus === 'GRANTED'
                  ? 'GPS Coordinate Connected'
                  : 'Fastest setup for nearby Austin venues'}
              </span>
            </div>
          </div>

          {locationPermissionStatus === 'GRANTED' && (
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </button>

        {gpsError && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        <div className="flex items-center my-3">
          <div className="flex-1 border-t border-neutral-800" />
          <span className="px-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            or choose metro area
          </span>
          <div className="flex-1 border-t border-neutral-800" />
        </div>

        {/* Popular Cities Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {POPULAR_CITIES.map((c) => {
            const isChosen = homeCity === c.city && homeState === c.state;
            return (
              <button
                key={c.city}
                type="button"
                onClick={() => handleSelectPopularCity(c)}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                  isChosen
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold">
                    {c.city}, {c.state}
                  </span>
                </div>
                {isChosen && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            );
          })}
        </div>

        {/* Manual ZIP Code Form */}
        <form onSubmit={handleZipApply} className="flex gap-2">
          <input
            type="text"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            placeholder="Enter ZIP code (e.g. 78701)"
            className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-bold text-neutral-200"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-neutral-900 flex items-center justify-between gap-3">
        <span className="text-xs text-neutral-400 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-amber-400" />
          <span>
            {homeCity ? `${homeCity}, ${homeState}` : 'Austin, TX (Default)'}
          </span>
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-black font-black text-xs tracking-wide shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
