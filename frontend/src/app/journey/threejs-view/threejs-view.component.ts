




import {
  Component,
  Input,
  SimpleChanges,
  ViewChild,
  ElementRef,
  HostListener,Renderer2, OnInit,OnDestroy,NgZone,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { CollectionData } from '../services/journey.service';
import { ViewType } from '../journey.component';
import { BehaviorSubject, Observable, combineLatest,catchError, ReplaySubject, finalize, of } from 'rxjs';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GUI } from 'dat.gui'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import {
  MediaType,
  DataType,
  NotRef,
  Ref,
  Datafile,
  JsonObject,
} from '../../../../../common/types/datafile';
import { ApiService } from '../../shared/service/api.service';
import { NoFileUploadComponent } from 'src/app/upload-data/no-file/no-file.component';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from 'src/app/notification.service';
import { SupportedDatasetFileTypes } from '../../../../../common/types/supportedFileTypes';
import { and } from './Editor/examples/jsm/nodes/Nodes';

// Interface representing a single city tile
interface CityTile {
  name: string;
  scenePosition: THREE.Vector3;
}

@Component({
  selector: 'app-threejs-view',
  templateUrl: './threejs-view.component.html',
  styleUrls: ['./threejs-view.component.scss'],
})
export class ThreeJSComponent {
  // Basic Three.js components
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer=new THREE.WebGLRenderer();
  private controls: OrbitControls;
  private loadedDatapoints_andMesh: THREE.Mesh[];
  //transformation components
  private transformControl: TransformControls;

  private selectedObject: THREE.Mesh | null = null;
  

  private material_test = new THREE.MeshStandardMaterial( { color: 0x000000 } );

  private object_group = new THREE.Group();
  private gui:  GUI;


  // Window properties
  private windowWidth: number ;
  private windowHeight:number;
  // Toggle parameters
  private renderingStopped = true;
  private objectsLoaded = false;
  private Youtube_renderer = new CSS3DRenderer();

  private notificationService: NotificationService;
  private UserUploadedScene:boolean;
  private userScene:THREE.Object3D;
  localData$?: Observable<any>;

  /**
   * State of the Journey.
   */

  @Input({ required: true }) collectionsData!: Observable<CollectionData>[];//get data
  @Input({ required: true }) viewType!: ViewType;

  @ViewChild('renderContainer', { static: false }) container!: ElementRef;

  //private datapointMeshes: Map<THREE.Mesh, Datafile>;



  constructor(private renderer2: Renderer2,private ngZone: NgZone,private apiService: ApiService) {
    this.windowWidth=this.renderer.domElement.width;
    this.windowHeight=this.renderer.domElement.height;


    // Scene
    this.scene= new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    // Add light
    const light = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(light);
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.windowWidth / this.windowHeight,
      0.1,
      1000000
    );
    this.camera.position.z = 90;
    // Renderer

    this.renderer.setSize(this.windowWidth, this.windowHeight);
    // Orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();
    // Datapoints
    this.loadedDatapoints_andMesh = [];

    //set transformControl
   

    this.transformControl = new TransformControls( this.camera, this.renderer.domElement );
  

    this.transformControl.setMode("translate"); //also scale,rotate
    this.scene.add(this.transformControl);

    // Add event listener for 'dragging-changed' event
    this.transformControl.addEventListener('dragging-changed', (event: { [key: string]: any }) => {
      this.controls.enabled = !event['value']; // Access 'this.controls' directly
    });
    
