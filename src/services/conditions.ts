import * as FileSystem from 'expo-file-system/legacy';

export type PlaceCoords = {
  latitude: number;
  longitude: number;
};

export type Conditions = {
  temperatureC: number | null;
  humidity: number | null;
  weatherLabel: string;
  weatherCode: number | null;
  windKmh: number | null;
  precipitationMm: number | null;
  aqi: number | null;
  aqiLabel: string;
  pm25: number | null;
  floodLabel: string;
  updatedAt: number;
  coords: PlaceCoords;
};

const FALLBACK: PlaceCoords = { latitude: 14.5995, longitude: 120.9842 };

function cachePath() {
  return `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}dalan-conditions.json`;
}

export async function readCachedConditions(): Promise<Conditions | null> {
  try {
    const path = cachePath();
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(path);
    const data = JSON.parse(raw) as Partial<Conditions>;
    if (!data || typeof data.updatedAt !== 'number' || !data.coords) return null;
    return {
      temperatureC: data.temperatureC ?? null,
      humidity: data.humidity ?? null,
      weatherLabel: data.weatherLabel ?? 'Unknown',
      weatherCode: data.weatherCode ?? null,
      windKmh: data.windKmh ?? null,
      precipitationMm: data.precipitationMm ?? null,
      aqi: data.aqi ?? null,
      aqiLabel: data.aqiLabel ?? 'Unknown',
      pm25: data.pm25 ?? null,
      floodLabel: data.floodLabel ?? 'No data',
      updatedAt: data.updatedAt,
      coords: data.coords,
    };
  } catch {
    return null;
  }
}

async function writeCachedConditions(data: Conditions) {
  try {
    await FileSystem.writeAsStringAsync(cachePath(), JSON.stringify(data));
  } catch {
    // Offline cache is best-effort.
  }
}

function weatherLabel(code: number | null) {
  if (code === null) return 'Unknown';
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 99) return 'Storm';
  return 'Unknown';
}

function aqiLabel(aqi: number | null) {
  if (aqi === null) return 'Unknown';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy';
  if (aqi <= 200) return 'Poor';
  return 'Hazardous';
}

function floodLabel(discharge: number | null, mean: number | null) {
  if (discharge === null || mean === null || mean <= 0) return 'No data';
  const ratio = discharge / mean;
  if (ratio >= 1.5) return 'High';
  if (ratio >= 1.2) return 'Watch';
  return 'Normal';
}

async function getJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Request failed');
  return response.json() as Promise<Record<string, unknown>>;
}

export async function fetchConditions(coords: PlaceCoords = FALLBACK): Promise<Conditions> {
  const { latitude, longitude } = coords;
  const query = `latitude=${latitude}&longitude=${longitude}`;

  const [weather, air, flood] = await Promise.allSettled([
    getJson(
      `https://api.open-meteo.com/v1/forecast?${query}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&timezone=auto`,
    ),
    getJson(
      `https://air-quality-api.open-meteo.com/v1/air-quality?${query}&current=us_aqi,pm2_5`,
    ),
    getJson(
      `https://flood-api.open-meteo.com/v1/flood?${query}&daily=river_discharge,river_discharge_mean&forecast_days=1`,
    ),
  ]);

  const weatherOk = weather.status === 'fulfilled';
  const airOk = air.status === 'fulfilled';
  const floodOk = flood.status === 'fulfilled';
  if (!weatherOk && !airOk && !floodOk) {
    throw new Error('Conditions unavailable');
  }

  const previous = await readCachedConditions();
  const weatherCurrent =
    weatherOk && weather.value.current && typeof weather.value.current === 'object'
      ? (weather.value.current as Record<string, unknown>)
      : {};
  const airCurrent =
    airOk && air.value.current && typeof air.value.current === 'object'
      ? (air.value.current as Record<string, unknown>)
      : {};
  const floodDaily =
    floodOk && flood.value.daily && typeof flood.value.daily === 'object'
      ? (flood.value.daily as Record<string, unknown>)
      : {};

  const weatherCode = Number.isFinite(Number(weatherCurrent.weather_code))
    ? Number(weatherCurrent.weather_code)
    : null;
  const aqi = Number.isFinite(Number(airCurrent.us_aqi)) ? Number(airCurrent.us_aqi) : null;
  const pm25 = Number.isFinite(Number(airCurrent.pm2_5)) ? Math.round(Number(airCurrent.pm2_5)) : null;
  const windKmh = Number.isFinite(Number(weatherCurrent.wind_speed_10m))
    ? Math.round(Number(weatherCurrent.wind_speed_10m))
    : null;
  const precipitationMm = Number.isFinite(Number(weatherCurrent.precipitation))
    ? Math.round(Number(weatherCurrent.precipitation) * 10) / 10
    : null;
  const discharge = Array.isArray(floodDaily.river_discharge)
    ? Number(floodDaily.river_discharge[0])
    : null;
  const mean = Array.isArray(floodDaily.river_discharge_mean)
    ? Number(floodDaily.river_discharge_mean[0])
    : null;

  const data: Conditions = {
    temperatureC: weatherOk
      ? Number.isFinite(Number(weatherCurrent.temperature_2m))
        ? Math.round(Number(weatherCurrent.temperature_2m))
        : null
      : (previous?.temperatureC ?? null),
    humidity: weatherOk
      ? Number.isFinite(Number(weatherCurrent.relative_humidity_2m))
        ? Math.round(Number(weatherCurrent.relative_humidity_2m))
        : null
      : (previous?.humidity ?? null),
    weatherCode: weatherOk ? weatherCode : (previous?.weatherCode ?? null),
    weatherLabel: weatherOk ? weatherLabel(weatherCode) : (previous?.weatherLabel ?? 'Unknown'),
    windKmh: weatherOk ? windKmh : (previous?.windKmh ?? null),
    precipitationMm: weatherOk ? precipitationMm : (previous?.precipitationMm ?? null),
    aqi: airOk ? aqi : (previous?.aqi ?? null),
    aqiLabel: airOk ? aqiLabel(aqi) : (previous?.aqiLabel ?? 'Unknown'),
    pm25: airOk ? pm25 : (previous?.pm25 ?? null),
    floodLabel: floodOk
      ? floodLabel(
          Number.isFinite(discharge) ? discharge : null,
          Number.isFinite(mean) ? mean : null,
        )
      : (previous?.floodLabel ?? 'No data'),
    updatedAt: Date.now(),
    coords,
  };

  await writeCachedConditions(data);
  return data;
}

