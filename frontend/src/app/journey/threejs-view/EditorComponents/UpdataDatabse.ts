import { catchError } from "rxjs";
import { DataType, Datafile } from "../../../../../../common/types/datafile";
import { SupportedDatasetFileTypes } from "../../../../../../common/types/supportedFileTypes";
import { ApiService } from '../../../shared/service/api.service';
import { HttpErrorResponse } from "@angular/common/http";
import { NotificationService } from 'src/app/notification.service';
import { CustomUtilities } from "./Custom_ultilities";
export class UpdateDatabase{

    private notificationService: NotificationService;
    private CustomUtilities = new CustomUtilities();
    constructor(private apiService: ApiService){

    }

NoFileModification(rawdata:Datafile,lon:number,lat:number) {
  if (rawdata.content.location) { // Check if rawdata.location is defined
    if (rawdata.content.location.coordinates) { // Check if rawdata.location.coordinates is defined
      rawdata.content.location.coordinates[0] = lon;
      rawdata.content.location.coordinates[1] = lat;
    }
}

let isReferencedData = false;
if(rawdata.dataType==='REFERENCED'){
  isReferencedData=true;
}
return {
  title: rawdata.title!,
  description: rawdata.description,
  dataType:
  isReferencedData === true
      ? DataType.REFERENCED
      : DataType.NOTREFERENCED,
  tags: rawdata.tags,
  dataSet: SupportedDatasetFileTypes.NONE,
  content: rawdata.content,
};
    }

UpdateCoordinates(id:string,x:number,y:number,z:number){

  const lon = this.CustomUtilities.Reverse_convertCoordinates(x,y,z).lon;
  const lat = this.CustomUtilities.Reverse_convertCoordinates(x,y,z).lat;


  this.apiService.getDatafile(id!).subscribe(result => {
    const OGdata = result;


    const data = this.NoFileModification(OGdata,lon,lat);
    console.log("data",data,typeof(data));
//13.326672,52.5130879
    
    this.apiService
      .updateDatafile(id!, data)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.log("invalid data");

          throw err.message;

        })
      )
      .subscribe(() => {
        console.log("updated");

        this.notificationService.showInfo('createUpdateDatafile.creationSuccess');

      });
    });

}

SaveCoordinatesToDatabase(object_group:THREE.Group,loadedDatapoints_andMesh:THREE.Mesh[]){

  loadedDatapoints_andMesh.forEach((datapointMesh) => {

    
    object_group.children.forEach(mesh => {
      if(datapointMesh.name===mesh.name&&datapointMesh.name!==''){

        console.log("coord:",mesh.name,mesh.position.x,mesh.position.y,mesh.position.z)
      this.UpdateCoordinates(mesh.name,mesh.position.x,mesh.position.y,mesh.position.z);

     }
    });
   
  });
  console.log("saved scene coordinates to database!")


}





}



