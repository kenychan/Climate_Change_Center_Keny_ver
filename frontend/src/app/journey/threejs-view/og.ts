




import {
  Component,
  Input,
  SimpleChanges,
  ViewChild,
  ElementRef,
  HostListener,Renderer2, OnInit,OnDestroy,NgZone
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { CollectionData } from '../services/journey.service';
import { ViewType } from '../journey.component';
import { Observable, combineLatest } from 'rxjs';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { Raycaster, Vector2 } from 'three';

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
  private loadedDatapoints: THREE.Mesh[];
  //transformation components
  private transformControl: TransformControls;

  private selectedObject: THREE.Mesh | null = null;
  
  private selectionChangedEvent = new CustomEvent<{ lastSelected: THREE.Object3D | null, newSelected: THREE.Object3D | null }>("selectionChanged", {
    detail: { lastSelected: null, newSelected: null },
  });

  private clickedObject: THREE.Mesh;
  private material_test = new THREE.MeshStandardMaterial( { color: 0x000000 } );




  // Window properties
  private windowWidth: number ;
  private windowHeight:number;
  // Toggle parameters
  private renderingStopped = true;
  private objectsLoaded = false;

  @Input({ required: true }) collectionsData!: Observable<CollectionData>[];//get data
  @Input({ required: true }) viewType!: ViewType;

  @ViewChild('renderContainer', { static: false }) container!: ElementRef;

  //private datapointMeshes: Map<THREE.Mesh, Datafile>;



  constructor(private renderer2: Renderer2,private ngZone: NgZone) {
    this.windowWidth=this.renderer.domElement.width;
    this.windowHeight=this.renderer.domElement.height;

    console.log("ssss",this.windowWidth,this.windowHeight);

    // Scene
    this.scene = new THREE.Scene();
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
    this.camera.position.z = 5;
    // Renderer

    this.renderer.setSize(this.windowWidth, this.windowHeight);
    // Orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();
    // Datapoints
    this.loadedDatapoints = [];


      // add test geometry


    let cube, sphere, selectedObject, objGroup;
      objGroup = new THREE.Group();
      objGroup.name = "Object Group";
  
      cube = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), this.material_test );
      cube.name = "Cube";
      sphere = new THREE.Mesh( new THREE.SphereGeometry(1, 32, 16 ), this.material_test );
      sphere.position.set(0, 5, 0);
      sphere.name = "Sphere";
  
      objGroup.add( cube );
      objGroup.add( sphere );
  
      this.scene.add(objGroup);

    //set transformControl
   

    this.transformControl = new TransformControls( this.camera, this.renderer.domElement );
    this.transformControl.setMode("scale"); //also scale,rotate
    this.scene.add(this.transformControl);
    // Add event listener for 'dragging-changed' event
    this.transformControl.addEventListener('dragging-changed', (event: { [key: string]: any }) => {
      this.controls.enabled = !event['value']; // Access 'this.controls' directly
    });

    //this.transformControl.attach(cube);
 
    

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

    const intersects = raycaster.intersectObjects(this.scene.children, true);
    console.log("mouse",event.clientX ,event.clientY,this.windowWidth,this.windowHeight,mouse);
    //https://stackoverflow.com/questions/51024450/click-object-in-three-js-with-angular

    console.log("intersects select",intersects[0].object.position,intersects[0].point);
    
     // COLOR SELECTION
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); 
    ((intersects[ 0 ].object)as THREE.Mesh).material=material;

    /**for ( let i = 1; i < intersects.length; i ++ ) {

      ((intersects[ i ].object)as THREE.Mesh).material=this.material_test;

    }*/
    
    //when click a point, raycaster will cast a ray in z axis to your screen,
    // so the closest object to your screen will be saved in intersects[0], which is what you want to select
    if (intersects.length > 0) {
      this.clickedObject = intersects[0].object as THREE.Mesh; //Get the first intersection
      this.selectedObject = this.clickedObject;
      console.log("selected object",intersects[0].object.name);

      // Attach TransformControls to the selected object.
    
      this.transformControl.attach(this.selectedObject);
      
    }
    
    
  }


    // Ensure the controls and transformControl are disposed when the component is destroyed

  ngOnDestroy() {
    this.controls.dispose();
    this.transformControl.dispose();

  }


  ngOnChanges(changes: SimpleChanges) {
    
    // Remove old datapoints
    this.loadedDatapoints.forEach(() => {
      const objMesh = this.scene.getObjectByName('meshName');
      this.scene.remove(objMesh!);
    });
    this.loadedDatapoints = [];
    // Create new ones
    combineLatest(this.collectionsData).subscribe((collectionsData) =>
      collectionsData.forEach((collection) => {
        collection.files.results.forEach((datapoint) => {
          // Create new mesh for each of the datapoints
          const datapointMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: collection.color })
          );
          datapointMesh.name = 'meshName';
          datapointMesh.scale.copy(new THREE.Vector3(10, 50, 10));
          // Convert the coordinates
          const sceneCoordinates = this.convertCoordinates(
            datapoint.content.location!.coordinates[0],
            datapoint.content.location!.coordinates[1]
          );
          // Set the position and add to the scene
          datapointMesh.position.set(
            sceneCoordinates.x,
            -20,
            sceneCoordinates.z
          );
          // Copy the mesh and create the beam, beam and mesh are separated.
          const beam = new THREE.Mesh().copy(datapointMesh);
          beam.scale.copy(new THREE.Vector3(0.2, 300, 0.2));
          beam.material = new THREE.MeshBasicMaterial({
            color: collection.color,
            opacity: 0.4,
            transparent: true,
          });
          // Add the objects to the scene and array
          this.scene.add(datapointMesh);
          this.scene.add(beam);
          this.loadedDatapoints.push(datapointMesh);
          
          this.loadedDatapoints.push(beam);

      
        });
    
          
        
      })

      
    );
      
  }


  
  /**
   * Loads the renderer and starts the render() function.
   */
  loadRenderer() {
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


    // Append renderer
    const container = document.querySelector('.threejs-renderer');
    container!.appendChild(this.renderer.domElement);
    this.renderingStopped = false;
    this.render();
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

  }

  /**
   * Unloads the renderer, stopping future calls for render()
   */
  unloadRenderer() {
    this.renderingStopped = true;
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
}