   //this.UpdateCoordinates("651062f30e58680ea8b8b6fc",0,0,0);

  }


   extractYouTubeVideoId(url: string): string | null {
    // Regular expressions to match YouTube video IDs
    const regexLong = /(?:\?v=|&v=|youtu\.be\/|\/embed\/|\/v\/|\/e\/|watch\?v=)([a-zA-Z0-9_-]{11})/;
    const regexShort = /^([a-zA-Z0-9_-]{11})$/;
  
    // Check for a match using the long regex
    const matchLong = url.match(regexLong);
  
    // If there's a match with the long regex, return the video ID
    if (matchLong) {
      return matchLong[1];
    }
  
    // If there's no match with the long regex, check for a match with the short regex
    const matchShort = url.match(regexShort);
  
    // If there's a match with the short regex, return the video ID
    if (matchShort) {
      return matchShort[1];
    }
  
    // If no match is found, return null
    return null;
  }


    Youtube ( id:string, x:number, y:number, z:number ) {
    var div = document.createElement( 'div' );
    div.style.width = '480px';
    div.style.height = '360px';
    div.style.backgroundColor = '#000';
    var iframe = document.createElement( 'iframe' );
    iframe.style.width = '480px';
    iframe.style.height = '360px';
    iframe.style.border = '0px';
    iframe.src = [ 'https://www.youtube.com/embed/', id, '?rel=0&autoplay=1&mute=1' ].join( '' );
    div.appendChild( iframe );
    var object = new CSS3DObject( div );
    object.position.set( x, y, z );

    return object;
  };

  Add_youtube(){
  
				const container = document.querySelector('.threejs-renderer');
        this.Youtube_renderer.setSize( this.windowWidth, this.windowHeight );
        this.Youtube_renderer.domElement.style.position = 'absolute';
        this.Youtube_renderer.domElement.style.top = '0px';
        container!.appendChild(this.Youtube_renderer.domElement);
    
        const youtube1=this.Youtube( 'TlLijkYQjlw', 0, 0, -500 );
        const youtube2=this.Youtube( 'KuGI0H_T0bw', 0, 300, -500 ) 
        console.log("youtube initialized;",youtube1,youtube2 )
    
        this.object_group.add(youtube1);
        this.object_group.add(youtube2);
        
        // Block iframe events when dragging camera
    
        const blocker = document.getElementById( 'Pause_video' );
        blocker!.style.display = 'none';
    
        document.addEventListener( 'mousedown', function () {
    
          blocker!.style.display = '';
    
        } );
        document.addEventListener( 'mouseup', function () {
    
          blocker!.style.display = 'none';
    
        } );
  }






  createVideoThumbnailPlane(DataID:string,videoId:string, x:number, y:number, z:number) {

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;



    const texture = new THREE.TextureLoader().load(thumbnailUrl);

    const geometry = new THREE.PlaneGeometry(32, 18); // Assuming 16:9 aspect ratio
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const plane = new THREE.Mesh(geometry, material);
    plane.name="Youtube_"+DataID;    
    plane.position.set(x,y+20,z); //y and z are somehow swapped
    this.loadedDatapoints_andMesh.push(plane);
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

  const lon = this.Reverse_convertCoordinates(x,y,z).lon;
  const lat = this.Reverse_convertCoordinates(x,y,z).lat;


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

SaveCoordinatesToDatabase(loadedDatapoints_andMesh:THREE.Mesh[]){
//13.326672,52.51309605145015
//13.321436963457137,52.51390016131765
  loadedDatapoints_andMesh.forEach((datapointMesh) => {

    
    this.object_group.children.forEach(mesh => {
      if(datapointMesh.name===mesh.name&&datapointMesh.name!==''){

        console.log("coord:",mesh.name,mesh.position.x,mesh.position.y,mesh.position.z)
      this.UpdateCoordinates(mesh.name,mesh.position.x,mesh.position.y,mesh.position.z);
      //datapointMesh.position.set(mesh.position.x,mesh.position.y,mesh.position.z);

     }
    });
   
  });
  console.log("saved scene coordinates to database!")


}




  ngOnInit() {
    this.renderer.domElement.addEventListener('click', (event) => {
      this.ngZone.run(() => {
        this.onCanvasClick(event);
      });
    });

  }



  onCanvasClick(event: MouseEvent): void {

    // event.clientXY are not corresponding to the container, 
    //Calculate the mouse coordinates relative to the container
  const containerRect = this.container.nativeElement.getBoundingClientRect();
  const mouseX = event.clientX - containerRect.left;
  const mouseY = event.clientY - containerRect.top;

    const mouse = new THREE.Vector2(
      (mouseX / this.windowWidth) * 2 - 1,
      -(mouseY / this.windowHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);


    console.log("mouse",event.clientX ,event.clientY,this.windowWidth,this.windowHeight,mouse);
    //https://stackoverflow.com/questions/51024450/click-object-in-three-js-with-angular



    const intersects = raycaster.intersectObjects(this.loadedDatapoints_andMesh, true);
    //*************SOLVES THE PROBLEM */
    //https://stackoverflow.com/questions/24453821/three-js-raycaster-not-detecting-scene-mesh
    //Has to save all the meshes into a mesh array, and then let raycaster selecr from the array
    console.log("intersects select",intersects[0].object.position,intersects[0].point);    
     // COLOR SELECTION
    const material_select = new THREE.MeshBasicMaterial({ color: 0xff0000 }); 

    /**for ( let i = 1; i < intersects.length; i ++ ) {

      ((intersects[ i ].object)as THREE.Mesh).material=this.material_test;

    }*/
    
    //when click a point, raycaster will cast a ray in z axis to your screen,
    // so the closest object to your screen will be saved in intersects[0], which is what you want to select


    if (intersects.length > 0) {
      const clickedObject = intersects[0].object as THREE.Mesh; // Cast to Mesh
      if (this.selectedObject !== clickedObject) {
        // Deselect the previously selected object.
        if (this.selectedObject) {
          this.transformControl.detach();
        }

        // Select the clicked object.
        this.selectedObject = clickedObject;
        this.transformControl.attach(this.selectedObject);
        this.selectedObject.material=material_select;//set color to selected object


      } else {
        // Deselect when clicking on the already selected object.
        this.transformControl.detach();
        this.selectedObject = null;

      }
    } else {
      // Deselect when clicking on empty space.
      if (this.selectedObject) {
        this.transformControl.detach();
        this.selectedObject = null;

      }
    }
  }



    // Ensure the controls and transformControl are disposed when the component is destroyed

  ngOnDestroy() {
    this.controls.dispose();
    this.transformControl.dispose();

  }



  removeDuplicatesInArray(arr:THREE.Mesh[]) {
    const uniqueMap = new Map();
  
    for (const item of arr) {
      if (!uniqueMap.has(item.name)) {
        uniqueMap.set(item.name, item);
      }
    }
  
    const uniqueArray = Array.from(uniqueMap.values());
    return uniqueArray;
  }

   removeDuplicatesAndEmptyElements<T>(arr: T[]): T[] {
    const uniqueSet = new Set<T>();
    const result: T[] = [];
  
    for (const item of arr) {
      // Check if the item is not empty and not already in the set
      if (item !== '' && item !== undefined && !uniqueSet.has(item)) {
        uniqueSet.add(item);
        result.push(item);
      }
    }
  
    return result;
  }

   removeStringFromArray(arr: string[], target: string): string[] {
    return arr.filter((item) => item !== target);
  }

  Datapoint_refresh() {

  // Clear the objects from the scene
  this.loadedDatapoints_andMesh.forEach((datapointMesh) => {
    
    this.object_group.remove(datapointMesh);
    
  });
  //(datapointMesh) is an arbitrary parameter name that you've chosen to represent
  // each item in the loadedDatapoints_andMesh array as you iterate through it.


    this.loadedDatapoints_andMesh.length = 0;

    //Add new transfor control when data is refreshed
    this.transformControl= new TransformControls( this.camera, this.renderer.domElement );
    this.transformControl.setMode("translate"); //also scale,rotate
    this.scene.add(this.transformControl);
    this.transformControl.addEventListener('dragging-changed', (event: { [key: string]: any }) => {
      this.controls.enabled = !event['value']; // Access 'this.controls' directly
    });

    // Create new ones when it's reading from database
    if (this.UserUploadedScene==false){
    combineLatest(this.collectionsData).subscribe((collectionsData) =>
      collectionsData.forEach((collection) => {
        collection.files.results.forEach((datapoint) => {
          //console.log("GET JSON:",JSON.stringify(datapoint))
          // Create new mesh for each of the datapoints
          const datapointMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: collection.color })
          );
          datapointMesh.name = "Data_mesh_"+datapoint._id!;//set id as name+specification for later convenience
          datapointMesh.scale.copy(new THREE.Vector3(10, 50, 10));
          // Convert the coordinates
          const sceneCoordinates = this.convertCoordinates(
            datapoint.content.location!.coordinates[0],
            datapoint.content.location!.coordinates[1]
          );
          //if it's refernce data, then create picture of reference
          if (datapoint.dataType==="REFERENCED"){ //strict compare
            //video
            if((datapoint.content as Ref).mediaType==='VIDEO'){
              const youtubeID = this.extractYouTubeVideoId((datapoint.content as Ref).url);
            this.createVideoThumbnailPlane(datapoint._id!,youtubeID!,sceneCoordinates.x,0,sceneCoordinates.z);
            console.log(datapoint );//mediaType is declared under Ref in datafiles.ts

            }
          }
          // Set the position and add to the scene
          datapointMesh.position.set(
            sceneCoordinates.x,
            -20,
            sceneCoordinates.z
          );
          // Copy the mesh and create the beam, beam and mesh are separated.
          /*
          const beam = new THREE.Mesh().copy(datapointMesh);
          beam.scale.copy(new THREE.Vector3(0.2, 300, 0.2));
          beam.material = new THREE.MeshBasicMaterial({
            color: collection.color,
            opacity: 0.4,
            transparent: true,
          });*/
          // Add the objects to the scene and array
    
          this.loadedDatapoints_andMesh.push(datapointMesh);
          
          //this.loadedDatapoints_andMesh.push(beam); same name will cause problem in later modification

       
        });  
        
      })
      
    );
  
    this.loadedDatapoints_andMesh=this.removeDuplicatesInArray(this.loadedDatapoints_andMesh);//remove duplicates
  
  }

        ///////////////////////////////////////// Create user uploaded scene
        if (this.UserUploadedScene==true){
          let nameArr:string[] = [];

          //first add data, then find intersections and modify them by the user defined scene
          combineLatest(this.collectionsData).subscribe((collectionsData) =>
          collectionsData.forEach((collection) => {
            collection.files.results.forEach((datapoint) => {
              //console.log("GET JSON:",JSON.stringify(datapoint))
              // Create new mesh for each of the datapoints
              const datapointMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 1),
                new THREE.MeshBasicMaterial({ color: collection.color })
              );
              datapointMesh.name = "Data_mesh_"+datapoint._id!;//set id as name+specification for later convenience
              datapointMesh.scale.copy(new THREE.Vector3(10, 50, 10));
              // Convert the coordinates
              const sceneCoordinates = this.convertCoordinates(
                datapoint.content.location!.coordinates[0],
                datapoint.content.location!.coordinates[1]
              );
              //if it's refernce data, then create picture of reference
              if (datapoint.dataType==="REFERENCED"){ //strict compare
                //video
                if((datapoint.content as Ref).mediaType==='VIDEO'){
                  const youtubeID = this.extractYouTubeVideoId((datapoint.content as Ref).url);
                this.createVideoThumbnailPlane(datapoint._id!,youtubeID!,sceneCoordinates.x,0,sceneCoordinates.z);
                console.log(datapoint );//mediaType is declared under Ref in datafiles.ts
    
                }
              }
              // Set the position and add to the scene
              datapointMesh.position.set(
                sceneCoordinates.x,
                -20,
                sceneCoordinates.z
              );
          
              this.loadedDatapoints_andMesh.push(datapointMesh);
              
              this.loadedDatapoints_andMesh=this.removeDuplicatesInArray(this.loadedDatapoints_andMesh);//remove duplicates

              //Find and modify the intersections
              this.userScene.traverse((child)=>{
                nameArr.push(child.name);

                this.loadedDatapoints_andMesh.forEach((item,index) => {
                  if (child instanceof THREE.Mesh && item.name===child.name ) {
                    // Clone the Mesh to avoid sharing the same geometry/material
                    const mesh = child.clone();
                    this.loadedDatapoints_andMesh[index] = mesh; // Update the array element, cant use item cuz its only a ref
                    nameArr=this.removeDuplicatesAndEmptyElements(nameArr);

                    nameArr = this.removeStringFromArray( nameArr,child.name);


                  }
                });

              });

            });  
            
          })
          
        );

            
            if(nameArr){
              console.error("Objects:",nameArr," not found in database!")

            }

            console.log("modified scene:",this.loadedDatapoints_andMesh)
            this.UserUploadedScene=false;

        }

      
  }



  addCustomMesh(){
               // add test geometry, put here alone to avoid duplicates. 


               let cube, sphere, selectedObject;
           
 
               cube = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), this.material_test );
               sphere = new THREE.Mesh( new THREE.SphereGeometry(1, 32, 16 ), this.material_test );
               sphere.position.set(0, 5, 0);
               cube.name=("meshName");//so that Datapoint_refresh will delete the old ones as well 
               sphere.name=("meshName");

             
     
               this.loadedDatapoints_andMesh.push(cube);
               this.loadedDatapoints_andMesh.push(sphere);
  }
  
  /**
   * Loads the renderer and starts the render() function.
   */
  loadRenderer() {
    this.UserUploadedScene=false; //default 

    console.log(this.viewType);
    if (!this.objectsLoaded) {
      // Load city meshes, taken from:
      // https://www.businesslocationcenter.de/berlin3d-downloadportal/?lang=en#/export
      this.loadTiles([
        { name: 'tile1', scenePosition: new THREE.Vector3(0, 0, 0) },
        { name: 'tile2', scenePosition: new THREE.Vector3(207, -12.5, 5) },
        { name: 'tile3', scenePosition: new THREE.Vector3(-205, -2.0, -4.5) },
      ]);
      this.objectsLoaded = true;

    }
    //call to initialzed and refresh datapoints
    this.Datapoint_refresh();
    // Resize renderer window
    //this.addCustomMesh(); //Not using it, need to simply the coordinates update




    if (this.viewType === 'no-map') {
      this.windowWidth = this.container.nativeElement.clientWidth;
      this.windowHeight = (this.windowWidth / 21) * 9;
      this.renderer.setSize(this.windowWidth, this.windowHeight);
      console.log('View!');
      
    } else {
      this.windowWidth = this.container.nativeElement.clientWidth;
      this.windowHeight = (this.windowWidth / 16) * 9;
      this.renderer.setSize(this.windowWidth, this.windowHeight);
    }

    console.log('window size: ',this.windowWidth,this.windowHeight);



    this.MeshArray_toGroup();//group every mesh except the map and add to scene, 
    //this is also better for later downloading wo the map, otherwise file is too big 
    //and will cause exception
    // Append renderer
    const container = document.querySelector('.threejs-renderer');
    container!.appendChild(this.renderer.domElement);
    this.renderingStopped = false;
    this.render();
 
    //Add youtube preview, but there's no way to embed this into the scene
    //this.Add_youtube();
    this.Add_gui();

  }

  /**
   * Main render loop for the Three.js view
   */
  render() {
    
    if (!this.renderingStopped) {
      requestAnimationFrame(this.render.bind(this));
    }
    this.controls.update();

    // Update the renderer
    this.renderer.render(this.scene, this.camera);
    //this.Youtube_renderer.render(this.scene, this.camera);

  }

  /**
   * Unloads the renderer, stopping future calls for render()
   */
  unloadRenderer() {
    this.scene.remove(this.transformControl);

    this.transformControl.dispose(); 
    
  //remove old transform control when window is off, prevent transform control in the air

    this.renderingStopped = true;


    //double clean to avoid duplicates when updating collections

  this.loadedDatapoints_andMesh.forEach((datapointMesh) => {
    
    this.object_group.remove(datapointMesh);
    
  });

    this.loadedDatapoints_andMesh.length = 0;


  }

  /**
   * Hide the loading text component
   */
  hideLoadingDiv() {
    const loadingDiv = document.querySelector(
      '.threejs-loading-text'
    ) as HTMLElement;
    if (loadingDiv) {
      loadingDiv.style.display = 'none';
    }
  }

  /**
   * Translates the world coordinates (long, lat) into the scene coordinates (x, y, z).
   * @param longitude the longitude of the datapoint
   * @param latitude the latitude of the datapoint
   * @returns translated coordinates
   */
  convertCoordinates(longitude: number, latitude: number) {
    // Scaling factor, calculated based on the scene size and the long,lat coordinates of the city mesh
    const scaleFactor = 214 / (13.329418317727734 - 13.32631827581811); // Assuming x-direction corresponds to longitude
    // The relative origin of the scene. The scene coordinates of (0,0,0) now will correspond to these coordinates in long, lat system.
    const latitudeOffset = 52.513091975725075;
    const longitudeOffset = 13.327974301530459;
    // Conversion formulas
    const x = (longitude - longitudeOffset) * scaleFactor;
    const y = 0; // Assuming a flat scene, no vertical displacement
    const z = -(latitude - latitudeOffset) * scaleFactor;
    return { x, y, z };
  }

  Reverse_convertCoordinates(x: number, y: number,z:number) {
    // Scaling factor, calculated based on the scene size and the long,lat coordinates of the city mesh
    const scaleFactor = 214 / (13.329418317727734 - 13.32631827581811); // Assuming x-direction corresponds to longitude
    // The relative origin of the scene. The scene coordinates of (0,0,0) now will correspond to these coordinates in long, lat system.
    const latitudeOffset = 52.513091975725075;
    const longitudeOffset = 13.327974301530459;
    // Conversion formulas
  
    const lon = x/scaleFactor+longitudeOffset;
    const lat = z/scaleFactor+latitudeOffset;
    return { lon,lat};
  }

  /**
   * Loads the city tiles
   * @param tiles
   */
  loadTiles(tiles: CityTile[]) {
    
    tiles.forEach((tile) => {
      const objLoader2 = new OBJLoader();
      const mtlLoader2 = new MTLLoader();
      mtlLoader2.load(
        `assets/threejs-city-data/${tile.name}/${tile.name}.mtl`,
        (materials) => {
          materials.preload();
          const sc = this.scene;
          objLoader2.setMaterials(materials);
          objLoader2.load(
            `assets/threejs-city-data/${tile.name}/${tile.name}.obj`,
            (group) => {
              const mesh = <THREE.Mesh>group.children[0];
              mesh.frustumCulled = false;
              mesh.geometry.center();
              mesh.translateZ(210);
              mesh.position.copy(tile.scenePosition);
              //sc.add(mesh);
              this.hideLoadingDiv();
            }
          );
        }
      );
    });
  }


  //convert Mesh array to group for download
  MeshArray_toGroup(){
    // Add each mesh from the array to the group
    this.loadedDatapoints_andMesh.forEach((mesh) => {
      this.object_group.add(mesh);
  });
  this.scene.add(this.object_group);
  }




  
  //GUI
  Add_gui(){

    //remove old
    if (!this.gui) {
      this.gui = new GUI();
    }
    const ioFolder = this.gui.addFolder("IO");

        const ioFuncs = { 
          save: () => {
            this.object_group.updateMatrixWorld();
            this.scene.updateMatrixWorld();
            this.save(this.object_group)}, // Pass a reference to the save function
          //SaveSceneCoordinates: () =>this.SaveCoordinatesToDatabase(this.loadedDatapoints_andMesh)
        };

        ioFolder.add(ioFuncs, 'save');
        //ioFolder.add(ioFuncs, 'SaveSceneCoordinates');

        
        
        // Create a button in the folder to trigger the file input
        ioFolder.add({ UploadJSON: () => this.fileinput() }, 'UploadJSON');
        
        ioFolder.open();
          // Get the dat.gui container element and add the CSS class
          
        const guiContainer = this.gui.domElement;
        const container = document.getElementById('UI');
        container!.appendChild(guiContainer);

    
  }




  
  //download JSON
  download(content: BlobPart, fileName: string, contentType: any) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    a.remove();    

    }
  //save scene to JSON
  save(object_group:THREE.Group){
    

    const result = object_group.toJSON();

    const output =JSON.stringify(result);
    console.log("saved");

    this.download(output, 'CCC_scene.json', 'application/json')
    }


    fileinput(){
      const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            
            // Add an event listener to handle file selection
            fileInput.addEventListener('change', (event) => {
              console.log("loading:")
    
              this.UserUploadedScene=true;
                const file = (event.target as HTMLInputElement).files![0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const jsonContent = e.target?.result as string;
                        try {
    
    
                          //remove old control
                            this.scene.remove(this.transformControl);
    
                            this.transformControl.dispose(); 
    
    
                            let jsonData = JSON.parse(jsonContent);
                            // Process the JSON data as needed
                   
                            this.userScene= new THREE.ObjectLoader().parse( jsonData );
                            console.log("loaded:",this.object_group)
                            // save has duplicates
                            this.Datapoint_refresh();
                            this.MeshArray_toGroup();
                          
                        } catch (error) {
                            console.error('Invalid JSON file:', error);
                        }
                    };
                    reader.readAsText(file);
                }
            });
    
            fileInput.click();
    }


}


