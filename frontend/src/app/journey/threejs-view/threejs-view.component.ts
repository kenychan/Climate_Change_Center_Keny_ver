




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
import {
  MediaType,
  DataType,
  NotRef,
  Ref,
  Datafile,
  JsonObject,
} from '../../../../../common/types/datafile';
import { ApiService } from '../../shared/service/api.service';
import {YoutubeThumbnail} from './EditorComponents/Youtube_thumbnail';
import { CustomUtilities } from './EditorComponents/Custom_ultilities';


// Interface representing a single city tile
interface CityTile {
  name: string;
  scenePosition: THREE.Vector3;
}

// define angular component 
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
  
  private object_group = new THREE.Group();
  private gui:  GUI;


  // Window properties
  private windowWidth: number ;
  private windowHeight:number;
  // Toggle parameters
  private renderingStopped = true;
  private objectsLoaded = false;

  private UserUploadedScene:boolean;
  private userScene:THREE.Object3D;
  private YoutubeCreator = new YoutubeThumbnail();
  private CustomUtilities = new CustomUtilities();
  localData$?: Observable<any>;

  /**
   * State of the Journey.
   */

  @Input({ required: true }) collectionsData!: Observable<CollectionData>[];//get data
  @Input({ required: true }) viewType!: ViewType; //get UI status

  @ViewChild('renderContainer', { static: false }) container!: ElementRef; //get HTML render container 



//private apiService: ApiService needs to be initialized here for it to be accessable 
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
  

    this.transformControl.setMode("translate"); //also can be scale,rotate
    this.scene.add(this.transformControl);

    // Add event listener for 'dragging-changed' event
    this.transformControl.addEventListener('dragging-changed', (event: { [key: string]: any }) => {
      this.controls.enabled = !event['value']; // Access 'this.controls' directly
    });
    

  }