const CONDITIONS_MAX_AGE_MS = 15 * 60 * 1000;

export function isConditionsFresh(data: Conditions | null) {
  return !!data && Date.now() - data.updatedAt < CONDITIONS_MAX_AGE_MS;
}

export function isConditionsIntent(text: string) {
  return /\b(temp(?:erature)?|weather|humid(?:ity)?|air(?:\s*quality)?|aqi|pm2\.?5|flood(?:ing)?|rain|storm|wind|conditions?)\b/i.test(
    text,
  );
}

function reading(value: number | null, suffix: string) {
  return value === null ? null : `${value}${suffix}`;
}

/** Compact facts for Dally's prompt. Numbers come from the saved or live API snapshot. */
export function summarizeConditions(data: Conditions | null, offline: boolean) {
  if (!data) return 'Local conditions: not saved yet.';
  const temp = reading(data.temperatureC, '°C') ?? 'unknown temperature';
  const humidity = reading(data.humidity, '%') ?? 'unknown humidity';
  const wind = reading(data.windKmh, ' km/h');
  const rain = reading(data.precipitationMm, ' mm');
  const aqi = data.aqi === null ? data.aqiLabel : `${data.aqiLabel} (AQI ${data.aqi})`;
  const pm = reading(data.pm25, '');
  const note = offline ? 'saved locally, offline' : 'saved on this phone';
  return [
    `Local conditions (${note}): ${temp}, ${data.weatherLabel}, humidity ${humidity}.`,
    `Air ${aqi}${pm ? `, PM2.5 ${pm}` : ''}.`,
    `Flood risk ${data.floodLabel}.${wind ? ` Wind ${wind}.` : ''}${rain ? ` Rain ${rain}.` : ''}`,
  ].join(' ');
}

/** Spoken reply when someone asks Dally about the conditions. */
export function formatConditionsReply(data: Conditions | null, offline: boolean) {
  if (!data) {
    return 'I do not have saved conditions yet. Connect once and I will fetch temperature, weather, humidity, air, and flood for you.';
  }

  const when = new Date(data.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const temp = reading(data.temperatureC, '°C') ?? 'an unknown temperature';
  const humidity = reading(data.humidity, '%') ?? 'unknown';
  const aqi = data.aqi === null ? data.aqiLabel : `${data.aqiLabel}, AQI ${data.aqi}`;
  const extras = [
    data.pm25 === null ? null : `PM2.5 is ${data.pm25}`,
    data.windKmh === null ? null : `wind is ${data.windKmh} km/h`,
    data.precipitationMm === null ? null : `rain is ${data.precipitationMm} mm`,
  ].filter(Boolean);

  const source = offline
    ? `I am offline, so this is the last reading I saved at ${when}.`
    : `Updated ${when} and saved on this phone.`;

  return [
    `${source} It is ${temp} and ${data.weatherLabel}, with ${humidity} humidity.`,
    `Air is ${aqi}. Flood risk is ${data.floodLabel}.`,
    extras.length ? `Also, ${extras.join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export async function loadConditions(coords?: PlaceCoords): Promise<{
  data: Conditions | null;
  offline: boolean;
}> {
  const cached = await readCachedConditions();
  try {
    const data = await fetchConditions(coords ?? cached?.coords ?? FALLBACK);
    return { data, offline: false };
  } catch {
    return { data: cached, offline: true };
  }
}
