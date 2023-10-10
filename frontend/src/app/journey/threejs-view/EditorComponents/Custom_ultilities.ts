  export class CustomUtilities{
  
 public removeDuplicatesInArray(arr:THREE.Mesh[]) {
    const uniqueMap = new Map();
  
    for (const item of arr) {
      if (!uniqueMap.has(item.name)) {
        uniqueMap.set(item.name, item);
      }
    }
  
    const uniqueArray = Array.from(uniqueMap.values());
    return uniqueArray;
  }

  public removeDuplicatesAndEmptyElements<T>(arr: T[]): T[] {
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

 public  removeStringFromArray(arr: string[], target: string): string[] {
    return arr.filter((item) => item !== target);
  }



    /**
   * Translates the world coordinates (long, lat) into the scene coordinates (x, y, z).
   * @param longitude the longitude of the datapoint
   * @param latitude the latitude of the datapoint
   * @returns translated coordinates
   */
  public  convertCoordinates(longitude: number, latitude: number) {
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
      
  public  Reverse_convertCoordinates(x: number, y: number,z:number) {
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
    
}