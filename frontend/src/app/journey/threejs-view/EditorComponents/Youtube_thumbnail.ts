import * as THREE from "three";
   
   
   
   export class YoutubeThumbnail{


    public extractYouTubeVideoId(url: string): string | null {
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






  public createVideoThumbnailPlane(DataID:string,videoId:string, x:number, y:number, z:number): THREE.Mesh {

    const thumbnailUrl = `http://localhost:3000/proxy_youtube?videoId=${videoId}`; //need to start proxy server for this to work



    const texture = new THREE.TextureLoader().load(thumbnailUrl);

    const geometry = new THREE.PlaneGeometry(32, 18); // Assuming 16:9 aspect ratio
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const plane = new THREE.Mesh(geometry, material);
    plane.name="Youtube_"+DataID;    
    plane.position.set(x,y+20,z); //y and z are somehow swapped

    return plane;
    //this.loadedDatapoints_andMesh.push(plane);


}

//create plane when ref is picture.
public createPicture(DataID:string,piclink:string, x:number, y:number, z:number): THREE.Mesh {

  const thumbnailUrl = `http://localhost:3000/proxy_picture?Pic_url=${piclink}`; //need to start proxy server for this to work


  const texture = new THREE.TextureLoader().load(thumbnailUrl);

  const geometry = new THREE.PlaneGeometry(32, 18); // Assuming 16:9 aspect ratio
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const plane = new THREE.Mesh(geometry, material);
  plane.name="Picture_"+DataID;    
  plane.position.set(x,y+20,z); //y and z are somehow swapped

  return plane;
  //this.loadedDatapoints_andMesh.push(plane);


}

//create plane when ref is picture.
public createSound(DataID:string, x:number, y:number, z:number): THREE.Mesh {

  const thumbnailUrl = `http://localhost:3000/proxy_sound?sound_url=${'https://cdn.icon-icons.com/icons2/1678/PNG/512/wondicon-ui-free-speaker_111240.png'}`; //need to start proxy server for this to work



  const texture = new THREE.TextureLoader().load(thumbnailUrl);

  const geometry = new THREE.PlaneGeometry(32, 18); // Assuming 16:9 aspect ratio
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const plane = new THREE.Mesh(geometry, material);
  plane.name="Sound_"+DataID;    
  plane.position.set(x,y+20,z); //y and z are somehow swapped

  return plane;
  //this.loadedDatapoints_andMesh.push(plane);


}



}




//NOT USED. Because CSS3D renderer can only be layered on top of WebGL renderer, can't be embeded into the scene

   /*
class YoutubeAutoplay{


    Create_Youtube_Autoplay ( id:string, x:number, y:number, z:number ) {
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
 */   
    