//Initialize click listener 
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

 

    if (intersects.length > 0) {
      const clickedObject = intersects[0].object as THREE.Mesh; // Cast to Mesh

      if (this.selectedObject !== clickedObject) {
        // Deselect the previously selected object.
        if (this.selectedObject) {
          let material_deselect = clickedObject.material; 
          //get the default material when not selected, has some logical issue when 
          //dealing with different materials. Needs to be fixed 

          this.selectedObject.material=material_deselect;//set color to selected object

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



//Everytime the collection data updates/Switch back to the tab, this function will be called to update scene
  Datapoint_refresh() {

  // Clear the old objects from the scene
  this.loadedDatapoints_andMesh.forEach((datapointMesh) => {
    
    this.object_group.remove(datapointMesh);
    
  });
  //(datapointMesh) is an arbitrary parameter name that you've chosen to represent
  // each item in the loadedDatapoints_andMesh array as you iterate through it.


    this.loadedDatapoints_andMesh.length = 0;//reset mesh array

    //Add new transfor control when data is refreshed, otherwise the control will be in the air
    this.transformControl= new TransformControls( this.camera, this.renderer.domElement );
    this.transformControl.setMode("translate"); //also scale,rotate
    this.scene.add(this.transformControl);
    this.transformControl.addEventListener('dragging-changed', (event: { [key: string]: any }) => {
      this.controls.enabled = !event['value']; // Access 'this.controls' directly
    });

    /*Create new ones when it's reading from database*/

    if (this.UserUploadedScene==false){
    combineLatest(this.collectionsData).subscribe((collectionsData) =>
      collectionsData.forEach((collection) => {
        collection.files.results.forEach((datapoint) => {
          // Create new mesh for each of the datapoints
          const datapointMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: collection.color })
          );
          datapointMesh.name = "Data_mesh_"+datapoint._id!;//set id as name+specification for later convenience
          datapointMesh.scale.copy(new THREE.Vector3(10, 50, 10));
          // Convert the coordinates
          const sceneCoordinates = this.CustomUtilities.convertCoordinates(
            datapoint.content.location!.coordinates[0],
            datapoint.content.location!.coordinates[1]
          );

          /*Youtube Thumbnial*/

          //if it's refernce data, then create picture of reference
          if (datapoint.dataType==="REFERENCED"){ //strict compare
            //video
            if((datapoint.content as Ref).mediaType==='VIDEO'){
              const youtubeID = this.YoutubeCreator.extractYouTubeVideoId((datapoint.content as Ref).url);
              const plane = this.YoutubeCreator.createVideoThumbnailPlane(datapoint._id!,youtubeID!,sceneCoordinates.x,0,sceneCoordinates.z);
              this.loadedDatapoints_andMesh.push(plane!);
           
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
          

       
        });  
        
      })
      
    );
  
    this.loadedDatapoints_andMesh=  this.CustomUtilities.removeDuplicatesInArray(this.loadedDatapoints_andMesh);//remove duplicates
  
  }

        /* Create user uploaded scene. 
        
        The main function is just a copy from the code above, but the data objects in the intersection
        will be modifed. 
        
        */
        if (this.UserUploadedScene==true){ //active through UI button
          let nameArr:string[] = [];

          //first add data, then find intersections and modify them by the user defined scene
          combineLatest(this.collectionsData).subscribe((collectionsData) =>
          collectionsData.forEach((collection) => {
            collection.files.results.forEach((datapoint) => {
              // Create new mesh for each of the datapoints
              const datapointMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 1),
                new THREE.MeshBasicMaterial({ color: collection.color })
              );
              datapointMesh.name = "Data_mesh_"+datapoint._id!;//set id as name+specification for later convenience
              datapointMesh.scale.copy(new THREE.Vector3(10, 50, 10));
              // Convert the coordinates
              const sceneCoordinates = this.CustomUtilities.convertCoordinates(
                datapoint.content.location!.coordinates[0],
                datapoint.content.location!.coordinates[1]
              );
              //if it's refernce data, then create picture of reference
              if (datapoint.dataType==="REFERENCED"){ //strict compare
                //video
                if((datapoint.content as Ref).mediaType==='VIDEO'){
                  const youtubeID = this.YoutubeCreator.extractYouTubeVideoId((datapoint.content as Ref).url);
                  const plane: THREE.Mesh = this.YoutubeCreator.createVideoThumbnailPlane(datapoint._id!,youtubeID!,sceneCoordinates.x,0,sceneCoordinates.z)!;
             
    
                }
              }
              // Set the position and add to the scene
              datapointMesh.position.set(
                sceneCoordinates.x,
                -20,
                sceneCoordinates.z
              );
          
              this.loadedDatapoints_andMesh.push(datapointMesh);
              
              this.loadedDatapoints_andMesh=this.CustomUtilities.removeDuplicatesInArray(this.loadedDatapoints_andMesh);//remove duplicates

              //Find and modify the intersections
              this.userScene.traverse((child)=>{
                nameArr.push(child.name);//for 'data not found in the database' warning. 

                this.loadedDatapoints_andMesh.forEach((item,index) => {
                  if (child instanceof THREE.Mesh && item.name===child.name ) {
                    // Clone the Mesh to avoid sharing the same geometry/material
                    const mesh = child.clone();
                    this.loadedDatapoints_andMesh[index] = mesh; // Update the array element, cant use item cuz its only a ref
                    nameArr=this.CustomUtilities.removeDuplicatesAndEmptyElements(nameArr);
                    //remove duplicated names in the nameArr, so we get a name array with unique data IDs of the intersectional selection

                    nameArr = this.CustomUtilities.removeStringFromArray( nameArr,child.name);
                    //remove the modified data IDs, so we get the IDs that are not in the intersection for later warning.

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


/*
  addCustomMesh(){
               // add test geometry


               let cube, sphere, selectedObject;
           
 
               cube = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), this.material_test );
               sphere = new THREE.Mesh( new THREE.SphereGeometry(1, 32, 16 ), this.material_test );
               sphere.position.set(0, 5, 0);
               cube.name=("meshName");//so that Datapoint_refresh will delete the old ones as well 
               sphere.name=("meshName");

             
     
               this.loadedDatapoints_andMesh.push(cube);
               this.loadedDatapoints_andMesh.push(sphere);
  }*/







  
  /**
   * Loads the renderer and starts the render() function, activates when switched to tab.
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
    this.renderingStopped = true;


      //remove old transform control when window is off, prevent transform control in the air
    this.scene.remove(this.transformControl);
    this.transformControl.dispose(); 
    
    //clean again here to avoid duplicates when updating collections
  this.loadedDatapoints_andMesh.forEach((datapointMesh) => {
    this.object_group.remove(datapointMesh);
  });
    this.loadedDatapoints_andMesh.length = 0;
  }



  /**
   * Hide the loading text component cuz it's ugly
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
              sc.add(mesh);
              this.hideLoadingDiv();
            }
          );
        }
      );
    });
  }


  //convert Mesh array to group for download, because we want to separte the map meshes and object meshes.
  //Map meshes shouldn't be downloaded
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


