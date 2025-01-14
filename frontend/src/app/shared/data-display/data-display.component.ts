import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {
  DataType,
  MediaType,
  NotRefDataFile,
  RefDataFile,
} from '@common/types';

import { Observable, delay, map, of } from 'rxjs';
import { ApiService } from '../service/api.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-data-display',
  templateUrl: './data-display.component.html',
  styleUrls: ['./data-display.component.scss'],
})
export class DataDisplayComponent implements OnChanges {
  @Input({ required: true })
  data!: RefDataFile | NotRefDataFile;
  localData$?: Observable<any>;

  @Input()
  width?: number;
  safeUrl: SafeResourceUrl;


  @Input()
  isDialog = false;

  DataType = DataType;
  MediaType = MediaType;

  CONVERSION_16_TO_9 = 0.5625;

  constructor(private apiService: ApiService,private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['data'] || this.data == null) return;
    if (
      this.data.dataType == DataType.NOTREFERENCED &&
      this.data.content.data == null
    ) {
      this.localData$ = this.apiService.getDatafile(this.data._id!);
    } else {
      this.localData$ = of((this.data as NotRefDataFile).content.data);
    }
  }

  isYoutubeVideo(url: string): boolean {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    const possibleUrls = ['youtube.com', 'youtu.be'];
    return possibleUrls.some((possibleUrl) => url.includes(possibleUrl));
  }

  isGoogledrive(url: string): boolean {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    const possibleUrls = ['drive.google.com'];
    return possibleUrls.some((possibleUrl) => url.includes(possibleUrl));
  }

  getYoutubeVideoID(url: string): string | undefined {
    if (url.includes('youtube.com')) {
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
    return undefined;
    }
    
    return url;
  }


}
