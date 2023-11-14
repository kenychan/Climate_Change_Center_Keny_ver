import { Injectable } from '@angular/core';
import { Coordinate } from 'ol/coordinate';
import { transform } from 'ol/proj';
import { fromLonLat } from 'ol/proj';
import { NoFileUploadComponent } from 'src/app/upload-data/no-file/no-file.component';
import { Subject } from 'rxjs';
import { InputText } from 'primeng/inputtext';


/**
 * Service, which propagates coordinate changes through the application.
 */
@Injectable()
export class CoordinateService {

  private coordinateSubject = new Subject<[number, number]>();
  private NoFileUploadComponent:NoFileUploadComponent;
  coordinate$ = this.coordinateSubject.asObservable();

  setCoordinate(coordinate: [number, number]) {
    this.coordinateSubject.next(coordinate);
  }

  transformToLongLat(coordinate: Coordinate) {

    return transform(coordinate, 'EPSG:3857', 'EPSG:4326');
  }
  transformFromLongLat(lon:number,lat:number){

  return fromLonLat([lon, lat]);
  }

  
}
