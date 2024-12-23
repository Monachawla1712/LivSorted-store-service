export class GeoJSONGeometry {
  type: string;
  coordinates: number[];
}

export class GeoJSONFeature {
  type: string;
  properties: { [key: string]: any };
  geometry: GeoJSONGeometry;
}

export class GeoJSONFeatureCollection {
  type: string;
  features: GeoJSONFeature[];
}

export class GeoJSONLocation {
  type: string;
  features: GeoJSONFeature[];
}
