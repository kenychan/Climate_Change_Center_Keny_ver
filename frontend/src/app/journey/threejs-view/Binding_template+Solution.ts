import { CollectionData } from '../services/journey.service';
import { ViewType } from '../journey.component';
import {
  Component,
  Input,
  SimpleChanges,
  ViewChild,
  ElementRef,
  HostListener,Renderer2, OnInit,OnDestroy,NgZone
} from '@angular/core';import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { Observable, combineLatest } from 'rxjs';

@Component({
  selector: 'app-threejs-view',
  templateUrl: './threejs-view.component.html',
  styleUrls: ['./threejs-view.component.scss'],
})
export class ThreeJSComponent implements OnInit {

  @Input({ required: true }) collectionsData!: Observable<CollectionData>[];//get data
  @Input({ required: true }) viewType!: ViewType;

  @ViewChild('renderContainer', { static: false }) container!: ElementRef;
  
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private transformControl: TransformControls;
  private selectedObject: THREE.Mesh | null = null;
  private windowWidth: number ;
  private windowHeight:number;
  private objects: THREE.Mesh[];

  constructor(private ngZone: NgZone) {
    this.objects=[]; //has to be initialized as empty array
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera(
      45,
      innerWidth / innerHeight,
      1,
      1000
    );
    this.transformControl = new TransformControls(this.camera, this.renderer.domElement);
    this.scene.add(this.transformControl);

    // Enable translation (movement) in the TransformControls.
    this.transformControl.setMode('translate');
  }

  ngOnInit(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const container = document.querySelector('.threejs-renderer');
    container!.appendChild(this.renderer.domElement);
  
    
    // Create and add objects to the scene.
    this.addCube(4, 0, 0);
    this.addCube(2, 0, 0);

    // Initialize the camera position and rendering.
    this.camera.position.z = 10;

    // Handle mouse click events on the canvas.
    this.renderer.domElement.addEventListener('click', (event) => {
      this.ngZone.run(() => {
        this.onCanvasClick(event);
      });
    });

    this.animate();
  }
  onCanvasClick(event: MouseEvent): void {
  const containerRect = this.container.nativeElement.getBoundingClientRect();
  const mouseX = event.clientX - containerRect.left;
  const mouseY = event.clientY - containerRect.top;
  console.log('container coordinate ',containerRect);

    const mouse = new THREE.Vector2(
      (mouseX / this.windowWidth) * 2 - 1,
      -(mouseY / this.windowHeight) * 2 + 1
    );
    console.log('window size: ',this.windowWidth,this.windowHeight);

    console.log("mouse",mouseX ,mouseY,this.windowWidth,this.windowHeight,mouse);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(this.objects, true);
    //*************SOLVES THE PROBLEM */
    //https://stackoverflow.com/questions/24453821/three-js-raycaster-not-detecting-scene-mesh
    //Has to save all the meshes into a mesh array, and then let raycaster selecr from the array
    console.log("intersects select",intersects[0].object.position,intersects[0].point);

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

  // Function to add cubes to the scene.
  addCube(x: number, y: number, z: number): void {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x, y, z);

    // Enable this cube for interaction with TransformControls.
    this.transformControl.attach(cube);

    this.scene.add(cube);

    this.objects.push(cube);

  }

  animate(): void {
    requestAnimationFrame(() => {
      this.animate();
    });

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
    // Render the scene.
    this.camera.aspect = this.windowWidth/this.windowHeight;
    this.renderer.render(this.scene, this.camera);
  }
}

